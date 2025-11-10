/**
 * 프로덕션 페이지 현재 상태 확인
 */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🌐 프로덕션 접속: https://muyi-giftcard.vercel.app');
  await page.goto('https://muyi-giftcard.vercel.app');
  await page.waitForLoadState('networkidle');

  console.log('📸 스크린샷 촬영...');
  await page.screenshot({ path: 'screenshots/production-homepage.png', fullPage: true });

  // 페이지 텍스트 확인
  const bodyText = await page.textContent('body');
  console.log('\n📄 페이지 내용 (처음 500자):');
  console.log(bodyText.substring(0, 500));

  // 버튼 찾기
  const buttons = await page.locator('button').all();
  console.log(`\n🔘 페이지의 버튼 개수: ${buttons.length}`);

  for (let i = 0; i < Math.min(buttons.length, 10); i++) {
    const text = await buttons[i].textContent();
    console.log(`   버튼 ${i+1}: "${text}"`);
  }

  console.log('\n✅ 스크린샷 저장: screenshots/production-homepage.png');
  console.log('브라우저를 10초 후 닫습니다...');

  await page.waitForTimeout(10000);
  await browser.close();
})();
