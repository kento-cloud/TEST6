import type { Page } from "playwright"

/**
 * DOM API を使って URL を書き換え、不要な要素を削除する。
 * 正規表現で HTML 文字列を加工しない。
 *
 * NOTE: page.evaluate には文字列を渡す。
 * tsx (esbuild) が関数に __name を注入してブラウザ側でエラーになるため。
 */
export async function localizeDom(
  page: Page,
  siteOrigin: string
): Promise<string> {
  const origin = JSON.stringify(siteOrigin)
  return page.evaluate(`(() => {
    var origin = ${origin};

    // --- 不要な要素を削除 ---
    // script を全て削除（Next.js が再レンダリングしてコンテンツを消すのを防ぐ）
    var removals = [
      'script',
      'noscript',
      'link[rel="preconnect"]',
      'link[rel="dns-prefetch"]',
      'link[rel="prefetch"]',
      'link[rel="preload"][as="script"]',
      'meta[name="google-site-verification"]',
      '[role="dialog"]',
      '[data-state="open"].tw-fixed.tw-inset-0',
    ];
    removals.forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el) { el.remove(); });
    });

    // --- Radix dialog のスクロールロック・aria-hidden 解除 ---
    document.body.removeAttribute('data-scroll-locked');
    document.body.style.removeProperty('pointer-events');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    // Radix focus guard 削除
    document.querySelectorAll('[data-radix-focus-guard]').forEach(function(el) { el.remove(); });
    // Radix がメインコンテンツに付与した aria-hidden / data-aria-hidden を解除
    document.querySelectorAll('[data-aria-hidden="true"]').forEach(function(el) {
      el.removeAttribute('data-aria-hidden');
      el.removeAttribute('aria-hidden');
    });

    // --- ローカル表示用レイアウト修正 ---
    // Next.js の SPA 前提レイアウト (height:100% + overflow-y:auto) を
    // 静的HTML向けにフルフロー化する
    var styleEl = document.createElement('style');
    styleEl.textContent = [
      '.home2_home__contents__WvcMw { height: auto !important; overflow-y: visible !important; }',
      '.home2_home__Gy_qP { height: auto !important; }',
      '.Base_appContainer__uUROE { min-height: auto !important; height: auto !important; }',
      'html, body { overflow: auto !important; height: auto !important; }',
    ].join('\\n');
    document.head.appendChild(styleEl);

    // --- URL 書き換えヘルパー ---
    function toLocal(url) {
      try {
        var u = new URL(url, origin);
        if (u.origin === origin) {
          var path = u.pathname.replace(/^\\//, '');
          return 'assets/' + (path || 'index');
        }
        return 'assets/_external/' + u.hostname + u.pathname;
      } catch(e) {
        return url;
      }
    }

    // --- src 属性 ---
    document.querySelectorAll('[src]').forEach(function(el) {
      var src = el.getAttribute('src');
      if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
        el.setAttribute('src', toLocal(src));
      }
    });

    // --- href 属性 (stylesheet, preload, icon) ---
    document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"], link[rel="icon"], link[rel="prefetch"]').forEach(function(el) {
      var href = el.getAttribute('href');
      if (href) {
        el.setAttribute('href', toLocal(href));
      }
    });

    // --- <a> の内部リンクを元サイトの絶対URLに変換 ---
    document.querySelectorAll('a[href]').forEach(function(el) {
      var href = el.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#') || href.startsWith('http') || href.startsWith('data:') || href.startsWith('mailto:')) return;
      // 内部の相対パスを元サイトの絶対URLに変換
      try {
        var abs = new URL(href, origin).href;
        el.setAttribute('href', abs);
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      } catch(e) {}
    });

    // --- srcset 属性 ---
    document.querySelectorAll('[srcset]').forEach(function(el) {
      var srcset = el.getAttribute('srcset');
      if (!srcset) return;
      var rewritten = srcset.split(',').map(function(entry) {
        var parts = entry.trim().split(/\\s+/);
        if (parts[0]) { parts[0] = toLocal(parts[0]); }
        return parts.join(' ');
      }).join(', ');
      el.setAttribute('srcset', rewritten);
    });

    // --- background-image in style attributes ---
    document.querySelectorAll('[style]').forEach(function(el) {
      var style = el.getAttribute('style');
      if (!style || style.indexOf('url(') === -1) return;
      var updated = style.replace(
        /url\\(["']?(https?:\\/\\/[^"')]+)["']?\\)/g,
        function(_match, rawUrl) { return 'url("' + toLocal(rawUrl) + '")'; }
      );
      el.setAttribute('style', updated);
    });

    // --- meta og:image ---
    document.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]').forEach(function(el) {
      var content = el.getAttribute('content');
      if (content) {
        el.setAttribute('content', toLocal(content));
      }
    });

    return '<!DOCTYPE html>\\n' + document.documentElement.outerHTML;
  })()`)
}

/**
 * DOM から不要要素を除去した「クリーン版」を取得（URLは書き換えない）
 */
export async function cleanDom(page: Page): Promise<string> {
  return page.evaluate(`(() => {
    var clone = document.documentElement.cloneNode(true);

    var removals = [
      'script[src*="gtag"]',
      'script[src*="analytics"]',
      'script[src*="tag-manager"]',
      'script[src*="googletagmanager"]',
      'script[src*="facebook"]',
      'script[src*="twitter"]',
      'script[src*="karte"]',
      'script#karte-inline',
      'script#karte-sdk',
      'noscript',
      'link[rel="preconnect"]',
      'link[rel="dns-prefetch"]',
      '[role="dialog"]',
      '[data-state="open"].tw-fixed.tw-inset-0',
    ];
    removals.forEach(function(sel) {
      clone.querySelectorAll(sel).forEach(function(el) { el.remove(); });
    });

    // --- Radix dialog のスクロールロック・aria-hidden 解除 ---
    var body = clone.querySelector('body');
    if (body) {
      body.removeAttribute('data-scroll-locked');
      body.style.removeProperty('pointer-events');
      body.style.removeProperty('overflow');
      body.style.removeProperty('padding-right');
    }
    clone.querySelectorAll('[data-radix-focus-guard]').forEach(function(el) { el.remove(); });
    clone.querySelectorAll('[data-aria-hidden="true"]').forEach(function(el) {
      el.removeAttribute('data-aria-hidden');
      el.removeAttribute('aria-hidden');
    });

    return '<!DOCTYPE html>\\n' + clone.outerHTML;
  })()`)
}
