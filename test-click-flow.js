const { chromium } = require('playwright');

(async () => {
  console.log('🚀 위즈페이 실제 클릭 플로우 검수 시작\n');

  const browser = await chromium.launch({
    headless: false,  // 브라우저 화면 보기
    slowMo: 1000,     // 각 동작을 1초씩 천천히
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  // Console 로그 모니터링
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log('❌ Console Error:', text);
    } else if (text.includes('Wizzpay') || text.includes('위즈페이')) {
      console.log('💬 Console:', text);
    }
  });

  try {
    // 1단계: 메인 페이지 접속
    console.log('1️⃣ 메인 페이지 접속...');
    await page.goto('https://muyi-giftcard.vercel.app', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    console.log('✅ 메인 페이지 로드 완료\n');
    await page.screenshot({ path: './screenshots/step1-homepage.png' });
    await page.waitForTimeout(2000);

    // 2단계: 신세계상품권 선택
    console.log('2️⃣ 신세계상품권 찾기...');
    const shinsegaeCard = page.locator('div:has-text("신세계상품권")').first();
    await shinsegaeCard.scrollIntoViewIfNeeded();
    console.log('✅ 신세계상품권 카드 발견\n');
    await page.screenshot({ path: './screenshots/step2-card-found.png' });
    await page.waitForTimeout(1500);

    // 3단계: 50,000원 버튼 클릭
    console.log('3️⃣ 50,000원 버튼 클릭...');
    const button50k = page.locator('button:has-text("50,000")').first();
    await button50k.scrollIntoViewIfNeeded();
    await button50k.click();
    console.log('✅ 50,000원 선택됨\n');
    await page.screenshot({ path: './screenshots/step3-amount-selected.png' });
    await page.waitForTimeout(1500);

    // 4단계: "지금 구매하기" 버튼 클릭
    console.log('4️⃣ "지금 구매하기" 버튼 클릭...');
    const buyButton = page.locator('button:has-text("지금 구매하기")').first();
    await buyButton.scrollIntoViewIfNeeded();
    await buyButton.click();
    console.log('✅ 구매하기 버튼 클릭됨\n');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: './screenshots/step4-modal-opening.png' });

    // 5단계: 모달 열림 확인
    console.log('5️⃣ 결제 모달 확인...');
    const modal = page.locator('[class*="modal"], [role="dialog"]').first();
    const isModalVisible = await modal.isVisible().catch(() => false);

    if (isModalVisible) {
      console.log('✅ 결제 모달이 열렸습니다!\n');
      await page.screenshot({ path: './screenshots/step5-modal-opened.png' });
    } else {
      console.log('⚠️ 모달을 찾을 수 없습니다. 페이지 전체 확인...\n');
      await page.screenshot({ path: './screenshots/step5-modal-search.png' });

      // 대체 방법: 입력 필드로 모달 확인
      const nameInput = page.locator('input[placeholder*="이름"], input[type="text"]').first();
      const hasInput = await nameInput.isVisible().catch(() => false);

      if (hasInput) {
        console.log('✅ 입력 필드 발견 (모달이 열린 것으로 판단)\n');
      }
    }
    await page.waitForTimeout(2000);

    // 6단계: 정보 입력
    console.log('6️⃣ 구매자 정보 입력...');

    // 이름 입력
    const nameInput = page.locator('input[placeholder*="이름"], input[type="text"]').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.click();
      await nameInput.fill('테스트구매자');
      console.log('✅ 이름 입력: 테스트구매자');
    }

    // 전화번호 입력
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="번호"]').first();
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.click();
      await phoneInput.fill('01012345678');
      console.log('✅ 전화번호 입력: 010-1234-5678');
    }

    // 이메일 입력
    const emailInput = page.locator('input[type="email"], input[placeholder*="메일"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.click();
      await emailInput.fill('test@example.com');
      console.log('✅ 이메일 입력: test@example.com');
    }

    console.log('');
    await page.screenshot({ path: './screenshots/step6-info-filled.png' });
    await page.waitForTimeout(1500);

    // 7단계: 약관 동의 체크박스
    console.log('7️⃣ 약관 동의 체크박스 클릭...');
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible().catch(() => false)) {
      await checkbox.click();
      console.log('✅ 약관 동의 체크됨\n');
    } else {
      console.log('⚠️ 체크박스를 찾을 수 없습니다\n');
    }
    await page.screenshot({ path: './screenshots/step7-terms-agreed.png' });
    await page.waitForTimeout(1500);

    // 8단계: 결제하기 버튼 찾기
    console.log('8️⃣ 결제하기 버튼 확인...');
    const paymentButton = page.locator('button:has-text("결제")').first();
    const isPaymentButtonVisible = await paymentButton.isVisible().catch(() => false);

    if (isPaymentButtonVisible) {
      console.log('✅ 결제하기 버튼 발견!');
      const isEnabled = await paymentButton.isEnabled();
      console.log(`   버튼 활성화 상태: ${isEnabled ? '✅ 활성화' : '❌ 비활성화'}\n`);

      await page.screenshot({ path: './screenshots/step8-ready-to-pay.png' });

      console.log('⚠️  실제 결제 버튼은 클릭하지 않습니다 (테스트 모드)');
      console.log('   실제 환경에서는 여기서 위즈페이 팝업이 열립니다.\n');

      // 테스트 목적으로 버튼 클릭 (주석 해제하면 실제 위즈페이 팝업 열림)
      // await paymentButton.click();
      // await page.waitForTimeout(3000);

    } else {
      console.log('⚠️ 결제하기 버튼을 찾을 수 없습니다\n');
      await page.screenshot({ path: './screenshots/step8-button-not-found.png' });
    }

    // 9단계: WizzpayISP 객체 확인
    console.log('9️⃣ WizzpayISP 객체 존재 확인...');
    const wizzpayExists = await page.evaluate(() => {
      return typeof window.WizzpayISP !== 'undefined';
    });

    if (wizzpayExists) {
      console.log('✅ WizzpayISP 객체가 존재합니다\n');
    } else {
      console.log('⚠️ WizzpayISP 객체를 찾을 수 없습니다\n');
    }

    // 10단계: 최종 스크린샷
    console.log('🔟 최종 화면 캡처...');
    await page.screenshot({ path: './screenshots/step10-final-state.png', fullPage: true });
    console.log('✅ 최종 스크린샷 저장 완료\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 클릭 플로우 검수 완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📸 저장된 스크린샷:');
    console.log('   - step1-homepage.png (메인 페이지)');
    console.log('   - step2-card-found.png (신세계상품권 카드)');
    console.log('   - step3-amount-selected.png (50,000원 선택)');
    console.log('   - step4-modal-opening.png (구매하기 클릭)');
    console.log('   - step5-modal-opened.png (모달 열림)');
    console.log('   - step6-info-filled.png (정보 입력)');
    console.log('   - step7-terms-agreed.png (약관 동의)');
    console.log('   - step8-ready-to-pay.png (결제 준비)');
    console.log('   - step10-final-state.png (최종 상태)\n');

    console.log('⏳ 브라우저를 30초간 열어두겠습니다...');
    console.log('   (수동으로 결제 버튼을 클릭해 보실 수 있습니다)\n');

    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    await page.screenshot({ path: './screenshots/error-state.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('✅ 브라우저 종료');
  }
})();
