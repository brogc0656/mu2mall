const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🌐 메인 페이지 접속...');
  await page.goto('https://muyi-giftcard.vercel.app');
  await page.waitForLoadState('networkidle');

  console.log('✅ 메인 페이지 로드 완료');

  // 신세계 상품권 50,000원 선택
  console.log('🎯 신세계 상품권 50,000원 선택...');
  const button50k = page.locator('button:has-text("50,000원")').first();
  await button50k.click();
  await page.waitForTimeout(1000);

  // 구매하기 버튼 클릭
  console.log('🛒 구매하기 버튼 클릭...');
  const buyButton = page.locator('button:has-text("구매하기")').first();
  await buyButton.click();
  await page.waitForTimeout(3000);

  console.log('📄 현재 URL:', page.url());

  // 결제 페이지인지 확인
  if (page.url().includes('/payment')) {
    console.log('✅ 결제 페이지 진입 성공!');

    // 스크린샷
    await page.screenshot({ path: './payment-page.png', fullPage: true });
    console.log('📸 결제 페이지 스크린샷 저장');

    // Wizzpay 스크립트 확인
    console.log('\n🔍 Wizzpay 관련 스크립트 확인...');
    const scripts = await page.locator('script').all();
    let wizzpayFound = false;

    for (const script of scripts) {
      const src = await script.getAttribute('src');
      if (src && (src.includes('wizz') || src.includes('wizzauth'))) {
        console.log('✅ Wizzpay 스크립트:', src);
        wizzpayFound = true;
      }
    }

    if (!wizzpayFound) {
      console.log('⚠️  Wizzpay 스크립트를 찾을 수 없습니다');
    }

    // 입력 필드 확인
    console.log('\n📝 입력 필드 확인...');
    const nameInput = page.locator('input[placeholder*="이름"], input[id*="name"]').first();
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="번호"]').first();
    const emailInput = page.locator('input[type="email"]').first();

    if (await nameInput.count() > 0) {
      console.log('✅ 이름 입력 필드 존재');
      await nameInput.fill('테스트구매자');
    }

    if (await phoneInput.count() > 0) {
      console.log('✅ 전화번호 입력 필드 존재');
      await phoneInput.fill('010-1234-5678');
    }

    if (await emailInput.count() > 0) {
      console.log('✅ 이메일 입력 필드 존재');
      await emailInput.fill('test@example.com');
    }

    // 약관 동의 체크박스
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.count() > 0) {
      console.log('✅ 약관 동의 체크박스 클릭');
      await checkbox.click();
      await page.waitForTimeout(1000);
    }

    // 최종 스크린샷
    await page.screenshot({ path: './payment-page-filled.png', fullPage: true });
    console.log('📸 입력 완료 스크린샷 저장');

    // 결제 버튼 찾기
    const payButton = page.locator('button:has-text("결제")');
    if (await payButton.count() > 0) {
      console.log('\n✅ 결제 버튼 발견!');
      console.log('⚠️  실제 결제는 진행하지 않습니다 (테스트 모드)');

      // 결제 버튼 활성화 여부 확인
      const isEnabled = await payButton.first().isEnabled();
      console.log('결제 버튼 활성화 상태:', isEnabled ? '✅ 활성화' : '❌ 비활성화');
    }

    // WizzpayISP 객체 확인
    console.log('\n🔍 WizzpayISP 객체 확인...');
    const wizzpayExists = await page.evaluate(() => {
      return typeof window.WizzpayISP !== 'undefined';
    });
    console.log('WizzpayISP 존재:', wizzpayExists ? '✅ 존재함' : '❌ 없음');

    // 환경 변수 노출 확인
    console.log('\n🔐 환경 변수 노출 확인...');
    const pageContent = await page.content();
    const sensitiveKeywords = ['WIZZPAY_MID', 'WIZZPAY_PASSWORD', 'CHLIFES_ENC_KEY'];
    let exposed = false;

    for (const keyword of sensitiveKeywords) {
      if (pageContent.includes(keyword)) {
        console.log('⚠️  민감 정보 발견:', keyword);
        exposed = true;
      }
    }

    if (!exposed) {
      console.log('✅ 민감 정보 노출 없음');
    }

  } else {
    console.log('❌ 결제 페이지로 이동하지 못했습니다');
    console.log('현재 URL:', page.url());
  }

  console.log('\n⏳ 30초 대기 - 페이지를 확인하세요...');
  await page.waitForTimeout(30000);

  await browser.close();
  console.log('✅ 테스트 완료!');
})();
