import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { configureSockets } from './socket.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const PORT = config.BACKEND_PORT;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveCertPath = (relativePath: string) => {
  const candidates = [
    path.resolve(process.cwd(), relativePath),
    path.resolve(__dirname, '../../', relativePath),
    path.resolve(__dirname, '../', relativePath)
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
};

const certPath = resolveCertPath(config.SSL_CERT_PATH);
const keyPath = resolveCertPath(config.SSL_KEY_PATH);

const requestHandler = (req: any, res: any) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': config.CORS_ORIGIN
  });
  res.end(
    JSON.stringify({
      status: 'success',
      message: 'SecureChat Signaling Server is active.'
    })
  );
};

let server;
let protocol = 'http';

if (config.USE_HTTPS && certPath && keyPath) {
  try {
    const options = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath)
    };
    server = createHttpsServer(options, requestHandler);
    protocol = 'https';
    console.log(`SSL Certificates loaded successfully from ${certPath}`);
  } catch (err) {
    console.warn('Failed to load SSL certificates, falling back to HTTP:', err);
    server = createHttpServer(requestHandler);
  }
} else {
  if (config.USE_HTTPS) {
    console.warn(`SSL certificates not found at ${config.SSL_CERT_PATH} / ${config.SSL_KEY_PATH}. Falling back to HTTP.`);
  }
  server = createHttpServer(requestHandler);
}

configureSockets(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Signaling Server running: Listening on ${protocol}://0.0.0.0:${PORT}`);
});