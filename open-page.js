const { chromium } = require('playwright');

(async () => {
  console.log('🌐 무이상품권 페이지 열기...\n');

  const browser = await chromium.launch({
    headless: false,  // 브라우저 보이기
    slowMo: 500,      // 동작 속도 조절
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });

  const page = await context.newPage();

  try {
    console.log('📱 프로덕션 사이트 접속 중...');
    await page.goto('https://muyi-giftcard.vercel.app', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('✅ 페이지 로드 완료!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 무이상품권 사이트가 열렸습니다!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('👀 브라우저 창에서 페이지를 확인하세요');
    console.log('💡 원하시는 동작을 직접 테스트해보실 수 있습니다\n');
    console.log('⏰ 브라우저를 5분(300초)간 열어두겠습니다...');
    console.log('   (종료하려면 Ctrl+C를 누르세요)\n');

    // 5분간 대기
    await page.waitForTimeout(300000);

  } catch (error) {
    console.error('❌ 에러:', error.message);
  } finally {
    console.log('\n✅ 브라우저를 종료합니다...');
    await browser.close();
  }
})();
