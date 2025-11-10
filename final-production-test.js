/**
 * 최종 프로덕션 결제 플로우 테스트
 * 실제 페이지 구조에 맞춰 작성
 */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000  // 천천히 실행
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });

  const page = await context.newPage();

  try {
    console.log('🌐 프로덕션 사이트 접속...');
    await page.goto('https://muyi-giftcard.vercel.app');
    await page.waitForLoadState('networkidle');

    console.log('✅ 페이지 로드 완료');

    // 첫 번째 상품권 카드의 50,000원 버튼 클릭
    console.log('💰 50,000원 버튼 클릭 (신세계상품권)...');
    const priceButtons = await page.locator('button', { hasText: '50,000원' }).all();
    if (priceButtons.length > 0) {
      await priceButtons[0].click();
      await page.waitForTimeout(500);
      console.log('✅ 금액 선택 완료');
    } else {
      throw new Error('50,000원 버튼을 찾을 수 없습니다');
    }

    // "지금 구매하기" 버튼 클릭
    console.log('🛒 "지금 구매하기" 버튼 클릭...');
    const buyButton = await page.locator('button', { hasText: '지금 구매하기' }).first();
    await buyButton.click();
    await page.waitForTimeout(1000);
    console.log('✅ 구매하기 버튼 클릭 완료');

    // 모달 확인
    const modal = await page.locator('[role="dialog"]').first();
    const isModalVisible = await modal.isVisible({ timeout: 3000 }).catch(() => false);

    if (!isModalVisible) {
      console.log('❌ 모달이 표시되지 않았습니다');
      await browser.close();
      return;
    }

    console.log('✅ 모달 열림');

    // 구매자 정보 입력
    console.log('📝 구매자 정보 입력...');

    const inputs = await page.locator('input').all();
    console.log(`   입력 필드 ${inputs.length}개 발견`);

    // 이름, 전화번호, 이메일 순서로 입력
    if (inputs.length >= 3) {
      await inputs[0].fill('테스트구매자');
      await page.waitForTimeout(300);
      await inputs[1].fill('01012345678');
      await page.waitForTimeout(300);
      await inputs[2].fill('test@example.com');
      await page.waitForTimeout(500);
      console.log('✅ 정보 입력 완료');
    }

    // API 요청 모니터링
    let paymentInitResponse = null;
    page.on('response', async (response) => {
      if (response.url().includes('/api/payment/init')) {
        try {
          const body = await response.json();
          paymentInitResponse = {
            status: response.status(),
            body: body
          };
          console.log('\n📡 결제 초기화 API 응답:');
          console.log(`   Status: ${response.status()}`);
          console.log(`   Success: ${body.success}`);
          console.log(`   Transaction ID: ${body.transactionId}`);
          console.log(`   Wizzpay URL: ${body.wizzUrl}`);
          console.log(`   MID: ${body.mid}`);
          console.log(`   Data length: ${body.data?.length || 0} bytes\n`);
        } catch (e) {
          console.log('❌ API 응답 파싱 실패:', e.message);
        }
      }
    });

    // "결제하기" 버튼 클릭
    console.log('💳 "결제하기" 버튼 클릭...');
    const paymentButton = await page.locator('button', { hasText: '결제하기' }).first();
    await paymentButton.click();

    console.log('⏳ 위즈페이 페이지 로딩 대기 (10초)...');
    await page.waitForTimeout(10000);

    // 결과 확인
    const currentUrl = page.url();
    console.log('\n📍 현재 URL:', currentUrl);

    if (currentUrl.includes('wizzpay.co.kr')) {
      console.log('\n✅✅✅ 성공: 위즈페이 결제 화면 표시됨! ✅✅✅');
      console.log('🎯 흰 페이지 문제 해결 완료!');

      // 스크린샷
      await page.screenshot({
        path: 'screenshots/production-wizzpay-payment-page.png',
        fullPage: true
      });
      console.log('📸 스크린샷: screenshots/production-wizzpay-payment-page.png');
    } else {
      // 페이지 내용 확인
      const html = await page.content();
      const bodyText = await page.textContent('body');

      if (html.length < 500 || bodyText.trim().length < 50) {
        console.log('\n❌❌❌ 실패: 흰 페이지 표시됨 ❌❌❌');
        console.log('페이지 HTML 길이:', html.length);
        console.log('페이지 텍스트:', bodyText.substring(0, 200));
      } else {
        console.log('\n⚠️ 예상치 못한 페이지');
        console.log('HTML 길이:', html.length);
        console.log('페이지 텍스트:', bodyText.substring(0, 200));
      }
    }

    if (paymentInitResponse) {
      console.log('\n📊 결제 초기화 API 정보:');
      console.log(JSON.stringify(paymentInitResponse, null, 2));
    }

    console.log('\n⏰ 30초 후 브라우저를 닫습니다...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.log('\n❌ 오류 발생:', error.message);
    await page.screenshot({ path: 'screenshots/error-state.png' });
  } finally {
    await browser.close();
  }
})();
