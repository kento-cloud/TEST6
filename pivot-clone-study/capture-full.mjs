import { chromium } from "playwright";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { URL } from "url";

const SITE = "https://pivotmedia.co.jp";
const OUT = "/Users/kazumaogata/TEST5/pivot-clone-study/local-site";

// Pages to capture (discovered from JS analysis)
const PAGES = [
  "/",
];

// Collect all images/assets across all pages
const allAssets = new Map();

function ensureDir(p) {
  const d = dirname(p);
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

function cleanHtml(html) {
  // Remove all script tags
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  // Remove noscript
  html = html.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  // Remove tracking images
  html = html.replace(/<img[^>]*(?:googleads|doubleclick|facebook|twitter|adsrvr|analytics|googletagmanager)[^>]*\/?>/gi, "");
  html = html.replace(/<img[^>]*style="display:\s*none[^>]*\/?>/gi, "");
  // Remove uliza player styles
  html = html.replace(/<style class="vjs-styles-[^"]*">[^<]*<\/style>/gi, "");
  html = html.replace(/<link[^>]*uliza[^>]*\/?>/gi, "");

  // Fix body: remove scroll lock and pointer-events
  html = html.replace(/<body[^>]*>/, "<body>");

  // Fix image paths: /_next/image?url=X&w=Y&q=Z -> X
  html = html.replace(/\/_next\/image\?url=([^&"]*)[^"]*/g, (match, url) => {
    try { return decodeURIComponent(url); } catch { return match; }
  });

  // Fix srcset with /_next/image
  html = html.replace(/srcset="([^"]*)"/g, (match, srcset) => {
    const fixed = srcset.replace(/\/_next\/image\?url=([^&\s,]*)[^\s,]*/g, (m, u) => {
      try { return decodeURIComponent(u); } catch { return m; }
    });
    return `srcset="${fixed}"`;
  });

  // Convert absolute pivotmedia URLs to local
  html = html.replace(/https:\/\/pivotmedia\.co\.jp\//g, "/");

  // Fix lazy loading
  html = html.replace(/loading="lazy"/g, 'loading="eager"');

  // Remove pointer-events:none from inline styles
  html = html.replace(/pointer-events:\s*none;?\s*/g, "");

  // Remove data-scroll-locked CSS rules
  html = html.replace(/body\[data-scroll-locked\]\s*\{[^}]*\}/g, "");
  html = html.replace(/\.with-scroll-bars-hidden\s*\{[^}]*\}/g, "");

  // Remove signup modal (backdrop + dialog)
  // Remove backdrop
  html = html.replace(/<div[^>]*data-state="open"[^>]*class="[^"]*tw-fixed\s+tw-inset-0\s+tw-z-\[500\][^"]*"[^>]*>[\s\S]*?<\/div>/i, "");
  // Remove dialog - more careful approach
  const dialogIdx = html.indexOf('role="dialog"');
  if (dialogIdx > -1) {
    // Find the opening <div for this dialog
    let searchStart = html.lastIndexOf("<div", dialogIdx);
    if (searchStart > -1) {
      // Find matching closing div
      let depth = 0;
      let pos = searchStart;
      while (pos < html.length) {
        const nextOpen = html.indexOf("<div", pos);
        const nextClose = html.indexOf("</div>", pos);
        if (nextOpen === -1 && nextClose === -1) break;
        if (nextOpen !== -1 && (nextClose === -1 || nextOpen < nextClose)) {
          depth++;
          pos = nextOpen + 4;
        } else {
          depth--;
          pos = nextClose + 6;
          if (depth === 0) break;
        }
      }
      html = html.slice(0, searchStart) + html.slice(pos);
    }
  }

  // Add local CSS fixes
  const localCSS = `<style id="local-fixes">
html, body {
  overflow-x: hidden !important;
  overflow-y: auto !important;
  height: auto !important;
  min-height: 100vh !important;
  pointer-events: auto !important;
}
.Base_appContainer__uUROE,
.Base_contents__4Jcxx {
  overflow: visible !important;
  min-height: 100vh !important;
}
/* Video player placeholder */
.ulizahtml5, .vjs-fluid, .video-js, [class*="uliza-controller"] {
  display: none !important;
}
#pivot_web_home_movie_player {
  background: #111 !important;
  height: 462px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
#pivot_web_home_movie_player::after {
  content: "\\25B6  動画プレーヤー（ローカル）";
  color: #606370;
  font-size: 14px;
}
[style*="padding-top: 56.25"] {
  padding-top: 0 !important;
  height: 462px !important;
}
img[data-nimg] {
  opacity: 1 !important;
  transition: none !important;
}
.swiper { overflow: hidden !important; }
.swiper-wrapper { display: flex !important; }
.swiper-slide { flex-shrink: 0 !important; }
a, button, [role="tab"] { pointer-events: auto !important; cursor: pointer; }
/* Make internal links work locally */
a[href^="/"] { pointer-events: auto !important; }
</style>`;
  html = html.replace("</head>", localCSS + "\n</head>");

  return html;
}

