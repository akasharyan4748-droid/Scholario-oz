import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';

const ROOT = '/app/applet';
const STANDALONE = join(ROOT, '.next/standalone');
const PORT = 3000;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// Pre-load the HTML
const htmlPath = join(STANDALONE, '.next/server/app/index.html');
const HTML = existsSync(htmlPath) ? readFileSync(htmlPath, 'utf-8') : 'Not found';

const server = createServer((req, res) => {
  const url = req.url.split('?')[0];
  
  // Serve static files from .next/static
  if (url.startsWith('/_next/static/')) {
    const filePath = join(STANDALONE, url);
    if (existsSync(filePath)) {
      const ext = extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000' });
      res.end(readFileSync(filePath));
      return;
    }
  }
  
  // Serve public files
  if (url === '/logo.svg' || url === '/favicon.ico') {
    const filePath = join(STANDALONE, url);
    if (existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
      res.end(readFileSync(filePath));
      return;
    }
  }
  
  // Serve API routes (return empty JSON for now)
  if (url.startsWith('/api/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{}');
    return;
  }
  
  // Serve the prerendered HTML for all routes
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(HTML);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
