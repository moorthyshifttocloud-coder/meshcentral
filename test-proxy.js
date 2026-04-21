const http = require('http');
const net = require('net');

const port = 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Proxy server is running!');
});

// Handle proxying HTTPS/WSS (CONNECT method)
server.on('connect', (req, clientSocket, head) => {
  const { port, hostname } = new URL(`http://${req.url}`);
  console.log(`[PROXY] Successfully intercepted connection routing to: ${hostname}:${port}`);

  const serverSocket = net.connect(port || 443, hostname, () => {
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n' + 'Proxy-agent: Node.js-Test-Proxy\r\n' + '\r\n');
    serverSocket.write(head);
    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });

  serverSocket.on('error', (err) => {
    console.log(`[PROXY ERROR] ${err.message}`);
    clientSocket.end();
  });

  clientSocket.on('error', (err) => {
    serverSocket.end();
  });
});

server.listen(port, () => {
  console.log(`Simple HTTP Test Proxy listening on port ${port}...`);
  console.log('Waiting for connections from MeshAgent...');
});
