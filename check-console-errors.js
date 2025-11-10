/**
 * Console 에러 확인
 */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Console 메시지 캡처
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  // 에러 캡처
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  console.log('🌐 프로덕션 접속...\n');
  await page.goto('https://muyi-giftcard.vercel.app');
  await page.waitForLoadState('networkidle');

  console.log('💰 50,000원 버튼 클릭...');
  const priceButton = await page.locator('button:has-text("50,000원")').first();
  await priceButton.click();
  await page.waitForTimeout(1000);

  console.log('🛒 "지금 구매하기" 클릭...\n');
  const buyButton = await page.locator('button:has-text("지금 구매하기")').first();
  await buyButton.click();
  await page.waitForTimeout(2000);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Console 메시지');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const errorMessages = consoleMessages.filter(m => m.type === 'error');
  const warningMessages = consoleMessages.filter(m => m.type === 'warning');

  console.log(`❌ Errors: ${errorMessages.length}`);
  errorMessages.forEach((msg, i) => {
    console.log(`   ${i+1}. ${msg.text}`);
  });

  console.log(`\n⚠️  Warnings: ${warningMessages.length}`);
  warningMessages.forEach((msg, i) => {
    console.log(`   ${i+1}. ${msg.text.substring(0, 100)}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💥 Page Errors');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (pageErrors.length > 0) {
    pageErrors.forEach((err, i) => {
      console.log(`   ${i+1}. ${err}`);
    });
  } else {
    console.log('   없음');
  }

  console.log('\n10초 후 종료...');
  await page.waitForTimeout(10000);
  await browser.close();
})();
