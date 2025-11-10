/**
 * 프로덕션 위즈페이 결제 플로우 최종 테스트
 * 흰 페이지 문제 해결 확인
 */
const { chromium } = require('playwright');

(async () => {
  console.log('🚀 프로덕션 결제 플로우 테스트 시작...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 800
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });

  const page = await context.newPage();

  try {
    // 1. 사이트 접속
    console.log('1️⃣ 사이트 접속 중...');
    await page.goto('https://muyi-giftcard.vercel.app');
    await page.waitForLoadState('networkidle');
    console.log('   ✅ 접속 완료\n');

    // 2. 첫 번째 상품권의 50,000원 선택
    console.log('2️⃣ 신세계상품권 50,000원 선택...');
    const priceButtons = await page.locator('button:has-text("50,000원")').all();
    if (priceButtons.length === 0) {
      throw new Error('50,000원 버튼을 찾을 수 없습니다');
    }
    await priceButtons[0].click();
    await page.waitForTimeout(500);
    console.log('   ✅ 금액 선택 완료\n');

    // 3. 지금 구매하기 클릭
    console.log('3️⃣ "지금 구매하기" 버튼 클릭...');
    const buyButtons = await page.locator('button:has-text("지금 구매하기")').all();
    if (buyButtons.length === 0) {
      throw new Error('구매하기 버튼을 찾을 수 없습니다');
    }
    await buyButtons[0].click();
    await page.waitForTimeout(1000);
    console.log('   ✅ 클릭 완료\n');

    // 4. 모달 확인
    console.log('4️⃣ 모달 확인 중...');
    const modal = page.locator('[role="dialog"]').first();
    const isModalVisible = await modal.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isModalVisible) {
      throw new Error('모달이 표시되지 않았습니다');
    }
    console.log('   ✅ 모달 열림\n');

    // 5. 정보 입력
    console.log('5️⃣ 구매자 정보 입력...');
    const inputs = await modal.locator('input').all();

    if (inputs.length >= 3) {
      await inputs[0].fill('테스트구매자');
      await page.waitForTimeout(300);
      await inputs[1].fill('01012345678');
      await page.waitForTimeout(300);
      await inputs[2].fill('test@example.com');
      await page.waitForTimeout(500);
      console.log('   ✅ 정보 입력 완료\n');
    } else {
      throw new Error('입력 필드가 부족합니다');
    }

    // 6. API 응답 모니터링
    let apiResponse = null;
    page.on('response', async (response) => {
      if (response.url().includes('/api/payment/init')) {
        try {
          const body = await response.json();
          apiResponse = {
            status: response.status(),
            success: body.success,
            wizzUrl: body.wizzUrl,
            mid: body.mid,
            dataLength: body.data?.length || 0
          };
        } catch (e) {
          console.log('   ⚠️ API 응답 파싱 실패');
        }
      }
    });

    // 7. 결제하기 클릭
    console.log('6️⃣ "결제하기" 버튼 클릭...');
    const paymentButton = modal.locator('button:has-text("결제하기")').first();
    await paymentButton.click();
    console.log('   ✅ 클릭 완료\n');

    // 8. 위즈페이 페이지 대기
    console.log('7️⃣ 위즈페이 페이지 로딩 대기 (10초)...');
    await page.waitForTimeout(10000);

    // 9. 결과 확인
    const currentUrl = page.url();
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 테스트 결과');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (apiResponse) {
      console.log('📡 API 응답:');
      console.log(`   Status: ${apiResponse.status}`);
      console.log(`   Success: ${apiResponse.success}`);
      console.log(`   Wizzpay URL: ${apiResponse.wizzUrl}`);
      console.log(`   MID: ${apiResponse.mid}`);
      console.log(`   Data Length: ${apiResponse.dataLength} bytes\n`);
    }

    console.log('📍 현재 URL:', currentUrl);

    if (currentUrl.includes('wizzpay.co.kr')) {
      console.log('\n✅✅✅ 성공! 위즈페이 결제 화면 표시됨! ✅✅✅');
      console.log('🎯 흰 페이지 문제 해결 완료!\n');

      await page.screenshot({
        path: 'screenshots/production-wizzpay-success.png',
        fullPage: true
      });
      console.log('📸 스크린샷: screenshots/production-wizzpay-success.png');
    } else {
      const html = await page.content();
      const bodyText = await page.textContent('body');

      if (html.length < 500 || bodyText.trim().length < 50) {
        console.log('\n❌❌❌ 실패: 흰 페이지 표시됨 ❌❌❌');
        console.log(`HTML 길이: ${html.length}`);
        console.log(`텍스트: ${bodyText.substring(0, 200)}`);
      } else {
        console.log('\n⚠️ 예상치 못한 페이지');
        console.log(`HTML 길이: ${html.length}`);
        console.log(`텍스트: ${bodyText.substring(0, 200)}`);
      }

      await page.screenshot({
        path: 'screenshots/production-unexpected-page.png',
        fullPage: true
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⏰ 30초 후 브라우저를 닫습니다...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.log('\n❌ 오류 발생:', error.message);
    await page.screenshot({
      path: 'screenshots/production-error.png',
      fullPage: true
    });
    console.log('📸 에러 스크린샷: screenshots/production-error.png');
  } finally {
    await browser.close();
    console.log('✅ 테스트 완료');
  }
})();
