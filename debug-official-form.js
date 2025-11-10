/**
 * 공식 샘플의 Form 데이터 디버깅
 */
const { chromium } = require('playwright');

(async () => {
  console.log('🔍 공식 샘플 Form 데이터 디버깅 시작...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Network 요청 모니터링
  page.on('request', request => {
    if (request.url().includes('Ready.jsp')) {
      console.log('\n📤 Ready.jsp 요청 감지!');
      console.log('   URL:', request.url());
      console.log('   Method:', request.method());

      const postData = request.postData();
      if (postData) {
        console.log('   POST Data:', postData);

        // URL-encoded 데이터 파싱
        const params = new URLSearchParams(postData);
        console.log('\n   📋 전송된 파라미터:');
        for (const [key, value] of params.entries()) {
          if (key === 'DATA') {
            console.log(`   - ${key}: ${value.substring(0, 100)}... (길이: ${value.length})`);
          } else {
            console.log(`   - ${key}: ${value}`);
          }
        }
      }
    }
  });

  try {
    console.log('1️⃣ 공식 샘플 페이지 접속...');
    await page.goto('http://localhost:3003/Main.html', { waitUntil: 'networkidle' });
    console.log('   ✅ 접속 완료\n');

    console.log('2️⃣ Form 데이터 확인...');
    const formData = await page.evaluate(() => {
      const form = document.querySelector('form[name="merForm"]');
      if (!form) return null;

      return {
        GOODSNAME: form.GOODSNAME?.value,
        AMT: form.AMT?.value,
        RESULTURL: form.RESULTURL?.value,
        NOTIURL: form.NOTIURL?.value,
        BYPASSVALUE: form.BYPASSVALUE?.value,
        BUYERNAME: form.BUYERNAME?.value
      };
    });
    console.log('   Form 데이터:', JSON.stringify(formData, null, 2));

    console.log('\n3️⃣ 결제 버튼 클릭...');
    await page.locator('button:has-text("결제")').click();

    console.log('\n4️⃣ POST 요청 대기 중 (3초)...');
    await page.waitForTimeout(3000);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('브라우저는 10초 후 닫힙니다...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await page.waitForTimeout(10000);

  } catch (error) {
    console.log('\n❌ 테스트 오류:', error.message);
  } finally {
    await browser.close();
    console.log('✅ 테스트 완료');
  }
})();
