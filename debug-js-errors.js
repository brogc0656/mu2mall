/**
 * JavaScript 에러 캡처
 */
const { chromium } = require('playwright');

(async () => {
  console.log('🔍 JavaScript 에러 디버깅...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];

  // Page 에러 캡처
  page.on('pageerror', error => {
    console.log('\n❌ JavaScript 에러 감지!');
    console.log('   메시지:', error.message);
    console.log('   Stack:', error.stack);
    errors.push(error);
  });

  // Console 에러 캡처
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('\n❌ Console 에러:', msg.text());
    } else if (msg.text().includes('WizzpayError') || msg.text().includes('required value')) {
      console.log('\n⚠️ SDK 에러:', msg.text());
    } else if (msg.text().includes('Wizzpay') || msg.text().includes('결제')) {
      console.log('📝', msg.text());
    }
  });

  // Network 요청
  page.on('request', request => {
    if (request.url().includes('Ready.jsp')) {
      console.log('\n✅ Ready.jsp POST 요청 감지!');
    }
  });

  try {
    console.log('1️⃣ 프로덕션 사이트 접속...');
    await page.goto('https://muyi-giftcard.vercel.app', { waitUntil: 'networkidle' });
    console.log('   ✅ 접속 완료\n');

    console.log('2️⃣ 10,000원 선택 → 구매하기 → 정보 입력 → 결제하기...');
    await page.locator('button:has-text("10,000원")').first().click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("지금 구매하기")').first().click();
    await page.waitForTimeout(1000);

    const inputs = await page.locator('input[type="tel"], input[type="text"]').all();
    if (inputs.length >= 2) {
      await inputs[0].fill('010-1234-5678');
      await inputs[1].fill('테스트');
    }

    console.log('\n3️⃣ 결제하기 클릭...');
    await page.locator('button:has-text("결제하기")').first().click();

    await page.waitForTimeout(5000);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 에러 요약:');
    console.log('   총 JavaScript 에러 개수:', errors.length);
    if (errors.length > 0) {
      errors.forEach((err, index) => {
        console.log(`\n   에러 ${index + 1}:`, err.message);
      });
    } else {
      console.log('   ✅ JavaScript 에러 없음');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('브라우저는 10초 후 닫힙니다...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.log('\n❌ 테스트 오류:', error.message);
  } finally {
    await browser.close();
    console.log('✅ 테스트 완료');
  }
})();
