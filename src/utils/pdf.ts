import puppeteer from 'puppeteer';

export async function htmlToPdfBuffer(html: string) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const buffer = await page.pdf({ format: 'A4' });
  await browser.close();
  return buffer;
}
