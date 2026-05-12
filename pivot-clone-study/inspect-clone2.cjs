const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: '/tmp/clone-hero.png',
    clip: { x: 0, y: 0, width: 1440, height: 700 }
  });

  const result = await page.evaluate(() => {
    // Look for the video player section
    const sections = document.querySelectorAll('section');
    return {
      sectionCount: sections.length,
      sections: Array.from(sections).map(s => ({
        className: s.className,
        rect: s.getBoundingClientRect(),
        childCount: s.children.length,
      })),
      // Check for any indicator-like elements
      indicatorElements: (() => {
        const allEls = document.querySelectorAll('*');
        const bars = [];
        for (const el of allEls) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 5 && rect.width < 60 && rect.height > 1 && rect.height < 10 && rect.top > 200 && rect.top < 700) {
            const s = getComputedStyle(el);
            if (s.display !== 'none' && s.visibility !== 'hidden') {
              bars.push({
                tag: el.tagName,
                className: typeof el.className === 'string' ? el.className : '',
                rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              });
            }
          }
        }
        return bars;
      })(),
    };
  });

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
