const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const app = next({ dev: false });  // Langsung set false untuk production
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3020, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3020');
  });
});