/**
 * SDK goPay 메서드 실행 과정 디버깅
 */
const { chromium } = require('playwright');

(async () => {
  console.log('🔍 SDK goPay 실행 과정 디버깅...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Console 로그 모두 출력
  page.on('console', msg => {
    console.log('📝', msg.text());
  });

  // Network 요청 모니터링
  let readyJspRequested = false;
  page.on('request', request => {
    if (request.url().includes('Ready.jsp')) {
      readyJspRequested = true;
      console.log('\n✅ Ready.jsp POST 요청 감지!');
      console.log('   URL:', request.url());
      const postData = request.postData();
      if (postData) {
        const params = new URLSearchParams(postData);
        console.log('   MID:', params.get('MID'));
        console.log('   DATA length:', params.get('DATA')?.length);
        console.log('   BLOCK_CARD_COMPANIES:', params.get('BLOCK_CARD_COMPANIES'));
      }
    }
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
      await inputs[1].fill('테스트');
    }

    console.log('\n5️⃣ 결제하기 클릭 전 - Form 상태 확인...');
    const beforeClick = await page.evaluate(() => {
      const form = document.getElementsByName('wizzpayForm')[0];
      if (!form) return { exists: false };

      return {
        exists: true,
        name: form.name,
        elementsCount: form.elements.length,
        // form.GOODSNAME 형태로 접근 가능한지 확인
        canAccessGOODSNAME: typeof form.GOODSNAME !== 'undefined',
        canAccessAMT: typeof form.AMT !== 'undefined',
        canAccessBUYERNAME: typeof form.BUYERNAME !== 'undefined',
        GOODSNAMEvalue: form.GOODSNAME?.value,
        AMTvalue: form.AMT?.value,
        BUYERNAMEvalue: form.BUYERNAME?.value,
      };
    });
    console.log('   Form 존재:', beforeClick.exists);
    if (!beforeClick.exists) {
      console.log('   ❌ Form이 아직 생성되지 않음 (결제하기 클릭 후 생성됨)');
    }

    console.log('\n6️⃣ 결제하기 버튼 클릭...');
    await page.locator('button:has-text("결제하기")').first().click();

    await page.waitForTimeout(1000);

    console.log('\n7️⃣ 결제하기 클릭 후 - Form 상태 확인...');
    const afterClick = await page.evaluate(() => {
      const form = document.getElementsByName('wizzpayForm')[0];
      if (!form) return { exists: false };

      return {
        exists: true,
        name: form.name,
        elementsCount: form.elements.length,
        elements: Array.from(form.elements).map(el => ({
          name: el.name,
          value: el.value?.substring(0, 30)
        })),
        // form.GOODSNAME 형태로 접근 가능한지 확인
        canAccessGOODSNAME: typeof form.GOODSNAME !== 'undefined',
        canAccessAMT: typeof form.AMT !== 'undefined',
        canAccessBUYERNAME: typeof form.BUYERNAME !== 'undefined',
        GOODSNAMEvalue: form.GOODSNAME?.value,
        AMTvalue: form.AMT?.value,
        BUYERNAMEvalue: form.BUYERNAME?.value,
      };
    });
    console.log('   Form 존재:', afterClick.exists);
    console.log('   Elements 개수:', afterClick.elementsCount);
    console.log('   GOODSNAME 접근 가능:', afterClick.canAccessGOODSNAME, '값:', afterClick.GOODSNAMEvalue);
    console.log('   AMT 접근 가능:', afterClick.canAccessAMT, '값:', afterClick.AMTvalue);
    console.log('   BUYERNAME 접근 가능:', afterClick.canAccessBUYERNAME, '값:', afterClick.BUYERNAMEvalue);

    console.log('\n8️⃣ wizzpayInstance 상태 확인...');
    const instanceState = await page.evaluate(() => {
      if (typeof window.wizzpayInstance === 'undefined') {
        return { exists: false };
      }

      return {
        exists: true,
        DEBUG: window.wizzpayInstance.DEBUG,
        MID: window.wizzpayInstance.MID,
        hasGoPay: typeof window.wizzpayInstance.goPay === 'function',
      };
    });
    console.log('   Instance 존재:', instanceState.exists);
    console.log('   DEBUG 모드:', instanceState.DEBUG);
    console.log('   MID:', instanceState.MID);
    console.log('   goPay 메서드:', instanceState.hasGoPay);

    await page.waitForTimeout(3000);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 결과 요약:');
    console.log('   Ready.jsp 요청 감지:', readyJspRequested ? '✅ YES' : '❌ NO');
    console.log('   Form 생성:', afterClick.exists ? '✅ YES' : '❌ NO');
    console.log('   Form Elements 접근:', afterClick.canAccessGOODSNAME ? '✅ YES' : '❌ NO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (!readyJspRequested) {
      console.log('❌ 문제: SDK의 goPay() 메서드가 제대로 실행되지 않았습니다.');
      console.log('   가능한 원인:');
      console.log('   1. Form elements가 제대로 등록되지 않음');
      console.log('   2. SDK의 validation에서 에러 발생');
      console.log('   3. goPay() 메서드가 호출되지 않음');
    }

    console.log('\n브라우저는 10초 후 닫힙니다...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.log('\n❌ 테스트 오류:', error.message);
  } finally {
    await browser.close();
    console.log('✅ 테스트 완료');
  }
})();
