import type { Page } from "playwright"

export interface RawLink {
  readonly href: string
  readonly resolvedUrl: string
  readonly isInternal: boolean
  readonly text: string
  readonly tag: string
}

/**
 * ページ内の全 <a href> を DOM API で収集する。
 * page.evaluate は文字列テンプレートで渡す（tsx __name 問題回避）。
 */
export async function collectLinks(
  page: Page,
  siteOrigin: string
): Promise<RawLink[]> {
  const origin = JSON.stringify(siteOrigin)
  const results: RawLink[] = await page.evaluate(`(() => {
    var origin = ${origin};
    var links = [];
    document.querySelectorAll('a[href]').forEach(function(el) {
      var href = el.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      var resolved = '';
      var isInternal = false;
      try {
        var u = new URL(href, origin);
        resolved = u.href;
        isInternal = (u.origin === origin);
      } catch(e) {
        resolved = href;
      }

      links.push({
        href: href,
        resolvedUrl: resolved,
        isInternal: isInternal,
        text: (el.textContent || '').trim().slice(0, 80),
        tag: el.tagName,
      });
    });
    return links;
  })()`)
  return results
}
