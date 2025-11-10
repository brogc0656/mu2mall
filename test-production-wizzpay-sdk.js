/**
 * 프로덕션 Wizzpay SDK 테스트
 */
const { chromium } = require('playwright');

(async () => {
  console.log('🚀 프로덕션 Wizzpay SDK 테스트 시작...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Console 로그 모니터링
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('WizzpayISP') || text.includes('Wizzpay')) {
      console.log('📝', text);
    }
  });

  try {
    console.log('1️⃣ 프로덕션 사이트 접속...');
    await page.goto('https://muyi-giftcard.vercel.app', { waitUntil: 'networkidle' });
    console.log('   ✅ 접속 완료\n');

    console.log('2️⃣ Wizzpay SDK 스크립트 로드 확인...');
    const scripts = await page.evaluate(() => {
      const scriptTags = Array.from(document.querySelectorAll('script'));
      return scriptTags.map(s => s.src).filter(src => src.includes('wizzauth'));
    });
    console.log('   스크립트:', scripts);
    console.log(`   ✅ Wizzpay SDK 스크립트 ${scripts.length}개 발견\n`);

    console.log('3️⃣ WizzpayISP 클래스 존재 확인...');
    const hasWizzpayISP = await page.evaluate(() => {
      return typeof window.WizzpayISP === 'function';
    });
    console.log('   WizzpayISP 클래스:', hasWizzpayISP ? '✅ 존재' : '❌ 없음');

    console.log('\n4️⃣ wizzpayInstance 초기화 확인...');
    await page.waitForTimeout(3000); // SDK 초기화 대기
    const hasInstance = await page.evaluate(() => {
      return typeof window.wizzpayInstance !== 'undefined';
    });
    console.log('   wizzpayInstance:', hasInstance ? '✅ 초기화됨' : '❌ 초기화 안됨');

    if (hasInstance) {
      const instanceInfo = await page.evaluate(() => {
        const instance = window.wizzpayInstance;
        return {
          hasGoPay: typeof instance.goPay === 'function',
          hasSetResultFunction: typeof instance.setResultFunction === 'function',
          hasGetResultData: typeof instance.getResultData === 'function',
        };
      });
      console.log('   - goPay 메서드:', instanceInfo.hasGoPay ? '✅' : '❌');
      console.log('   - setResultFunction 메서드:', instanceInfo.hasSetResultFunction ? '✅' : '❌');
      console.log('   - getResultData 메서드:', instanceInfo.hasGetResultData ? '✅' : '❌');
    }

    console.log('\n5️⃣ 50,000원 상품 선택...');
    const priceButton = await page.locator('button:has-text("50,000원")').first();
    await priceButton.click();
    await page.waitForTimeout(500);
    console.log('   ✅ 선택 완료\n');

    console.log('6️⃣ "지금 구매하기" 클릭...');
    const buyButton = await page.locator('button:has-text("지금 구매하기")').first();
    await buyButton.click();
    await page.waitForTimeout(1000);
    console.log('   ✅ 클릭 완료\n');

    console.log('7️⃣ 모달 표시 확인...');
    const modalVisible = await page.locator('[role="dialog"]').isVisible();
    console.log('   모달:', modalVisible ? '✅ 표시됨' : '❌ 표시 안됨');

    if (modalVisible) {
      console.log('\n8️⃣ 정보 입력...');
      const inputs = await page.locator('input[type="tel"], input[type="text"]').all();
      if (inputs.length >= 2) {
        await inputs[0].fill('010-1234-5678');
        await inputs[1].fill('테스트구매자');
        console.log('   ✅ 입력 완료\n');

        console.log('9️⃣ "결제하기" 버튼 클릭 준비...');
        const paymentButton = await page.locator('button:has-text("결제하기")').first();
        console.log('   결제하기 버튼:', await paymentButton.isVisible() ? '✅ 보임' : '❌ 안보임');

        console.log('\n⚠️ 실제 결제하기 버튼은 클릭하지 않습니다 (테스트 계정 보호)');
        console.log('   수동으로 클릭하여 Wizzpay 모듈이 표시되는지 확인하세요.');
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 프로덕션 Wizzpay SDK 테스트 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 요약:');
    console.log(`   - SDK 스크립트: ${scripts.length > 0 ? '✅' : '❌'}`);
    console.log(`   - WizzpayISP 클래스: ${hasWizzpayISP ? '✅' : '❌'}`);
    console.log(`   - wizzpayInstance 초기화: ${hasInstance ? '✅' : '❌'}`);
    console.log(`   - 모달 표시: ${modalVisible ? '✅' : '❌'}`);
    console.log('\n브라우저는 30초 후 자동으로 닫힙니다...');

    await page.waitForTimeout(30000);

  } catch (error) {
    console.log('\n❌ 오류:', error.message);
    await page.screenshot({ path: 'screenshots/production-sdk-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('✅ 테스트 완료');
  }
})();
