import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sourceRoutes = path.join(rootDir, 'scripts', 'custom_routes.json');
const targetRoutes = path.join(rootDir, '.vercel', 'output', 'static', '_routes.json');

try {
  if (fs.existsSync(sourceRoutes) && fs.existsSync(path.dirname(targetRoutes))) {
    fs.copyFileSync(sourceRoutes, targetRoutes);
    console.log('✅ Successfully applied scripts/custom_routes.json to .vercel/output/static/_routes.json');
  } else {
    console.warn('⚠️ Route files or target directory not found. Skipping _routes.json replacement.');
  }
} catch (err) {
  console.error('❌ Failed to copy custom _routes.json:', err.message);
}
