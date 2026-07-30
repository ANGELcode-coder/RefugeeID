const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const DIST = path.join(__dirname, 'dist');
const PORT = 3000;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

const POLYFILL = `<script>
globalThis.__loadBundleAsync = globalThis.__loadBundleAsync || (async (bundle) => {
  try {
    const url = bundle.url || bundle;
    const script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load chunk: ' + url));
    });
  } catch (e) {
    console.error('[chunk-loader]', e);
    throw e;
  }
});
<\/script>`;

const gzipCache = {};

function preCompressDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fp = path.join(dir, f);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) preCompressDir(fp);
    else if (f.endsWith('.js') || f.endsWith('.json') || f.endsWith('.css') || f === 'index.html') {
      const gzPath = fp + '.gz';
      let data = fs.readFileSync(fp);
      if (f === 'index.html') {
        const injected = data.toString().replace('</head>', POLYFILL + '</head>');
        data = Buffer.from(injected);
        fs.writeFileSync(fp, data);
      }
      const compressed = zlib.gzipSync(data, { level: 9 });
      fs.writeFileSync(gzPath, compressed);
      gzipCache[fp] = compressed;
      console.log(`gzip ${f}: ${(data.length / 1024).toFixed(0)}KB → ${(compressed.length / 1024).toFixed(0)}KB`);
    }
  }
}

preCompressDir(DIST);

function getChecksum(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return `"${stat.mtimeMs}-${stat.size}"`;
  } catch { return null; }
}

const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  let filePath = path.join(DIST, url === '/' ? 'index.html' : url);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';
  const acceptEncoding = req.headers['accept-encoding'] || '';

  const cacheControl = ext === '.js' || ext === '.css' || ext === '.json'
    ? 'public, max-age=31536000, immutable'
    : 'public, max-age=3600';

  const etag = getChecksum(filePath);
  if (etag && req.headers['if-none-match'] === etag) {
    res.writeHead(304, { 'Connection': 'keep-alive' });
    res.end();
    return;
  }

  try {
    const data = fs.readFileSync(filePath);
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      'Vary': 'Accept-Encoding',
      'ETag': etag,
      'Connection': 'keep-alive',
    };

    if (acceptEncoding.includes('gzip') && gzipCache[filePath]) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      res.end(gzipCache[filePath]);
      return;
    }

    res.writeHead(200, headers);
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.keepAliveTimeout = 5000;
server.headersTimeout = 6000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
