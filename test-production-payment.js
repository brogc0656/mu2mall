/**
 * 프로덕션 사이트 결제 플로우 전체 테스트
 * 흰 페이지 문제가 해결되었는지 확인
 */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500  // 사용자가 볼 수 있도록 느리게
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  });

  const page = await context.newPage();

  console.log('🌐 프로덕션 사이트 접속: https://muyi-giftcard.vercel.app');
  await page.goto('https://muyi-giftcard.vercel.app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log('📱 신세계상품권 선택...');
  const giftcardCard = await page.locator('button', { hasText: '신세계상품권' }).first();
  await giftcardCard.click();
  await page.waitForTimeout(500);

  console.log('💰 50,000원 금액 선택...');
  const amountButton = await page.locator('button', { hasText: '50,000원' });
  await amountButton.click();
  await page.waitForTimeout(500);

  console.log('🛒 "지금 구매하기" 버튼 클릭...');
  const buyButton = await page.locator('button', { hasText: '지금 구매하기' });
  await buyButton.click();
  await page.waitForTimeout(1000);

  // 모달이 열렸는지 확인
  const modal = await page.locator('[role="dialog"]').first();
  const isModalVisible = await modal.isVisible();

  if (!isModalVisible) {
    console.log('❌ 모달이 표시되지 않았습니다');
    await browser.close();
    return;
  }

  console.log('✅ 모달 열림');
  console.log('📝 구매자 정보 입력...');

  // 이름 입력
  await page.fill('input[placeholder*="이름"]', '테스트구매자');
  await page.waitForTimeout(300);

  // 전화번호 입력
  await page.fill('input[placeholder*="전화번호"]', '01012345678');
  await page.waitForTimeout(300);

  // 이메일 입력
  await page.fill('input[placeholder*="이메일"]', 'test@example.com');
  await page.waitForTimeout(500);

  console.log('💳 "결제하기" 버튼 클릭...');
  const paymentButton = await page.locator('button', { hasText: '결제하기' });

  // 네트워크 요청 모니터링
  let apiResponse = null;
  page.on('response', async (response) => {
    if (response.url().includes('/api/payment/init')) {
      apiResponse = {
        status: response.status(),
        url: response.url(),
        body: await response.json().catch(() => null)
      };
      console.log('📡 API 응답:', JSON.stringify(apiResponse, null, 2));
    }
  });

  // 결제 버튼 클릭
  await paymentButton.click();

  // 충분한 시간 대기 (위즈페이 폼 제출 및 리다이렉트)
  await page.waitForTimeout(5000);

  // 현재 페이지 URL 확인
  const currentUrl = page.url();
  console.log('📍 현재 URL:', currentUrl);

  // 페이지 내용 확인
  const pageContent = await page.content();
  const isWhitePage = pageContent.length < 500 || !pageContent.includes('</html>');

  if (isWhitePage) {
    console.log('❌ 흰 페이지 문제 발생!');
    console.log('페이지 내용:', pageContent.substring(0, 200));
  } else if (currentUrl.includes('wizzpay.co.kr')) {
    console.log('✅ 위즈페이 결제 화면으로 이동 성공!');
    console.log('🎯 테스트 통과: 흰 페이지 문제 해결됨');

    // 스크린샷 저장
    await page.screenshot({ path: 'screenshots/production-wizzpay-success.png', fullPage: true });
    console.log('📸 스크린샷 저장: screenshots/production-wizzpay-success.png');
  } else {
    console.log('⚠️ 예상치 못한 페이지:', currentUrl);
  }

  console.log('\n✅ 테스트 완료 - 브라우저를 30초 후 닫습니다...');
  await page.waitForTimeout(30000);
  await browser.close();
})();
