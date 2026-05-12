import { writeFileSync, mkdirSync, existsSync } from "fs"
import { join, dirname } from "path"
import type { Page } from "playwright"
import type { MirrorConfig } from "./types.js"
import { navigateAndLoad } from "./crawler.js"
import { collectLinks, type RawLink } from "./link-collector.js"
import { createCrawlQueue, DEFAULT_CRAWL_CONFIG, type CrawlConfig } from "./crawl-queue.js"
import { urlPathToLocalFile } from "./page-path.js"
import { getRemovePatternsJson, getKeepPatternsJson } from "./external-script-filter.js"
import type { PageLinkData, RewrittenLink } from "./link-report.js"

const PLACEHOLDER_PREFIX = "__MIRROR_LINK__:"

export interface CrawlResult {
  readonly pages: PageLinkData[]
  readonly crawledPaths: readonly string[]
}

/**
 * BFS で複数ページをクロールし、HTML を保存する。
 * JSを保持し、スクリプトURLを絶対パスに書き換える。
 */
export async function crawlMultiPage(
  page: Page,
  config: MirrorConfig,
  siteOrigin: string,
  outputDir: string,
  crawlConfig: CrawlConfig = DEFAULT_CRAWL_CONFIG
): Promise<CrawlResult> {
  const queue = createCrawlQueue(config.targetUrl, siteOrigin, crawlConfig)

  const collected: {
    path: string
    depth: number
    html: string
    links: RawLink[]
  }[] = []

  let entry = queue.dequeue()
  while (entry) {
    console.log(`\n[crawl] (${collected.length + 1}/${queue.totalVisited()}) depth=${entry.depth} ${entry.path}`)

    try {
      if (collected.length === 0) {
        const navConfig = { ...config, targetUrl: entry.url }
        await navigateAndLoad(page, navConfig)
      } else {
        await navigateToSubpage(page, entry.url)
      }

      // リンク収集
      const links = await collectLinks(page, siteOrigin)

      // 内部リンクをキューに追加
      for (const link of links) {
        if (link.isInternal) {
          queue.enqueue(link.resolvedUrl, entry.depth + 1)
        }
      }

      // DOM加工: トラッキング除去 + URL書き換え（スクリプト保持）
      const html = await localizePageWithScripts(page, siteOrigin, entry.path)

      collected.push({ path: entry.path, depth: entry.depth, html, links })
    } catch (error) {
      console.warn(`[crawl] Failed to crawl ${entry.path}:`, error)
    }

    entry = queue.dequeue()
  }

  // プレースホルダーを解決して HTML を保存
  const crawledPaths = queue.getVisitedPaths()
  const pages: PageLinkData[] = []

  for (const item of collected) {
    const { resolvedHtml, rewrittenLinks } = resolvePlaceholders(
      item.html, item.path, item.links, crawledPaths, siteOrigin
    )

    const localFile = join(outputDir, urlPathToLocalFile(item.path))
    const dir = dirname(localFile)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(localFile, resolvedHtml, "utf-8")
    console.log(`[crawl] Saved ${localFile}`)

    pages.push({
      pagePath: item.path,
      depth: item.depth,
      links: item.links,
      rewrittenLinks,
    })
  }

  // 後方互換: local.html
  const homePage = collected.find((p) => p.path === "/")
  if (homePage) {
    const { resolvedHtml } = resolvePlaceholders(
      homePage.html, "/", homePage.links, crawledPaths, siteOrigin
    )
    writeFileSync(join(outputDir, "local.html"), resolvedHtml, "utf-8")
  }

  console.log(`\n[crawl] Crawled ${collected.length} pages`)
  return { pages, crawledPaths }
}

async function navigateToSubpage(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 })
  await page.waitForTimeout(2000)
}

/**
 * スクリプトを保持したまま DOM を加工する。
 * - トラッキング系スクリプトのみ削除
 * - 内部スクリプトの src は絶対パス /_next/static/... に書き換え
 * - アセット (img, link, etc.) も絶対パスに書き換え
 * - <a> リンクはプレースホルダーに
 */
