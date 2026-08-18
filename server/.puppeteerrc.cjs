const { join } = require('path');

/**
 * Keep Chrome inside the project so Render copies it from build to runtime.
 * The default cache (`/opt/render/.cache/puppeteer`) is outside the app dir
 * and is not available when the service starts.
 *
 * @type {import('puppeteer').Configuration}
 */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
