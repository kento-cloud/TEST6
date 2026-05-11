import { chromium } from "playwright";
import { join } from "path";

const OUT = "/Users/kazumaogata/TEST5/pivot-clone-study/snapshot";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));

  const notFound = [];
  page.on("response", (resp) => {
    if (resp.status() === 404) notFound.push(resp.url());
  });

  console.log("Loading local page...");
  await page.goto("http://localhost:8080/index-local.html", {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await page.waitForTimeout(2000);

  // Scroll full page to trigger all image loads and rendering
  console.log("Scrolling to trigger all rendering...");
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const step = window.innerHeight;
    const max = document.documentElement.scrollHeight;
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await delay(300);
    }
    window.scrollTo(0, 0);
    await delay(500);
  });

  await page.waitForTimeout(2000);

  // PC screenshot
  await page.screenshot({
    path: join(OUT, "local-pc-1440.png"),
    fullPage: true,
  });
  console.log("PC screenshot saved.");

  // SP screenshot
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const step = window.innerHeight;
    const max = document.documentElement.scrollHeight;
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await delay(300);
    }
    window.scrollTo(0, 0);
    await delay(500);
  });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: join(OUT, "local-sp-390.png"),
    fullPage: true,
  });
  console.log("SP screenshot saved.");

  if (notFound.length) {
    console.log(`\n404 errors (${notFound.length}):`);
    for (const u of notFound) console.log("  " + u);
  } else {
    console.log("\nNo 404 errors.");
  }

  if (errors.length) {
    console.log(`\nConsole errors (${errors.length}):`);
    for (const e of errors.slice(0, 10)) console.log("  " + e.slice(0, 150));
  } else {
    console.log("No console errors.");
  }

  await browser.close();
})();
