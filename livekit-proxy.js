const https = require('https');
const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

// Configuration
const PROXY_PORT = 7443;
const TARGET_PORT = 7880;
const CERT_FILE = 'meshcentral-data/webserver-cert-public.crt';
const KEY_FILE = 'meshcentral-data/webserver-cert-private.key';

if (!fs.existsSync(CERT_FILE) || !fs.existsSync(KEY_FILE)) {
    console.error('Error: MeshCentral certificates not found in meshcentral-data/');
    process.exit(1);
}

const options = {
    key: fs.readFileSync(KEY_FILE),
    cert: fs.readFileSync(CERT_FILE)
};

// 1. Create HTTPS Proxy (for validation requests)
const server = https.createServer(options, (req, res) => {
    const targetReq = http.request({
        host: '127.0.0.1',
        port: TARGET_PORT,
        path: req.url,
        method: req.method,
        headers: req.headers
    }, (targetRes) => {
        res.writeHead(targetRes.statusCode, targetRes.headers);
        targetRes.pipe(res);
    });

    targetReq.on('error', (e) => {
        res.writeHead(502);
        res.end('Bad Gateway: ' + e.message);
    });

    req.pipe(targetReq);
});

// 2. Create WSS Proxy (for signaling)
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    const targetWs = new WebSocket('ws://127.0.0.1:' + TARGET_PORT + req.url);

    ws.on('message', (msg) => { if (targetWs.readyState === WebSocket.OPEN) targetWs.send(msg); });
    targetWs.on('message', (msg) => { if (ws.readyState === WebSocket.OPEN) ws.send(msg); });

    ws.on('close', () => targetWs.close());
    targetWs.on('close', () => ws.close());

    ws.on('error', (e) => console.error('Client WS Error:', e));
    targetWs.on('error', (e) => console.error('Target WS Error:', e));
});

server.listen(PROXY_PORT, () => {
    console.log(`LiveKit Secure Proxy running at https://localhost:${PROXY_PORT}`);
    console.log(`Forwarding to http://localhost:${TARGET_PORT}`);
});
