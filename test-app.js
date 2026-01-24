const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  console.log('Navigating to http://localhost:4200...');

  try {
    await page.goto('http://localhost:4200', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    console.log('Page loaded successfully!');

    // Get page content
    const content = await page.content();
    console.log('Page title:', await page.title());
    console.log('Content length:', content.length);

    // Check if Angular loaded
    const appRoot = await page.$('app-root');
    if (appRoot) {
      const innerHTML = await page.evaluate(el => el.innerHTML, appRoot);
      console.log('app-root innerHTML length:', innerHTML.length);
      console.log('app-root preview:', innerHTML.substring(0, 500));
    }

  } catch (error) {
    console.log('ERROR:', error.message);
  }

  await browser.close();
  console.log('Done.');
})();
