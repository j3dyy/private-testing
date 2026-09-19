const http = require('node:http');
const { Worker, isMainThread, parentPort } = require('node:worker_threads');

const PORT = parseInt(process.env.PORT || '3000', 10);
const APP_VERSION = (process.env.APP_VERSION || '1.0.0').replace(/^v/, '');
const FAIL_MODE = (process.env.FAIL_MODE || 'ok').trim().toLowerCase();

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (url.pathname === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('ok');
      return;
    }

    if (FAIL_MODE === 'errors') {
      setTimeout(() => {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }, 2000);
      return;
    }

    if (url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`ok v${APP_VERSION}`);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });
}

if (!isMainThread) {
  // Worker thread for cpu mode: runs HTTP server so /healthz still answers
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`listening on :${PORT}`);
    if (parentPort) {
      parentPort.postMessage('ready');
    }
  });
} else {
  if (FAIL_MODE === 'cpu') {
    const worker = new Worker(__filename);

    worker.on('message', (msg) => {
      if (msg === 'ready') {
        while (true) {}
      }
    });

    worker.on('error', (err) => {
      console.error('Worker error:', err);
    });
  } else if (FAIL_MODE === 'crash') {
    const server = createServer();
    server.listen(PORT, () => {
      console.log(`listening on :${PORT}`);
      console.log('connecting to database…');
      setTimeout(() => {
        throw new Error('connect ECONNREFUSED 10.43.0.12:5432 — database connection failed after 3 attempts');
      }, 20000);
    });
  } else if (FAIL_MODE === 'memory') {
    const server = createServer();
    server.listen(PORT, () => {
      console.log(`listening on :${PORT}`);
      const leak = [];
      setInterval(() => {
        const chunk = Buffer.alloc(50 * 1024 * 1024, 1);
        leak.push(chunk);
        console.log(`Allocated 50 MB chunk. Total referenced: ${leak.length * 50} MB`);
      }, 5000);
    });
  } else {
    // unset, "ok", or "errors"
    const server = createServer();
    server.listen(PORT, () => {
      console.log(`listening on :${PORT}`);
    });
  }
}
