/**
 * 공식 샘플과 완전히 동일한 값으로 테스트
 */
const { chromium } = require('playwright');

(async () => {
  console.log('🔍 공식 샘플 값으로 테스트 (AMT=1010)...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[DEBUG]') || text.includes('WizzpayISP') || text.includes('✅')) {
      console.log('📝', text);
    }
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
        console.log('✅ Ready.jsp 요청:', url);
      }
      if (url.includes('Index.jsp')) {
        indexJspLoaded = true;
        console.log('🎉 Index.jsp 요청:', url);
      }
    });

    popup.on('load', async () => {
      const popupUrl = popup.url();
      console.log('📄 팝업 로드:', popupUrl);

      if (popupUrl.includes('Index.jsp')) {
        console.log('🎉 Index.jsp 로드 성공!');
      }
    });
  });

  try {
    await page.goto('https://muyi-giftcard.vercel.app', { waitUntil: 'networkidle' });

    // AMT를 1010원으로 변경
    await page.evaluate(() => {
      const products = window.__PRODUCTS__;
      if (products && products.length > 0) {
        products[0].amount = 1010;
      }
    });

    await page.locator('button:has-text("10,000원")').first().click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("지금 구매하기")').first().click();
    await page.waitForTimeout(1000);

    const inputs = await page.locator('input[type="tel"], input[type="text"]').all();
    if (inputs.length >= 2) {
      await inputs[0].fill('010-1234-5678');
      await inputs[1].fill('테스트');  // 공식 샘플과 동일
    }

    // 상품명도 공식 샘플과 유사하게
    await page.evaluate(() => {
      const form = document.getElementsByName('wizzpayForm')[0];
      if (form) {
        if (form.GOODSNAME) form.GOODSNAME.value = '테스트 상품입니다';
        if (form.AMT) form.AMT.value = '1010';
        if (form.BUYERNAME) form.BUYERNAME.value = '테스트';
        console.log('[수동 변경] AMT=1010, GOODSNAME=테스트 상품입니다, BUYERNAME=테스트');
      }
    });

    console.log('\n결제하기 클릭...');
    await page.locator('button:has-text("결제하기")').first().click();

    await page.waitForTimeout(10000);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 테스트 결과 (AMT=1010):');
    console.log('   Ready.jsp:', readyJspLoaded ? '✅' : '❌');
    console.log('   Index.jsp:', indexJspLoaded ? '✅ 성공!' : '❌ 실패');
    if (popupContext) {
      const finalUrl = popupContext.url();
      console.log('   최종 URL:', finalUrl);
      
      if (finalUrl.includes('Index.jsp')) {
        console.log('\n🎉🎉🎉 성공! AMT=1010으로 해결됨!');
      } else if (finalUrl.includes('Ready.jsp')) {
        console.log('\n❌ AMT도 문제가 아님');
        const bodyText = await popupContext.evaluate(() => document.body.innerText);
        if (bodyText) {
          console.log('   에러 메시지:', bodyText.substring(0, 200));
        }
      }
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await page.waitForTimeout(10000);

  } catch (error) {
    console.log('\n❌ 오류:', error.message);
  } finally {
    await browser.close();
    console.log('✅ 테스트 완료');
  }
})();