(async () => {
  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
  });

  // Collect assets from ALL page loads
  context.on("response", async (resp) => {
    try {
      const url = resp.url();
      if (resp.status() < 200 || resp.status() >= 400) return;
      const u = new URL(url);
      // Only save pivotmedia assets + CDN assets
      if (!u.hostname.includes("pivotmedia")) return;
      const ct = resp.headers()["content-type"] || "";
      if (
        ct.includes("image") || ct.includes("font") || ct.includes("svg") ||
        ct.includes("css") ||
        url.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|css)(\?|$)/i)
      ) {
        if (!allAssets.has(u.pathname)) {
          const buf = await resp.body().catch(() => null);
          if (buf) allAssets.set(u.pathname, buf);
        }
      }
    } catch {}
  });

  // Capture homepage
  console.log("Capturing homepage...");
  const page = await context.newPage();
  await page.goto(SITE + "/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);

  // Scroll to load all lazy content
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let y = 0; y < document.documentElement.scrollHeight; y += 800) {
      window.scrollTo(0, y);
      await delay(600);
    }
    window.scrollTo(0, 0);
    await delay(1000);
  });
  await page.waitForTimeout(2000);

  // Discover linked pages from the rendered DOM
  const links = await page.evaluate(() => {
    const anchors = document.querySelectorAll("a[href]");
    const paths = new Set();
    for (const a of anchors) {
      try {
        const u = new URL(a.href);
        if (u.hostname === location.hostname && u.pathname !== "/") {
          paths.add(u.pathname);
        }
      } catch {}
    }
    return [...paths];
  });

  console.log(`Found ${links.length} internal links`);

  // Save homepage
  let html = await page.content();
  html = cleanHtml(html);
  writeFileSync(join(OUT, "index.html"), html, "utf-8");
  console.log("  Saved: index.html");

  // Screenshot
  await page.screenshot({ path: join(OUT, "screenshot-home.png"), fullPage: true });

  // Capture each linked page (limit to unique route patterns)
  const captured = new Set(["/"]);
  const routePatterns = new Map();

  for (const link of links) {
    // Deduplicate by route pattern (e.g., /movie/123 -> /movie/:id)
    const pattern = link.replace(/\/\d+/g, "/:id").replace(/\/[A-Z0-9]{20,}/g, "/:id");
    if (routePatterns.has(pattern) && routePatterns.get(pattern) >= 2) continue;
    routePatterns.set(pattern, (routePatterns.get(pattern) || 0) + 1);

    if (captured.has(link)) continue;
    captured.add(link);

    console.log(`Capturing: ${link}`);
    try {
      await page.goto(SITE + link, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(2000);

      // Scroll
      await page.evaluate(async () => {
        const delay = (ms) => new Promise((r) => setTimeout(r, ms));
        for (let y = 0; y < Math.min(document.documentElement.scrollHeight, 8000); y += 800) {
          window.scrollTo(0, y);
          await delay(400);
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1000);

      let pageHtml = await page.content();
      pageHtml = cleanHtml(pageHtml);

      // Save with proper directory structure
      let filePath = link;
      if (filePath.endsWith("/")) filePath += "index.html";
      else filePath += ".html";

      const outPath = join(OUT, filePath);
      ensureDir(outPath);
      writeFileSync(outPath, pageHtml, "utf-8");
      console.log(`  Saved: ${filePath}`);
    } catch (err) {
      console.log(`  SKIP (error): ${err.message?.slice(0, 60)}`);
    }
  }

  // Save all collected assets
  console.log(`\nSaving ${allAssets.size} assets...`);
  for (const [pathname, buf] of allAssets) {
    const outPath = join(OUT, pathname);
    ensureDir(outPath);
    writeFileSync(outPath, buf);
  }

  // Copy over CSS files and fonts from the mirror (they're already complete)
  console.log("Copying CSS and fonts from mirror...");

  await browser.close();
  console.log(`\nDone! ${captured.size} pages captured.`);
  console.log(`Output: ${OUT}`);
})();
