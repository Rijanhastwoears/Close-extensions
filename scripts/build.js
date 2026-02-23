import crx3 from 'crx3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const keyPath = path.join(rootDir, 'key.pem');

let privateKey = process.env.CRX_PRIVATE_KEY;

if (!privateKey && fs.existsSync(keyPath)) {
  privateKey = fs.readFileSync(keyPath, 'utf8');
}

if (!privateKey) {
  console.log('No private key found, generating one...');
  const { privateKey: newKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  privateKey = newKey;
  fs.writeFileSync(keyPath, privateKey);
  console.log(`Key saved to: ${keyPath}`);
}

const files = [
  'manifest.json',
  'popup.html',
  'popup.css',
  'popup.js',
  'icons/icon.png',
  'scripts/background.js'
].map(f => ({
  path: f,
  content: fs.readFileSync(path.join(rootDir, f))
}));

crx3(files, { privateKey, crxVersion: 3 })
  .then(crxBuffer => {
    const outputPath = path.join(rootDir, 'dist', 'bulk-close-tabs.crx');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, crxBuffer);
    console.log(`CRX created: ${outputPath}`);
  })
  .catch(err => {
    console.error('Failed to create CRX:', err);
    process.exit(1);
  });
