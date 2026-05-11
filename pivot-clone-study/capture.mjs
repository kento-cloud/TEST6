import { chromium } from "playwright";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { URL } from "url";

const TARGET = "https://pivotmedia.co.jp/";
const OUT_DIR = "/Users/kazumaogata/TEST5/pivot-clone-study/snapshot";

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  });

  // Collect all network responses for assets
  const collected = new Map();
  const page = await context.newPage();

  page.on("response", async (resp) => {
    try {
      const url = resp.url();
      const status = resp.status();
      if (status < 200 || status >= 400) return;
      const ct = resp.headers()["content-type"] || "";
      // Save images, fonts, svgs, css
      if (
        ct.includes("image") ||
        ct.includes("font") ||
        ct.includes("svg") ||
        url.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot|css)(\?|$)/i)
      ) {
        if (!collected.has(url)) {
          const buf = await resp.body().catch(() => null);
          if (buf) collected.set(url, buf);
        }
      }
    } catch {}
  });

  console.log("Navigating to", TARGET);
  await page.goto(TARGET, { waitUntil: "networkidle", timeout: 60000 });

  // Wait extra for lazy content
  console.log("Waiting for content to render...");
  await page.waitForTimeout(5000);

  // Scroll to trigger lazy loads
  console.log("Scrolling page to trigger lazy loads...");
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const scrollHeight = document.documentElement.scrollHeight;
    const step = window.innerHeight;
    for (let y = 0; y < scrollHeight; y += step) {
      window.scrollTo(0, y);
      await delay(800);
    }
    window.scrollTo(0, 0);
  });

  await page.waitForTimeout(3000);

  // Screenshot PC 1440px
  console.log("Taking PC screenshot (1440px)...");
  await page.screenshot({
    path: join(OUT_DIR, "pc-1440.png"),
    fullPage: true,
  });

  // Get fully rendered HTML
  console.log("Extracting rendered DOM...");
  const renderedHTML = await page.content();
  writeFileSync(join(OUT_DIR, "rendered.html"), renderedHTML, "utf-8");

  // Get all computed styles as inline snapshot
  const inlinedHTML = await page.evaluate(() => {
    return document.documentElement.outerHTML;
  });
  writeFileSync(join(OUT_DIR, "inlined.html"), "<!DOCTYPE html>\n" + inlinedHTML, "utf-8");

  // SP screenshot 390px
  console.log("Taking SP screenshot (390px)...");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: join(OUT_DIR, "sp-390.png"),
    fullPage: true,
  });

  // Save collected assets
  console.log(`Saving ${collected.size} collected assets...`);
  const siteOrigin = new URL(TARGET).origin;
  for (const [url, buf] of collected) {
    try {
      const u = new URL(url);
      let relPath;
      if (u.origin === siteOrigin) {
        relPath = u.pathname.replace(/^\//, "");
      } else {
        relPath = "_external/" + u.hostname + u.pathname;
      }
      if (!relPath || relPath.endsWith("/")) relPath += "index";
      const outPath = join(OUT_DIR, "assets-collected", relPath);
      const dir = dirname(outPath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(outPath, buf);
    } catch {}
  }

  // Also get inline styles/CSS content
  const styles = await page.evaluate(() => {
    const sheets = [];
    for (const s of document.querySelectorAll('style, link[rel="stylesheet"]')) {
      if (s.tagName === "STYLE") {
        sheets.push({ type: "inline", content: s.textContent });
      } else {
        sheets.push({ type: "link", href: s.href });
      }
    }
    return sheets;
  });
  writeFileSync(join(OUT_DIR, "stylesheets.json"), JSON.stringify(styles, null, 2), "utf-8");

  console.log("Done!");
  console.log("Files saved to:", OUT_DIR);
  await browser.close();
})();
