const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('https://pivotmedia.co.jp/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Dismiss modal
  try {
    const closeBtn = page.locator('button[aria-label="Close"], button:has-text("×"), .close, [class*="close"]');
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click({ timeout: 3000 });
      await page.waitForTimeout(500);
    }
  } catch (e) {
    console.error('No modal close button found, trying ESC');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Take screenshot after modal dismissed
  await page.screenshot({ path: '/tmp/original-hero-clean.png', clip: { x: 0, y: 0, width: 1440, height: 700 } });

  // Now look for the indicator bars - they appear to be at the bottom of the hero area
  // From the screenshot, they're around y=565, x=120-280
  const result = await page.evaluate(() => {
    const results = {};

    // Scan the bottom of the hero area where indicators appeared
    const pointResults = [];
    for (let y = 540; y <= 600; y += 5) {
      for (let x = 100; x <= 350; x += 5) {
        const el = document.elementFromPoint(x, y);
        if (el && !pointResults.find(p => p.element === el)) {
          const s = getComputedStyle(el);
          pointResults.push({
            element: el,
            x, y,
            tag: el.tagName,
            className: typeof el.className === 'string' ? el.className : '',
            id: el.id,
            rect: el.getBoundingClientRect(),
            styles: {
              width: s.width,
              height: s.height,
              backgroundColor: s.backgroundColor,
              background: s.background,
              borderRadius: s.borderRadius,
              opacity: s.opacity,
              display: s.display,
            },
            parentClass: el.parentElement ? (typeof el.parentElement.className === 'string' ? el.parentElement.className : '') : '',
            parentTag: el.parentElement ? el.parentElement.tagName : '',
          });
        }
      }
    }
    // Remove element refs for serialization
    results.bottomHeroPoints = pointResults.map(({ element, ...rest }) => rest);

    // Also search for any element that looks like a small bar (width < 50, height < 10)
    const allEls = document.querySelectorAll('*');
    const smallBars = [];
    for (const el of allEls) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 10 && rect.width < 60 && rect.height > 1 && rect.height < 10 && rect.top > 400 && rect.top < 700) {
        const s = getComputedStyle(el);
        if (s.display !== 'none' && s.visibility !== 'hidden') {
          smallBars.push({
            tag: el.tagName,
            className: typeof el.className === 'string' ? el.className : '',
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            styles: {
              width: s.width,
              height: s.height,
              backgroundColor: s.backgroundColor,
              borderRadius: s.borderRadius,
              opacity: s.opacity,
            },
            parentClass: el.parentElement ? (typeof el.parentElement.className === 'string' ? el.parentElement.className : '') : '',
            grandparentClass: el.parentElement?.parentElement ? (typeof el.parentElement.parentElement.className === 'string' ? el.parentElement.parentElement.className : '') : '',
          });
        }
      }
    }
    results.smallBars = smallBars;

    // Search for elements with "Hero" in class name
    const heroEls = document.querySelectorAll('[class*="Hero"], [class*="hero"], [class*="banner"], [class*="Banner"]');
    results.heroElements = Array.from(heroEls).map(el => ({
      tag: el.tagName,
      className: typeof el.className === 'string' ? el.className : '',
      rect: el.getBoundingClientRect(),
      childCount: el.children.length,
    }));

    return results;
  });

  console.log(JSON.stringify(result, null, 2));

  await browser.close();
})();
