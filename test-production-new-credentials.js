/**
 * 새로운 프로덕션 자격 증명(mu2giftcdm) 테스트
 */
const { chromium } = require('playwright');

(async () => {
  console.log('🔍 프로덕션 결제 플로우 테스트 (mu2giftcdm)...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Console 로그 모니터링
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[DEBUG]') || text.includes('WizzpayISP') || text.includes('결제')) {
      console.log('📝', text);
    }
  });

  // Network 모니터링
  let readyJspLoaded = false;
  let indexJspLoaded = false;
  let popupContext = null;

  page.on('popup', async popup => {
    console.log('\n🔔 팝업 감지!');
    popupContext = popup;

    popup.on('request', request => {
      const url = request.url();
      if (url.includes('Ready.jsp')) {
        readyJspLoaded = true;
        console.log('✅ Ready.jsp 요청:', url);
      }
      if (url.includes('Index.jsp')) {
        indexJspLoaded = true;
        console.log('✅ Index.jsp 요청:', url);
      }
    });

    popup.on('load', async () => {
      const popupUrl = popup.url();
      console.log('📄 팝업 로드 완료:', popupUrl);

      if (popupUrl.includes('Ready.jsp')) {
        console.log('⏳ Ready.jsp 로딩 중... Index.jsp 리다이렉트 대기...');
      } else if (popupUrl.includes('Index.jsp')) {
        console.log('🎉 Index.jsp 로드 성공! 결제 UI가 나타났습니다!');
      }
    });
  });

  try {
    console.log('1️⃣ 프로덕션 사이트 접속...');
    await page.goto('https://muyi-giftcard.vercel.app', { waitUntil: 'networkidle' });
    console.log('   ✅ 접속 완료\n');

    console.log('2️⃣ 10,000원 상품 선택...');
    await page.locator('button:has-text("10,000원")').first().click();
    await page.waitForTimeout(500);

    console.log('3️⃣ "지금 구매하기" 클릭...');
    await page.locator('button:has-text("지금 구매하기")').first().click();
    await page.waitForTimeout(1000);

    console.log('4️⃣ 모달에서 정보 입력...');
    const inputs = await page.locator('input[type="tel"], input[type="text"]').all();
    if (inputs.length >= 2) {
      await inputs[0].fill('010-1234-5678');
      await inputs[1].fill('테스트구매자');
    }

    console.log('\n5️⃣ 결제하기 클릭...');
    await page.locator('button:has-text("결제하기")').first().click();

    // 팝업 대기 (최대 10초)
    console.log('⏳ 팝업 및 리다이렉트 대기 중...\n');
    await page.waitForTimeout(10000);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 테스트 결과:');
    console.log('   Ready.jsp 요청:', readyJspLoaded ? '✅ 감지됨' : '❌ 감지 안됨');
    console.log('   Index.jsp 요청:', indexJspLoaded ? '✅ 감지됨 (문제 해결!)' : '❌ 감지 안됨');

    if (popupContext) {
      const popupUrl = popupContext.url();
      console.log('   최종 팝업 URL:', popupUrl);

      if (popupUrl.includes('Index.jsp')) {
        console.log('\n🎉🎉🎉 성공! Ready.jsp → Index.jsp 리다이렉트 완료!');
        console.log('   흰 페이지 문제가 해결되었습니다!');
      } else if (popupUrl.includes('Ready.jsp')) {
        console.log('\n❌ 여전히 Ready.jsp에서 멈춤');

        // 팝업 내용 확인
        const bodyText = await popupContext.evaluate(() => document.body.innerText);
        console.log('   Body 텍스트 길이:', bodyText.length);
        if (bodyText.length > 0) {
          console.log('   Body 내용:', bodyText.substring(0, 200));
        }
      }
    } else {
      console.log('\n❌ 팝업이 열리지 않음');
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
