import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Track failed image loads
  const failedImages = [];
  const loadedImages = [];

  await page.goto("http://localhost:8080/index-local.html", {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await page.waitForTimeout(2000);

  // Check all images
  const imageData = await page.evaluate(() => {
    const imgs = document.querySelectorAll("img");
    return Array.from(imgs).map((img) => ({
      src: img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
      visible: img.offsetParent !== null || img.offsetWidth > 0,
      alt: img.alt?.slice(0, 50),
      width: img.width,
      height: img.height,
    }));
  });

  const broken = imageData.filter(
    (img) => img.complete && img.naturalWidth === 0 && img.src
  );
  const loaded = imageData.filter((img) => img.naturalWidth > 0);
  const zeroSize = imageData.filter(
    (img) => img.width === 0 && img.height === 0 && img.naturalWidth > 0
  );

  console.log(`Total images: ${imageData.length}`);
  console.log(`Loaded OK: ${loaded.length}`);
  console.log(`Broken (0 naturalWidth): ${broken.length}`);
  console.log(`Zero display size: ${zeroSize.length}`);

  if (broken.length > 0) {
    console.log("\n=== BROKEN IMAGES ===");
    for (const img of broken) {
      console.log(`  ${img.src.slice(0, 120)}`);
    }
  }

  // Also check for video player overlay issues
  const videoArea = await page.evaluate(() => {
    const el = document.querySelector(".video-js");
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      visible: rect.width > 0,
      classes: el.className,
    };
  });
  console.log("\nVideo player element:", videoArea);

  // Check for large overlay cursors
  const bigCursors = await page.evaluate(() => {
    const all = document.querySelectorAll("*");
    const found = [];
    for (const el of all) {
      const cs = window.getComputedStyle(el);
      if (cs.cursor === "pointer" && el.offsetWidth > 200 && el.offsetHeight > 200) {
        found.push({
          tag: el.tagName,
          class: el.className?.slice(0, 80),
          w: el.offsetWidth,
          h: el.offsetHeight,
        });
      }
    }
    return found.slice(0, 5);
  });
  console.log("\nLarge clickable overlays:", bigCursors);

  await browser.close();
})();
