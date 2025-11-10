const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🌐 프로덕션 사이트 접속 중...');
  await page.goto('https://muyi-giftcard.vercel.app');

  console.log('✅ 페이지 로드 완료');
  console.log('📄 페이지 제목:', await page.title());

  // 5초 대기
  await page.waitForTimeout(5000);

  // 스크린샷
  await page.screenshot({ path: './muyi-homepage.png', fullPage: true });
  console.log('📸 스크린샷 저장: ./muyi-homepage.png');

  // Wizzpay 스크립트 확인
  const scripts = await page.locator('script').all();
  console.log('📜 스크립트 개수:', scripts.length);

  for (const script of scripts) {
    const src = await script.getAttribute('src');
    if (src && src.includes('wizz')) {
      console.log('🔍 Wizzpay 스크립트 발견:', src);
    }
  }

  // 페이지 내용 확인
  const bodyText = await page.locator('body').textContent();
  console.log('📝 페이지 내용 (처음 200자):', bodyText ? bodyText.substring(0, 200) : 'N/A');

  // 결제 버튼 찾기
  const buttons = await page.locator('button').all();
  console.log('🔘 버튼 개수:', buttons.length);

  for (let i = 0; i < Math.min(buttons.length, 10); i++) {
    const text = await buttons[i].textContent();
    console.log('버튼', i + 1, ':', text ? text.trim() : 'N/A');
  }

  // 상품권 카드 확인
  const cards = await page.locator('[class*="card"], [class*="Card"]').all();
  console.log('🎴 카드 개수:', cards.length);

  console.log('\n⏳ 30초 대기 - 브라우저 창을 확인하세요...');
  await page.waitForTimeout(30000);

  await browser.close();
})();
