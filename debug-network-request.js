/**
 * Network 요청 디버깅 - 위즈페이로 전송되는 실제 데이터 확인
 */
const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Network 요청 디버깅 시작...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // 모든 네트워크 요청 모니터링
  page.on('request', request => {
    if (request.url().includes('wizzpay')) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📡 요청 URL:', request.url());
      console.log('📡 요청 방법:', request.method());

      if (request.method() === 'POST') {
        const postData = request.postData();
        if (postData) {
          console.log('\n📦 POST 데이터:');

          // URL 인코딩된 데이터 파싱
          const params = new URLSearchParams(postData);

          console.log('   MID:', params.get('MID'));
          console.log('   DATA 길이:', params.get('DATA')?.length || 0);
          console.log('   DATA 앞 100자:', params.get('DATA')?.substring(0, 100));
          console.log('   BLOCK_CARD_COMPANIES:', params.get('BLOCK_CARD_COMPANIES'));
        }
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  });

  // 응답 모니터링
  page.on('response', async response => {
    if (response.url().includes('wizzpay')) {
      console.log('📥 응답 상태:', response.status(), response.statusText());
      console.log('📥 응답 URL:', response.url());

      try {
        const contentType = response.headers()['content-type'];
        console.log('📥 Content-Type:', contentType);

        if (contentType && contentType.includes('text/html')) {
          const html = await response.text();
          console.log('📥 HTML 길이:', html.length);
          console.log('📥 HTML 앞 200자:', html.substring(0, 200));
        }
      } catch (e) {
        console.log('⚠️ 응답 읽기 실패:', e.message);
      }
      console.log('\n');
    }
  });

  console.log('1️⃣ 로컬 서버 접속...');
  await page.goto('http://localhost:3003');
  await page.waitForLoadState('networkidle');
  console.log('   ✅ 접속 완료\n');

  console.log('2️⃣ 50,000원 선택...');
  const priceButton = await page.locator('button:has-text("50,000원")').first();
  await priceButton.click();
  await page.waitForTimeout(500);
  console.log('   ✅ 선택 완료\n');

  console.log('3️⃣ "지금 구매하기" 클릭...');
  const buyButton = await page.locator('button:has-text("지금 구매하기")').first();
  await buyButton.click();
  await page.waitForTimeout(1000);
  console.log('   ✅ 클릭 완료\n');

  console.log('4️⃣ 정보 입력...');
  const inputs = await page.locator('input[type="tel"], input[type="text"]').all();
  if (inputs.length >= 2) {
    await inputs[0].fill('010-1234-5678');
    await inputs[1].fill('테스트구매자');
    console.log('   ✅ 입력 완료\n');
  }

  console.log('5️⃣ "결제하기" 클릭하고 네트워크 요청 모니터링...\n');
  const paymentButton = await page.locator('button:has-text("결제하기")').first();
  await paymentButton.click();

  console.log('⏰ 10초 대기 (네트워크 요청 완료)...\n');
  await page.waitForTimeout(10000);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 디버깅 완료');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('30초 후 종료...');
  await page.waitForTimeout(30000);
  await browser.close();
})();
