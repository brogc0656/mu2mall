/**
 * 실제 전송되는 Form 데이터 디버깅
 */
const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Form 데이터 디버깅 시작...\n');

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
            console.log(`   - ${key}: ${value.substring(0, 100)}... (암호화됨)`);
          } else {
            console.log(`   - ${key}: ${value}`);
          }
        }
      }
    }
  });

  // Console 로그 모니터링
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('DATA') || text.includes('암호화') || text.includes('JSON')) {
      console.log('📝', text);
    }
  });

  try {
    console.log('1️⃣ 프로덕션 사이트 접속...');
    await page.goto('https://muyi-giftcard.vercel.app', { waitUntil: 'networkidle' });
    console.log('   ✅ 접속 완료\n');

    console.log('2️⃣ 10,000원 상품 선택...');
    await page.locator('button:has-text("10,000원")').first().click();
    await page.waitForTimeout(500);
    console.log('   ✅ 선택 완료\n');

    console.log('3️⃣ "지금 구매하기" 클릭...');
    await page.locator('button:has-text("지금 구매하기")').first().click();
    await page.waitForTimeout(1000);
    console.log('   ✅ 클릭 완료\n');

    console.log('4️⃣ 모달에서 정보 입력...');
    const inputs = await page.locator('input[type="tel"], input[type="text"]').all();
    if (inputs.length >= 2) {
      await inputs[0].fill('010-1234-5678');
      await inputs[1].fill('테스트');
      console.log('   ✅ 입력 완료\n');
    }

    console.log('5️⃣ Form 생성 전 상태 확인...');
    const beforeForm = await page.evaluate(() => {
      const forms = document.querySelectorAll('form[name="wizzpayForm"]');
      return {
        formCount: forms.length,
        forms: Array.from(forms).map(f => ({
          name: f.name,
          fields: Array.from(f.elements).map(el => ({
            name: el.name,
            value: el.value
          }))
        }))
      };
    });
    console.log('   Form 개수:', beforeForm.formCount);
    console.log('   Forms:', JSON.stringify(beforeForm.forms, null, 2));

    console.log('\n6️⃣ 결제하기 버튼 클릭...');
    await page.locator('button:has-text("결제하기")').first().click();

    await page.waitForTimeout(2000);

    console.log('\n7️⃣ Form 생성 후 상태 확인...');
    const afterForm = await page.evaluate(() => {
      const forms = document.querySelectorAll('form[name="wizzpayForm"]');
      return {
        formCount: forms.length,
        forms: Array.from(forms).map(f => ({
          name: f.name,
          fields: Array.from(f.elements).map(el => ({
            name: el.name,
            value: el.value?.substring(0, 50) || el.value
          }))
        }))
      };
    });
    console.log('   Form 개수:', afterForm.formCount);
    console.log('   Forms:', JSON.stringify(afterForm.forms, null, 2));

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
