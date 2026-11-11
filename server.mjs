// Small static file server for the built site (the dist/ folder).
// It listens on the port in the PORT environment variable, which is what Google Cloud Run expects (8080).
// It has no dependencies, so it runs with plain `node server.mjs` after `npm run build`.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { gzip } from "node:zlib";

const gzipAsync = promisify(gzip);
const ROOT = resolve(fileURLToPath(new URL("./dist", import.meta.url)));
const PORT = Number(process.env.PORT) || 8080;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
};
const COMPRESSIBLE = new Set([".html", ".css", ".js", ".json", ".txt", ".svg"]);

/** @type {Map<string, Buffer>} */
const gzipCache = new Map();

function cacheControl(urlPath, ext) {
  if (urlPath.startsWith("/assets/")) return "public, max-age=31536000, immutable"; // hashed file names
  if (ext === ".html") return "no-cache";
  if (ext === ".woff2") return "public, max-age=2592000";
  return "public, max-age=86400"; // photo, CV and favicon: a replaced file shows within a day
}

function send(res, status, headers, body) {
  res.writeHead(status, {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    ...headers,
  });
  res.end(body);
}

/** Turn a request path into a file inside ROOT, or null if it points elsewhere. */
async function resolveFile(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;

  const candidate = join(ROOT, normalize(decoded));
  if (candidate !== ROOT && !candidate.startsWith(ROOT + sep)) return null;

  try {
    const info = await stat(candidate);
    if (info.isDirectory()) {
      const index = join(candidate, "index.html");
      return { file: index, info: await stat(index) };
    }
    return { file: candidate, info };
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return send(res, 405, { Allow: "GET, HEAD" }, "Method not allowed");
    }

    let urlPath;
    try {
      urlPath = new URL(req.url ?? "/", "http://localhost").pathname;
    } catch {
      return send(res, 400, { "Content-Type": TYPES[".txt"] }, "Bad request");
    }

    const found = await resolveFile(urlPath);
    if (!found) return send(res, 404, { "Content-Type": TYPES[".txt"] }, "Not found");

    const ext = extname(found.file).toLowerCase();
    const etag = `W/"${found.info.size}-${Math.floor(found.info.mtimeMs)}"`;
    const headers = {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": cacheControl(urlPath, ext),
      ETag: etag,
      Vary: "Accept-Encoding",
    };

    if (req.headers["if-none-match"] === etag) return send(res, 304, headers);

    let body = await readFile(found.file);
    const wantsGzip = /\bgzip\b/.test(String(req.headers["accept-encoding"] ?? ""));
    if (wantsGzip && COMPRESSIBLE.has(ext) && body.length > 1024) {
      const key = `${found.file}:${etag}`;
      let zipped = gzipCache.get(key);
      if (!zipped) {
        zipped = await gzipAsync(body);
        gzipCache.set(key, zipped);
      }
      body = zipped;
      headers["Content-Encoding"] = "gzip";
    }

    headers["Content-Length"] = body.length;
    return send(res, 200, headers, req.method === "HEAD" ? undefined : body);
  } catch (error) {
    console.error(error);
    return send(res, 500, { "Content-Type": TYPES[".txt"] }, "Server error");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Serving ${ROOT} on port ${PORT}`);
});

// Cloud Run sends SIGTERM when it stops an instance: finish open requests, then exit.
process.on("SIGTERM", () => server.close(() => process.exit(0)));