async function localizePageWithScripts(
  page: Page,
  siteOrigin: string,
  currentPagePath: string
): Promise<string> {
  const origin = JSON.stringify(siteOrigin)
  const placeholder = JSON.stringify(PLACEHOLDER_PREFIX)
  const removePatterns = getRemovePatternsJson()
  const keepPatterns = getKeepPatternsJson()

  return page.evaluate(`(() => {
    var origin = ${origin};
    var placeholder = ${placeholder};
    var removePatterns = ${removePatterns};
    var keepPatterns = ${keepPatterns};

    // --- トラッキング系スクリプトのみ削除（機能系は保持） ---
    document.querySelectorAll('script[src]').forEach(function(el) {
      var src = el.getAttribute('src') || '';
      var isKeep = keepPatterns.some(function(p) { return src.indexOf(p) !== -1; });
      if (isKeep) return;
      var isRemove = removePatterns.some(function(p) { return src.indexOf(p) !== -1; });
      if (isRemove) el.remove();
    });

    // --- hydration後にダイアログ非表示＆スクロールロック解除するスクリプトを注入 ---
    // DOM自体は変更しない（hydration mismatch防止）
    var mirrorScript = document.createElement('script');
    mirrorScript.setAttribute('data-mirror-fix', 'true');
    mirrorScript.textContent = '(' + function() {
      function fix() {
        // ダイアログ非表示
        document.querySelectorAll('[role="dialog"]').forEach(function(el) { el.style.display = "none"; });
        document.querySelectorAll('[data-state="open"].tw-fixed.tw-inset-0').forEach(function(el) { el.style.display = "none"; });
        document.querySelectorAll('[data-radix-focus-guard]').forEach(function(el) { el.style.display = "none"; });
        // スクロールロック解除
        document.body.removeAttribute("data-scroll-locked");
        document.body.style.pointerEvents = "auto";
        document.body.style.overflow = "auto";
        document.body.style.position = "static";
        // aria-hidden 解除
        document.querySelectorAll('[data-aria-hidden="true"]').forEach(function(el) {
          el.removeAttribute("data-aria-hidden");
          el.removeAttribute("aria-hidden");
        });
      }
      // hydration完了後に実行
      if (document.readyState === "complete") { setTimeout(fix, 1000); }
      else { window.addEventListener("load", function() { setTimeout(fix, 1000); }); }
      // MutationObserverでダイアログが再出現しても対応
      new MutationObserver(function() { fix(); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-state","role"] });
    }.toString() + ')()';
    document.body.appendChild(mirrorScript);

    // --- URL 書き換えヘルパー（絶対パス方式） ---
    // サーバーが /_next/ -> output/assets/_next/ にマッピングするので
    // 全ページで同じ絶対パスが使える
    function toLocalAbsolute(url) {
      try {
        var u = new URL(url, origin);
        if (u.origin === origin) {
          // 同一ドメインのアセットは絶対パスのまま
          return u.pathname;
        }
        // 外部アセットはそのまま（Uliza等の外部JSはそのまま読む）
        return url;
      } catch(e) {
        return url;
      }
    }

    // --- script[src] のURL書き換え（同一ドメインのみ） ---
    document.querySelectorAll('script[src]').forEach(function(el) {
      var src = el.getAttribute('src') || '';
      try {
        var u = new URL(src, origin);
        if (u.origin === origin) {
          el.setAttribute('src', u.pathname);
        }
        // 外部スクリプト（Uliza等）はそのまま
      } catch(e) {}
    });

    // --- img/iframe/video src ---
    document.querySelectorAll('img[src], iframe[src], video[src], source[src]').forEach(function(el) {
      var src = el.getAttribute('src');
      if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
        el.setAttribute('src', toLocalAbsolute(src));
      }
    });

    // --- link stylesheet/preload/icon href ---
    document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"], link[rel="icon"], link[rel="prefetch"]').forEach(function(el) {
      var href = el.getAttribute('href');
      if (href) {
        el.setAttribute('href', toLocalAbsolute(href));
      }
    });

    // --- srcset ---
    document.querySelectorAll('[srcset]').forEach(function(el) {
      var srcset = el.getAttribute('srcset');
      if (!srcset) return;
      var rewritten = srcset.split(',').map(function(entry) {
        var parts = entry.trim().split(/\\s+/);
        if (parts[0]) { parts[0] = toLocalAbsolute(parts[0]); }
        return parts.join(' ');
      }).join(', ');
      el.setAttribute('srcset', rewritten);
    });

    // --- background-image in style ---
    document.querySelectorAll('[style]').forEach(function(el) {
      var style = el.getAttribute('style');
      if (!style || style.indexOf('url(') === -1) return;
      var updated = style.replace(
        /url\\(["']?(https?:\\/\\/[^"')]+)["']?\\)/g,
        function(_m, rawUrl) { return 'url("' + toLocalAbsolute(rawUrl) + '")'; }
      );
      el.setAttribute('style', updated);
    });

    // --- og:image ---
    document.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]').forEach(function(el) {
      var content = el.getAttribute('content');
      if (content) { el.setAttribute('content', toLocalAbsolute(content)); }
    });

    // --- <a> リンクをプレースホルダーに ---
    document.querySelectorAll('a[href]').forEach(function(el) {
      var href = el.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      try {
        var u = new URL(href, origin);
        if (u.origin === origin) {
          el.setAttribute('href', placeholder + u.pathname);
        } else {
          el.setAttribute('target', '_blank');
          el.setAttribute('rel', 'noopener noreferrer');
        }
      } catch(e) {
        if (!href.startsWith('http')) {
          el.setAttribute('href', placeholder + href);
        }
      }
    });

    return '<!DOCTYPE html>\\n' + document.documentElement.outerHTML;
  })()`)
}

/**
 * プレースホルダーをローカルパスまたは元サイト URL に解決する。
 */
function resolvePlaceholders(
  html: string,
  currentPagePath: string,
  links: readonly RawLink[],
  crawledPaths: readonly string[],
  siteOrigin: string
): { resolvedHtml: string; rewrittenLinks: RewrittenLink[] } {
  const rewrittenLinks: RewrittenLink[] = []
  const crawledSet = new Set(crawledPaths.map((p) => p.replace(/\/+$/, "") || "/"))

  const resolvedHtml = html.replace(
    new RegExp(`${escapeRegex(PLACEHOLDER_PREFIX)}([^"<>]+)`, "g"),
    (_match, rawPath: string) => {
      const path = rawPath.replace(/\/+$/, "") || "/"
      const isCrawled = crawledSet.has(path)
      const originalLink = links.find((l) => {
        try {
          const u = new URL(l.resolvedUrl)
          return (u.pathname.replace(/\/+$/, "") || "/") === path
        } catch { return false }
      })

      // クロール済みページは絶対パスで参照（サーバーがルーティング）
      // 未クロールは元サイトに飛ばす
      const newHref = isCrawled ? path : `${siteOrigin}${path}`

      rewrittenLinks.push({
        originalHref: `${siteOrigin}${path}`,
        newHref,
        isInternal: true,
        isCrawled,
        text: originalLink?.text ?? "",
      })

      return newHref
    }
  )

  return { resolvedHtml, rewrittenLinks }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
