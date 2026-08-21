/* eslint-disable */
const http = require('http');

const server = http.createServer((clientReq, clientRes) => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: clientReq.url,
    method: clientReq.method,
    headers: clientReq.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes);
  });

  proxyReq.on('error', () => {
    clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
    clientRes.end('Bad Gateway');
  });

  clientReq.pipe(proxyReq);
});

server.listen(8081, () => {
  console.log('Proxy on 8081');
});
