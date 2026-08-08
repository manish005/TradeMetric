import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../out/", import.meta.url));
const PORT = 4174;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".txt": "text/plain",
  ".woff2": "font/woff2",
};

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent((req.url || "/").split("?")[0]);
    if (path === "/") path += "/index.html";
    path = normalize(path).replace(/\\/g, "/");
    if (!path.startsWith("/")) path = "/" + path;
    const filePath = join(ROOT, path);
    const data = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": MIME[extname(path)] || "application/octet-stream",
    });
    res.end(data);
  } catch {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("FILE_NOT_FOUND");
  }
}).listen(PORT, () => console.log(`static-server on ${PORT}`));