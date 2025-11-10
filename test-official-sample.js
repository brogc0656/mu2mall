/**
 * 위즈페이 공식 샘플 테스트
 */
const { chromium } = require('playwright');

(async () => {
  console.log('🚀 위즈페이 공식 샘플 테스트 시작...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Console 로그 모니터링
  page.on('console', msg => console.log('📝', msg.text()));

  try {
    console.log('1️⃣ 공식 샘플 페이지 접속...');
    await page.goto('http://localhost:3003/Main.html');
    await page.waitForLoadState('networkidle');
    console.log('   ✅ 접속 완료\n');

    console.log('2️⃣ 결제 버튼 클릭...');
    await page.click('button.btnPay');
    console.log('   ✅ 클릭 완료\n');

    console.log('3️⃣ 팝업 확인 (10초 대기)...');
    await page.waitForTimeout(10000);

    const pages = context.pages();
    console.log(`\n📊 열려있는 페이지: ${pages.length}개`);

    for (let i = 0; i < pages.length; i++) {
      const url = pages[i].url();
      const title = await pages[i].title();
      console.log(`   페이지 ${i + 1}:`);
      console.log(`     URL: ${url}`);
      console.log(`     Title: ${title}`);

      // 위즈페이 페이지인지 확인
      if (url.includes('wizzpay.co.kr')) {
        console.log(`\n📄 위즈페이 페이지 내용 확인...`);

        const bodyText = await pages[i].textContent('body');
        console.log(`     Body 텍스트 길이: ${bodyText.length}`);
        console.log(`     Body 텍스트 앞 200자: ${bodyText.substring(0, 200)}`);

        // 스크린샷
        await pages[i].screenshot({
          path: 'screenshots/official-sample-wizzpay.png',
          fullPage: true
        });
        console.log(`     📸 스크린샷: screenshots/official-sample-wizzpay.png`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏰ 30초 후 브라우저를 닫습니다...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await page.waitForTimeout(30000);

  } catch (error) {
    console.log('\n❌ 오류:', error.message);
    await page.screenshot({ path: 'screenshots/official-sample-error.png' });
  } finally {
    await browser.close();
    console.log('✅ 테스트 완료');
  }
})();
