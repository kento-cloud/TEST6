const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('https://pivotmedia.co.jp/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Dismiss any modals/popups
  try {
    const modal = page.locator('button:has-text("閉じる"), [aria-label="Close"], .modal-close');
    if (await modal.count() > 0) await modal.first().click({ timeout: 2000 });
  } catch {}

  // Take full hero screenshot
  await page.screenshot({ path: '/tmp/original-hero.png', clip: { x: 0, y: 0, width: 1440, height: 600 } });

  // Search for swiper pagination / indicator elements
  const result = await page.evaluate(() => {
    const results = {};

    // Method 1: find all swiper containers and their pagination
    const swipers = document.querySelectorAll('.swiper');
    results.swipers = Array.from(swipers).map(el => ({
      className: el.className,
      rect: el.getBoundingClientRect(),
      childrenClasses: Array.from(el.children).map(c => c.className),
      paginationChild: el.querySelector('.swiper-pagination') ? {
        className: el.querySelector('.swiper-pagination').className,
        rect: el.querySelector('.swiper-pagination').getBoundingClientRect(),
        childCount: el.querySelector('.swiper-pagination').children.length,
        innerHTML: el.querySelector('.swiper-pagination').innerHTML.substring(0, 500),
        styles: (() => {
          const s = getComputedStyle(el.querySelector('.swiper-pagination'));
          return { width: s.width, height: s.height, display: s.display, gap: s.gap, position: s.position, top: s.top, bottom: s.bottom, left: s.left };
        })(),
        childrenInfo: Array.from(el.querySelector('.swiper-pagination').children).slice(0, 15).map(c => {
          const s = getComputedStyle(c);
          return {
            tag: c.tagName,
            className: c.className,
            rect: c.getBoundingClientRect(),
            styles: {
              width: s.width,
              height: s.height,
              backgroundColor: s.backgroundColor,
              background: s.background,
              borderRadius: s.borderRadius,
              opacity: s.opacity,
              margin: s.margin,
              display: s.display,
            }
          };
        })
      } : null,
      progressBar: el.querySelector('.swiper-pagination-progressbar') ? {
        className: el.querySelector('.swiper-pagination-progressbar').className,
        rect: el.querySelector('.swiper-pagination-progressbar').getBoundingClientRect(),
        fill: el.querySelector('.swiper-pagination-progressbar-fill') ? {
          className: el.querySelector('.swiper-pagination-progressbar-fill').className,
          rect: el.querySelector('.swiper-pagination-progressbar-fill').getBoundingClientRect(),
          styles: (() => {
            const s = getComputedStyle(el.querySelector('.swiper-pagination-progressbar-fill'));
            return { width: s.width, height: s.height, background: s.background, transform: s.transform };
          })()
        } : null
      } : null
    }));

    // Method 2: Search by broader class patterns
    const allIndicators = document.querySelectorAll('[class*="indicator"], [class*="progress"], [class*="bar_"]');
    results.indicatorElements = Array.from(allIndicators).slice(0, 20).map(el => ({
      tag: el.tagName,
      className: el.className,
      rect: el.getBoundingClientRect(),
      childCount: el.children.length,
    }));

    // Method 3: elementFromPoint scan
    const pointResults = [];
    for (let y = 300; y <= 550; y += 10) {
      for (let x = 300; x <= 1100; x += 20) {
        const el = document.elementFromPoint(x, y);
        if (el) {
          const cls = (typeof el.className === 'string' ? el.className : '') + ' ' + (el.getAttribute('class') || '');
          if (cls.match(/progress|indicator|bar|bullet|pagination/i)) {
            const s = getComputedStyle(el);
            pointResults.push({
              x, y,
              tag: el.tagName,
              className: el.className,
              rect: el.getBoundingClientRect(),
              styles: { width: s.width, height: s.height, backgroundColor: s.backgroundColor, borderRadius: s.borderRadius, opacity: s.opacity },
            });
          }
        }
      }
    }
    // Deduplicate
    const seen = new Set();
    results.byPoint = pointResults.filter(p => {
      const key = p.className + p.rect.x + p.rect.y;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return results;
  });

  console.log(JSON.stringify(result, null, 2));

  await browser.close();
})();
