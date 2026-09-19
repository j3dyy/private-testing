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
  // Worker thread for FAIL_MODE=cpu: runs HTTP server so /healthz still answers
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`Worker thread HTTP server listening on port ${PORT}`);
    if (parentPort) {
      parentPort.postMessage('ready');
    }
  });
} else {
  console.log(`Starting service: APP_VERSION=${APP_VERSION}, FAIL_MODE=${FAIL_MODE}, PORT=${PORT}`);

  if (FAIL_MODE === 'cpu') {
    // Start worker thread to serve /healthz, then burn CPU on main thread
    const worker = new Worker(__filename);

    worker.on('message', (msg) => {
      if (msg === 'ready') {
        console.log('FAIL_MODE=cpu: worker is ready, starting main thread busy loop at ~100% CPU');
        while (true) {}
      }
    });

    worker.on('error', (err) => {
      console.error('Worker thread error:', err);
    });
  } else if (FAIL_MODE === 'crash') {
    const server = createServer();
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      console.log('FAIL_MODE=crash: will exit(1) after 20 seconds');
      setTimeout(() => {
        console.error('FAIL_MODE=crash: 20 seconds elapsed, exiting with code 1');
        process.exit(1);
      }, 20000);
    });
  } else if (FAIL_MODE === 'memory') {
    const server = createServer();
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      console.log('FAIL_MODE=memory: allocating 50 MB every 5 seconds');
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
      console.log(`Server listening on port ${PORT}`);
    });
  }
}
