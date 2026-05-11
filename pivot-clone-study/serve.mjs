import http from "http";
import { readFileSync, existsSync, statSync } from "fs";
import { join, extname } from "path";

const ROOT = "/Users/kazumaogata/TEST5/pivot-clone-study/local-site";
const PORT = 8100;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp4": "video/mp4",
};

http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split("?")[0]);

  // Try these paths in order:
  const candidates = [
    join(ROOT, url),                    // exact path
    join(ROOT, url + ".html"),          // /movie/123 -> /movie/123.html
    join(ROOT, url, "index.html"),      // /foo/ -> /foo/index.html
  ];

  for (const filePath of candidates) {
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      const ext = extname(filePath);
      const mime = MIME[ext] || "application/octet-stream";
      const data = readFileSync(filePath);
      res.writeHead(200, { "Content-Type": mime });
      res.end(data);
      return;
    }
  }

  // Fallback: serve homepage for unknown routes
  res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
  res.end("<h1>404 - Page not found</h1><p><a href='/'>ホームに戻る</a></p>");
}).listen(PORT, () => {
  console.log(`Local PIVOT site: http://localhost:${PORT}`);
});
