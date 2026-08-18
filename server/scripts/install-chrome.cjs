const { spawnSync } = require('child_process');

if (
  process.env.PUPPETEER_SKIP_DOWNLOAD === 'true' ||
  process.platform === 'darwin'
) {
  process.exit(0);
}

const result = spawnSync('puppeteer', ['browsers', 'install', 'chrome'], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
