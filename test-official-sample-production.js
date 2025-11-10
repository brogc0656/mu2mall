/**
 * 공식 샘플 페이지 프로덕션 테스트 (mu2giftcdm)
 */
const { chromium } = require('playwright');

(async () => {
  console.log('🔍 공식 샘플 페이지 테스트 (mu2giftcdm)...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    console.log('📝', msg.text());
  });

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
        console.log('✅ Ready.jsp 요청');
      }
      if (url.includes('Index.jsp')) {
        indexJspLoaded = true;
        console.log('🎉 Index.jsp 요청! 성공!');
      }
    });

    popup.on('load', async () => {
      const popupUrl = popup.url();
      console.log('📄 팝업 로드:', popupUrl);

      if (popupUrl.includes('Index.jsp')) {
        console.log('🎉🎉🎉 Index.jsp 로드 성공! 결제 UI 표시됨!');
      }
    });
  });

  try {
    console.log('1️⃣ 공식 샘플 페이지 접속...');
    await page.goto('https://muyi-giftcard.vercel.app/Main.html', { waitUntil: 'networkidle' });
    console.log('   ✅ 접속 완료\n');

    console.log('2️⃣ 결제 버튼 클릭...');
    await page.locator('button:has-text("결제"), button.btnPay').click();

    console.log('⏳ 팝업 및 리다이렉트 대기 중...\n');
    await page.waitForTimeout(10000);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 공식 샘플 테스트 결과:');
    console.log('   Ready.jsp:', readyJspLoaded ? '✅' : '❌');
    console.log('   Index.jsp:', indexJspLoaded ? '✅ 성공!' : '❌ 실패');

    if (popupContext) {
      const finalUrl = popupContext.url();
      console.log('   최종 URL:', finalUrl);

      if (finalUrl.includes('Index.jsp')) {
        console.log('\n🎉🎉🎉 성공! 공식 샘플도 Index.jsp로 리다이렉트됨!');
        console.log('   → 이제 실제 앱에서도 동일하게 작동해야 합니다.');
      } else if (finalUrl.includes('Ready.jsp')) {
        console.log('\n❌ 공식 샘플도 Ready.jsp에서 멈춤');
        console.log('   → 계정 설정 문제일 가능성 높음');

        const bodyText = await popupContext.evaluate(() => document.body.innerText);
        if (bodyText) {
          console.log('   에러 메시지:', bodyText.substring(0, 200));
        }
      }
    } else {
      console.log('\n❌ 팝업이 열리지 않음');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('브라우저는 10초 후 닫힙니다...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.log('\n❌ 오류:', error.message);
  } finally {
    await browser.close();
    console.log('✅ 테스트 완료');
  }
})();
