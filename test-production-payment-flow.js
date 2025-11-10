/**
 * 프로덕션 결제 플로우 전체 테스트
 * 위즈페이 팝업이 제대로 열리고 흰 페이지가 아닌지 확인
 */
const { chromium } = require('playwright');

(async () => {
  console.log('🚀 프로덕션 결제 플로우 테스트 시작...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Console 로그 모니터링
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('WizzpayISP') || text.includes('Wizzpay') || text.includes('결제')) {
      console.log('📝', text);
    }
  });

  try {
    console.log('1️⃣ 프로덕션 사이트 접속...');
    await page.goto('https://muyi-giftcard.vercel.app', { waitUntil: 'networkidle' });
    console.log('   ✅ 접속 완료\n');

    console.log('2️⃣ 50,000원 상품 선택...');
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

    console.log('5️⃣ 결제하기 버튼 클릭...');

    // 팝업 이벤트 리스너 등록
    const popupPromise = context.waitForEvent('page', { timeout: 10000 });

    await page.locator('button:has-text("결제하기")').first().click();
    console.log('   ✅ 결제 버튼 클릭됨\n');

    console.log('6️⃣ 위즈페이 팝업 대기 중...');
    try {
      const popup = await popupPromise;
      await popup.waitForLoadState('networkidle', { timeout: 10000 });

      const popupUrl = popup.url();
      console.log('   ✅ 팝업 열림!');
      console.log('   📍 팝업 URL:', popupUrl);

      // 팝업 내용 확인
      await popup.waitForTimeout(2000);
      const bodyText = await popup.evaluate(() => document.body.innerText);
      const bodyTextLength = bodyText.trim().length;

      console.log('\n7️⃣ 팝업 내용 분석...');
      console.log('   Body 텍스트 길이:', bodyTextLength);
      console.log('   Body 텍스트 앞 200자:', bodyText.substring(0, 200));

      if (popupUrl.includes('Index.jsp')) {
        console.log('\n   🎉 SUCCESS: Index.jsp 페이지 로드됨 (결제 모듈)');
      } else if (popupUrl.includes('Ready.jsp')) {
        console.log('\n   ⚠️ WARNING: Ready.jsp에 머물러 있음');

        if (bodyTextLength < 100) {
          console.log('   ❌ 흰 페이지 상태 (내용 없음)');
        } else {
          console.log('   ⏳ 리다이렉트 대기 중... (5초)');
          await popup.waitForTimeout(5000);

          const newUrl = popup.url();
          console.log('   새 URL:', newUrl);

          if (newUrl.includes('Index.jsp')) {
            console.log('   ✅ Index.jsp로 리다이렉트 성공!');
          } else {
            console.log('   ❌ 리다이렉트 실패 - 여전히 Ready.jsp');
          }
        }
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ 프로덕션 결제 플로우 테스트 완료');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('팝업은 수동으로 확인하세요. 브라우저는 30초 후 닫힙니다...\n');

      await page.waitForTimeout(30000);

    } catch (popupError) {
      console.log('   ❌ 팝업 열리지 않음:', popupError.message);
      console.log('\n   원인 분석 중...');

      // 에러 로그 확인
      const errorLogs = [];
      page.on('pageerror', error => errorLogs.push(error.message));

      console.log('   JavaScript 에러:', errorLogs.length > 0 ? errorLogs : '없음');
    }

  } catch (error) {
    console.log('\n❌ 테스트 오류:', error.message);
    await page.screenshot({ path: 'screenshots/production-payment-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('✅ 테스트 완료');
  }
})();
