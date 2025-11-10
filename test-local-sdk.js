/**
 * 로컬 SDK 테스트 - 새 코드 검증
 */
const { chromium } = require('playwright');

(async () => {
  console.log('🚀 로컬 SDK 테스트 시작...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Console 로그 모니터링
  page.on('console', msg => {
    const text = msg.text();
    console.log('📝', text);
  });

  try {
    console.log('1️⃣ 로컬 서버 접속...');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
    console.log('   ✅ 접속 완료\n');

    console.log('2️⃣ 50,000원 선택...');
    await page.locator('button:has-text("50,000원")').first().click();
    await page.waitForTimeout(500);
    console.log('   ✅ 선택 완료\n');

    console.log('3️⃣ "지금 구매하기" 클릭...');
    await page.locator('button:has-text("지금 구매하기")').first().click();
    await page.waitForTimeout(1000);
    console.log('   ✅ 클릭 완료\n');

    console.log('4️⃣ 모달에서 정보 입력...');
    const inputs = await page.locator('input[type="tel"], input[type="text"]').all();
    if (inputs.length >= 2) {
      await inputs[0].fill('010-1234-5678');
      await inputs[1].fill('테스트구매자');
      console.log('   ✅ 입력 완료\n');
    }

    console.log('5️⃣ "결제하기" 클릭하고 콘솔 메시지 확인...');
    console.log('   기대하는 메시지: "✅ WizzpayISP SDK로 결제 시작"\n');

    await page.locator('button:has-text("결제하기")').first().click();
    await page.waitForTimeout(3000);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 로컬 테스트 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('위 로그에서 "✅ WizzpayISP SDK로 결제 시작" 메시지가 보이면 새 코드가 작동하는 것입니다.');
    console.log('브라우저는 20초 후 닫힙니다...\n');

    await page.waitForTimeout(20000);

  } catch (error) {
    console.log('\n❌ 오류:', error.message);
  } finally {
    await browser.close();
  }
})();
