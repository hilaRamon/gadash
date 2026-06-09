import { existsSync } from 'fs';
import puppeteer from 'puppeteer';

const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
];

function resolveExecutablePath(): string | undefined {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (fromEnv) return fromEnv;

  if (process.platform === 'darwin') {
    const macChrome =
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    if (existsSync(macChrome)) return macChrome;
  }

  return undefined;
}

function isRetryablePuppeteerError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /connection closed|target closed|session closed|browser has disconnected|protocol error/i.test(
    message,
  );
}

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    executablePath: resolveExecutablePath(),
    args: LAUNCH_ARGS,
  });
}

async function renderPdfOnce(html: string): Promise<Buffer> {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'load', timeout: 30_000 });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await page.close().catch(() => undefined);
    }
  } finally {
    await browser.close().catch(() => undefined);
  }
}

export async function renderCustomerBillPdf(html: string): Promise<Buffer> {
  try {
    return await renderPdfOnce(html);
  } catch (firstError) {
    if (!isRetryablePuppeteerError(firstError)) {
      throw firstError;
    }
    return renderPdfOnce(html);
  }
}
