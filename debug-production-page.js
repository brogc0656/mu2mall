/**
 * 프로덕션 페이지 디버깅
 */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🌐 프로덕션 접속...');
  await page.goto('https://muyi-giftcard.vercel.app');
  await page.waitForLoadState('networkidle');

  console.log('\n📄 페이지 구조 분석...\n');

  // 모든 버튼 찾기
  const allButtons = await page.locator('button').all();
  console.log(`🔘 버튼 개수: ${allButtons.length}\n`);

  for (let i = 0; i < Math.min(allButtons.length, 15); i++) {
    const text = await allButtons[i].textContent();
    const isVisible = await allButtons[i].isVisible();
    console.log(`   ${i+1}. "${text.substring(0, 30)}" (visible: ${isVisible})`);
  }

  // 50,000원 버튼 클릭 시도
  console.log('\n💰 50,000원 버튼 클릭 시도...');
  const priceButtons = await page.locator('button:has-text("50,000원")').all();
  console.log(`   발견된 50,000원 버튼: ${priceButtons.length}개`);

  if (priceButtons.length > 0) {
    await priceButtons[0].click();
    await page.waitForTimeout(1000);
    console.log('   ✅ 클릭 완료');

    // 구매하기 버튼 찾기
    const buyButtons = await page.locator('button').all();
    console.log(`\n🛒 클릭 후 모든 버튼:`);
    for (let i = 0; i < Math.min(buyButtons.length, 15); i++) {
      const text = await buyButtons[i].textContent();
      const isVisible = await buyButtons[i].isVisible();
      console.log(`   ${i+1}. "${text.substring(0, 30)}" (visible: ${isVisible})`);
    }

    // 지금 구매하기 찾기
    const buyButton = await page.locator('button:has-text("지금 구매하기")').first();
    const buyButtonVisible = await buyButton.isVisible({ timeout: 1000 }).catch(() => false);
    console.log(`\n   "지금 구매하기" 버튼 표시: ${buyButtonVisible}`);

    if (buyButtonVisible) {
      await buyButton.click();
      await page.waitForTimeout(2000);

      // 모달 확인
      const modals = await page.locator('[role="dialog"]').all();
      console.log(`\n📦 모달 개수: ${modals.length}`);

      if (modals.length > 0) {
        const modalVisible = await modals[0].isVisible();
        console.log(`   모달 표시: ${modalVisible}`);

        if (modalVisible) {
          const modalText = await modals[0].textContent();
          console.log(`   모달 텍스트: ${modalText.substring(0, 100)}`);
        }
      }
    }
  }

  console.log('\n📸 스크린샷 저장...');
  await page.screenshot({ path: 'screenshots/production-debug.png', fullPage: true });
  console.log('   screenshots/production-debug.png\n');

  console.log('10초 후 종료...');
  await page.waitForTimeout(10000);
  await browser.close();
})();
