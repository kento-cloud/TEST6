const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Take full hero screenshot
  await page.screenshot({
    path: '/tmp/clone-hero.png',
    clip: { x: 0, y: 0, width: 1440, height: 700 }
  });

  // Check if any indicators exist
  const result = await page.evaluate(() => {
    // Search for small bar-like elements in the hero area
    const allEls = document.querySelectorAll('*');
    const smallBars = [];
    for (const el of allEls) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 5 && rect.width < 60 && rect.height > 1 && rect.height < 10 && rect.top > 200 && rect.top < 700) {
        const s = getComputedStyle(el);
        if (s.display !== 'none' && s.visibility !== 'hidden' && rect.width !== rect.height) {
          smallBars.push({
            tag: el.tagName,
            className: typeof el.className === 'string' ? el.className : '',
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            styles: { width: s.width, height: s.height, backgroundColor: s.backgroundColor, borderRadius: s.borderRadius, opacity: s.opacity },
          });
        }
      }
    }

    // Check if VideoPlayer has any indicator-like elements
    const videoSection = document.querySelector('section');
    return {
      smallBars,
      videoSectionExists: !!videoSection,
      videoSectionHTML: videoSection ? videoSection.outerHTML.substring(0, 1000) : 'not found',
    };
  });

  console.log(JSON.stringify(result, null, 2));

  await browser.close();
})();
