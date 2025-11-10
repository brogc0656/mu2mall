/**
 * AMT=1010으로 테스트 (공식 샘플과 동일)
 */
const { chromium } = require('playwright');

(async () => {
  console.log('🔍 AMT=1010 테스트...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[DEBUG]') || text.includes('WizzpayISP')) {
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
        console.log('✅ Index.jsp 요청:', url);
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

    // AMT를 1010원으로 변경하기 위해 페이지 내에서 직접 수정
    await page.evaluate(() => {
      // 10,000원 상품의 amount를 1010으로 변경
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
      await inputs[1].fill('테스트');
    }

    // Form AMT 값을 1010으로 직접 변경
    await page.evaluate(() => {
      const form = document.getElementsByName('wizzpayForm')[0];
      if (form && form.AMT) {
        form.AMT.value = '1010';
        console.log('[수동 변경] AMT = 1010');
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
      console.log('   최종 URL:', popupContext.url());
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
