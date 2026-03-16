import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export const maxDuration = 30;

// Local dev: set PUPPETEER_EXECUTABLE_PATH in .env.local
// e.g. PUPPETEER_EXECUTABLE_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
const CHROMIUM_REMOTE_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar';

export async function POST(req: NextRequest) {
  let body: { html?: string; filename?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { html, filename = 'מסלול-החיים.pdf' } = body;
  if (!html || typeof html !== 'string' || html.length > 500_000) {
    return NextResponse.json({ error: 'Invalid html' }, { status: 400 });
  }

  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ??
    (process.env.NODE_ENV === 'development'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : await chromium.executablePath(CHROMIUM_REMOTE_URL));

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 900 },
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 });

    const pdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });

    const safeName = encodeURIComponent(filename);
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${safeName}`,
      },
    });
  } finally {
    await browser.close();
  }
}
