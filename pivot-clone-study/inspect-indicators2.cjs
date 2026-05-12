const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('https://pivotmedia.co.jp/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Get the full structure of the hero/carousel area with indicators
  const result = await page.evaluate(() => {
    // Find the indicator container
    const indicators = document.querySelectorAll('.tw-h-1.tw-w-4.tw-cursor-pointer.tw-rounded-full');
    const container = indicators[0]?.parentElement;

    return {
      indicatorCount: indicators.length,
      containerClass: container ? container.className : 'not found',
      containerRect: container ? container.getBoundingClientRect() : null,
      // Get the full ancestor chain up 5 levels
      ancestors: (() => {
        let el = container;
        const chain = [];
        for (let i = 0; i < 6 && el; i++) {
          chain.push({
            tag: el.tagName,
            className: typeof el.className === 'string' ? el.className : '',
            rect: el.getBoundingClientRect(),
            childCount: el.children.length,
          });
          el = el.parentElement;
        }
        return chain;
      })(),
      // Get all siblings in the parent (the left panel)
      leftPanelChildren: container?.parentElement ? Array.from(container.parentElement.children).map(c => ({
        tag: c.tagName,
        className: typeof c.className === 'string' ? c.className : '',
        textContent: c.textContent?.substring(0, 100),
        rect: c.getBoundingClientRect(),
      })) : [],
      // Get details about the right side (video preview area)
      rightPanel: (() => {
        const heroRow = container?.parentElement?.parentElement;
        if (!heroRow) return null;
        const children = Array.from(heroRow.children);
        return children.map(c => ({
          tag: c.tagName,
          className: typeof c.className === 'string' ? c.className : '',
          rect: c.getBoundingClientRect(),
          childCount: c.children.length,
        }));
      })(),
    };
  });

  console.log(JSON.stringify(result, null, 2));

  // Take cropped screenshot of just the indicator area
  await page.screenshot({
    path: '/tmp/original-indicators-crop.png',
    clip: { x: 72, y: 540, width: 250, height: 40 }
  });

  // Take full hero screenshot without modal
  await page.screenshot({
    path: '/tmp/original-hero-clean.png',
    clip: { x: 0, y: 0, width: 1440, height: 700 }
  });

  await browser.close();
})();
