/**
 * 로컬 개발 서버에서 전체 플로우 테스트
 */
const { chromium } = require('playwright');

(async () => {
  console.log('🚀 로컬 개발 서버 테스트 시작...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  // Console 메시지 모니터링
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`❌ Console Error: ${text}`);
    } else if (type === 'log') {
      console.log(`📝 Console Log: ${text}`);
    }
  });

  // Page 에러 모니터링
  page.on('pageerror', error => {
    console.log(`💥 Page Error: ${error.message}`);
  });

  try {
    // 1. 사이트 접속
    console.log('1️⃣ 로컬 서버 접속 (http://localhost:3003)...');
    await page.goto('http://localhost:3003', { waitUntil: 'networkidle' });
    console.log('   ✅ 접속 완료\n');

    // 2. 페이지 로드 확인
    const title = await page.title();
    console.log(`📄 페이지 타이틀: ${title}\n`);

    // 3. 50,000원 선택
    console.log('2️⃣ 신세계상품권 50,000원 선택...');
    const priceButtons = await page.locator('button:has-text("50,000원")').all();
    console.log(`   발견된 50,000원 버튼: ${priceButtons.length}개`);

    if (priceButtons.length > 0) {
      await priceButtons[0].click();
      await page.waitForTimeout(500);
      console.log('   ✅ 금액 선택 완료\n');
    }

    // 4. 지금 구매하기 클릭
    console.log('3️⃣ "지금 구매하기" 버튼 클릭...');
    const buyButton = await page.locator('button:has-text("지금 구매하기")').first();
    await buyButton.click();
    await page.waitForTimeout(1000);
    console.log('   ✅ 클릭 완료\n');

    // 5. 모달 확인
    console.log('4️⃣ 구매 확인 모달 찾기...');

    // 모달이 나타날 때까지 대기
    await page.waitForTimeout(2000);

    // 모든 input 찾기 (모달 내부)
    const inputs = await page.locator('input[type="tel"], input[type="text"]').all();
    console.log(`   발견된 입력 필드: ${inputs.length}개\n`);

    if (inputs.length >= 2) {
      console.log('5️⃣ 구매자 정보 입력...');

      // 전화번호 입력
      const phoneInput = inputs[0];
      await phoneInput.fill('010-1234-5678');
      console.log('   전화번호: 010-1234-5678');

      // 구매자명 입력
      const nameInput = inputs[1];
      await nameInput.fill('테스트구매자');
      console.log('   구매자명: 테스트구매자');

      await page.waitForTimeout(500);
      console.log('   ✅ 정보 입력 완료\n');

      // 6. 결제하기 버튼 클릭
      console.log('6️⃣ "결제하기" 버튼 클릭...');
      const paymentButton = await page.locator('button:has-text("결제하기")').first();
      await paymentButton.click();
      console.log('   ✅ 클릭 완료\n');

      // 7. 위즈페이 팝업 또는 새 창 확인
      console.log('7️⃣ 위즈페이 모듈 로딩 대기 (10초)...\n');
      await page.waitForTimeout(10000);

      // 현재 페이지들 확인
      const pages = context.pages();
      console.log(`📊 열려있는 페이지: ${pages.length}개`);

      for (let i = 0; i < pages.length; i++) {
        const url = pages[i].url();
        console.log(`   페이지 ${i + 1}: ${url}`);
      }

      // 스크린샷
      await page.screenshot({
        path: 'screenshots/local-test-final.png',
        fullPage: true
      });
      console.log('\n📸 스크린샷: screenshots/local-test-final.png');

    } else {
      console.log('❌ 모달이 제대로 표시되지 않았습니다.');
      await page.screenshot({
        path: 'screenshots/local-test-modal-missing.png',
        fullPage: true
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 테스트 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⏰ 30초 후 브라우저를 닫습니다...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.log('\n❌ 오류 발생:', error.message);
    await page.screenshot({
      path: 'screenshots/local-test-error.png',
      fullPage: true
    });
  } finally {
    await browser.close();
    console.log('✅ 브라우저 종료');
  }
})();
