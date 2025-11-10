const { chromium } = require('playwright');

(async () => {
  console.log('🔍 결제 플로우 디버깅 시작\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });

  const page = await context.newPage();

  // 모든 네트워크 요청 모니터링
  const requests = [];
  const responses = [];

  page.on('request', request => {
    const url = request.url();
    const method = request.method();
    const postData = request.postData();

    requests.push({ url, method, postData, timestamp: new Date().toISOString() });

    if (url.includes('api/payment') || url.includes('wizzpay') || url.includes('Ready.jsp')) {
      console.log(`📤 REQUEST: ${method} ${url}`);
      if (postData) {
        console.log(`   Body: ${postData.substring(0, 200)}...`);
      }
    }
  });

  page.on('response', async response => {
    const url = response.url();
    const status = response.status();

    if (url.includes('api/payment') || url.includes('wizzpay') || url.includes('Ready.jsp')) {
      console.log(`📥 RESPONSE: ${status} ${url}`);

      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          const body = await response.json();
          console.log(`   Body:`, JSON.stringify(body, null, 2));
          responses.push({ url, status, body, timestamp: new Date().toISOString() });
        } else {
          const text = await response.text();
          console.log(`   Body (text):`, text.substring(0, 300));
          responses.push({ url, status, body: text.substring(0, 500), timestamp: new Date().toISOString() });
        }
      } catch (e) {
        console.log(`   (응답 본문 읽기 실패: ${e.message})`);
      }
    }
  });

  // Console 로그 모니터링
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      console.log(`❌ Console Error: ${text}`);
    } else if (type === 'log') {
      console.log(`💬 Console Log: ${text}`);
    }
  });

  // 페이지 에러 모니터링
  page.on('pageerror', error => {
    console.log(`🚨 Page Error: ${error.message}`);
  });

  try {
    // 1. 메인 페이지 접속
    console.log('1️⃣ 메인 페이지 접속...\n');
    await page.goto('https://muyi-giftcard.vercel.app', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    // 2. 50,000원 선택
    console.log('2️⃣ 50,000원 버튼 클릭...\n');
    await page.locator('button:has-text("50,000")').first().click();
    await page.waitForTimeout(1000);

    // 3. 구매하기 클릭
    console.log('3️⃣ "지금 구매하기" 버튼 클릭...\n');
    await page.locator('button:has-text("지금 구매하기")').first().click();
    await page.waitForTimeout(2000);

    // 4. 정보 입력
    console.log('4️⃣ 구매자 정보 입력...\n');

    const nameInput = page.locator('input').first();
    await nameInput.fill('테스트구매자');
    console.log('   이름 입력 완료');

    const phoneInput = page.locator('input[type="tel"], input').nth(1);
    await phoneInput.fill('01012345678');
    console.log('   전화번호 입력 완료\n');

    await page.waitForTimeout(1000);

    // 5. 결제하기 버튼 클릭 (이 부분에서 문제 발생 예상)
    console.log('5️⃣ "결제하기" 버튼 클릭...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  주목: 이제 결제하기 버튼을 클릭합니다!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 팝업 모니터링
    const popupPromise = context.waitForEvent('page', { timeout: 10000 }).catch(() => null);

    const payButton = page.locator('button:has-text("결제")').first();
    await payButton.click();

    console.log('✅ 결제하기 버튼 클릭됨\n');

    // 팝업 확인
    const popup = await popupPromise;

    if (popup) {
      console.log('✅ 팝업이 열렸습니다!');
      console.log(`   팝업 URL: ${popup.url()}\n`);

      await page.waitForTimeout(3000);

      // 팝업 내용 확인
      const popupContent = await popup.content();
      console.log('📄 팝업 내용 (처음 500자):');
      console.log(popupContent.substring(0, 500));
      console.log('...\n');

      // 팝업 스크린샷
      await popup.screenshot({ path: './screenshots/popup-content.png' });
      console.log('📸 팝업 스크린샷 저장: ./screenshots/popup-content.png\n');

    } else {
      console.log('❌ 팝업이 열리지 않았습니다!\n');
    }

    // 네트워크 요청 분석
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 네트워크 요청 분석');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const paymentRequests = requests.filter(r =>
      r.url.includes('api/payment') || r.url.includes('wizzpay') || r.url.includes('Ready.jsp')
    );

    console.log(`총 결제 관련 요청: ${paymentRequests.length}개\n`);

    paymentRequests.forEach((req, idx) => {
      console.log(`[요청 ${idx + 1}]`);
      console.log(`  URL: ${req.url}`);
      console.log(`  Method: ${req.method}`);
      console.log(`  Time: ${req.timestamp}`);
      if (req.postData) {
        console.log(`  Data: ${req.postData.substring(0, 100)}...`);
      }
      console.log('');
    });

    console.log('⏳ 30초간 브라우저를 열어두겠습니다...\n');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('✅ 브라우저 종료');
  }
})();
