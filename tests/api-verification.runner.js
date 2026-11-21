/**
 * @file api-verification.runner.js
 * @description Unified Test Runner for Weave365 Developer API & Shopify Integration Verification.
 * Executes both Developer API and Shopify Integration test suites with full summary and timing.
 */

import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runAllTests() {
  console.log('='.repeat(70));
  console.log('   WEAVE365 API & SHOPIFY INTEGRATION AUTOMATED VERIFICATION');
  console.log('='.repeat(70));
  console.log('Environment: Node.js %s | Runtime: Cloudflare Edge Emulation', process.version);
  console.log('Supabase URL: %s', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Configured');
  console.log('-'.repeat(70));

  const files = [
    path.join(__dirname, 'developer-api.test.js'),
    path.join(__dirname, 'shopify-integration.test.js'),
  ];

  const stream = run({
    files,
    concurrency: false,
  });

  stream.compose(new spec()).pipe(process.stdout);

  stream.on('test:fail', () => {
    process.exitCode = 1;
  });
}

runAllTests().catch((err) => {
  console.error('Test runner encountered an error:', err);
  process.exit(1);
});
