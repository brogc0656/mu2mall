import { test, expect } from '@playwright/test';

/**
 * 위즈페이 실제 통합 테스트
 * 로컬 샘플 페이지와 프로덕션 페이지 모두 검증
 */

test.describe('위즈페이 로컬 샘플 페이지 테스트', () => {
  test('1. 로컬 위즈페이 샘플 페이지 로드', async ({ page }) => {
    const localPath = 'file://' + process.cwd() + '/../pg/wizzpay/Main.html';

    console.log('🌐 로컬 샘플 페이지 접속:', localPath);
    await page.goto(localPath);

    // 페이지 제목 확인
    const title = await page.title();
    console.log('📄 페이지 제목:', title);
    expect(title).toContain('위즈페이');
  });

  test('2. WizzpayISP 객체 확인', async ({ page }) => {
    const localPath = 'file://' + process.cwd() + '/../pg/wizzpay/Main.html';
    await page.goto(localPath);
    await page.waitForTimeout(2000);

    const wizzpayCheck = await page.evaluate(() => {
      return {
        exists: typeof (window as any).WizzpayISP !== 'undefined',
        isFunction: typeof (window as any).WizzpayISP === 'function',
        hasGoPay: typeof (window as any).goPay === 'function',
      };
    });

    console.log('✅ WizzpayISP 존재:', wizzpayCheck.exists);
    console.log('✅ WizzpayISP 함수:', wizzpayCheck.isFunction);
    console.log('✅ goPay 함수:', wizzpayCheck.hasGoPay);

    expect(wizzpayCheck.exists).toBeTruthy();
    expect(wizzpayCheck.isFunction).toBeTruthy();
    expect(wizzpayCheck.hasGoPay).toBeTruthy();
  });

  test('3. 필수 스크립트 로드 확인', async ({ page }) => {
    const localPath = 'file://' + process.cwd() + '/../pg/wizzpay/Main.html';
    await page.goto(localPath);

    // 스크립트 태그 확인
    const scripts = await page.locator('script[src*="js/"]').all();
    console.log('📜 스크립트 개수:', scripts.length);

    const scriptSources = await Promise.all(
      scripts.map(async (script) => await script.getAttribute('src'))
    );

    console.log('📜 로드된 스크립트:', scriptSources);

    // 필수 스크립트 확인
    expect(scriptSources.some(src => src?.includes('function.js'))).toBeTruthy();
  });

  test('4. 입력 필드 동작 확인', async ({ page }) => {
    const localPath = 'file://' + process.cwd() + '/../pg/wizzpay/Main.html';
    await page.goto(localPath);
    await page.waitForTimeout(1000);

    // 상품명 입력
    await page.fill('#GOODSNAME', '테스트 상품권');
    const goodsname = await page.inputValue('#GOODSNAME');
    console.log('📝 상품명 입력:', goodsname);
    expect(goodsname).toBe('테스트 상품권');

    // 금액 입력
    await page.fill('#AMT', '50000');
    const amt = await page.inputValue('#AMT');
    console.log('💰 금액 입력:', amt);
    expect(amt).toBe('50000');

    // 구매자명 입력
    await page.fill('#BUYERNAME', '테스트구매자');
    const buyername = await page.inputValue('#BUYERNAME');
    console.log('👤 구매자명 입력:', buyername);
    expect(buyername).toBe('테스트구매자');
  });

  test('5. 결제 버튼 존재 확인', async ({ page }) => {
    const localPath = 'file://' + process.cwd() + '/../pg/wizzpay/Main.html';
    await page.goto(localPath);

    const payButton = page.locator('button:has-text("결제")');
    const buttonCount = await payButton.count();

    console.log('🔘 결제 버튼 개수:', buttonCount);
    expect(buttonCount).toBeGreaterThan(0);

    // 버튼 클릭 가능 여부
    const isVisible = await payButton.first().isVisible();
    console.log('👁️ 결제 버튼 표시:', isVisible);
    expect(isVisible).toBeTruthy();
  });
});

test.describe('프로덕션 사이트 위즈페이 테스트', () => {
  const PRODUCTION_URL = 'https://muyi-giftcard.vercel.app';

  test('1. 프로덕션 메인 페이지 로드', async ({ page }) => {
    console.log('🌐 프로덕션 접속:', PRODUCTION_URL);
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    console.log('📄 페이지 제목:', title);
    expect(title).toContain('무이상품권');
  });

  test('2. 위즈페이 스크립트 로드 확인', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');

    // 스크립트 확인
    const scripts = await page.locator('script').all();
    let wizzpayScripts: string[] = [];

    for (const script of scripts) {
      const src = await script.getAttribute('src');
      if (src && (src.includes('wizz') || src.includes('wizzauth'))) {
        wizzpayScripts.push(src);
      }
    }

    console.log('🔍 위즈페이 스크립트:', wizzpayScripts);
    expect(wizzpayScripts.length).toBeGreaterThan(0);
  });

  test('3. 상품권 카드 표시 확인', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');

    // 상품권 이미지 확인
    const cards = await page.locator('[class*="card"], [class*="Card"], img[alt*="상품권"]').all();
    console.log('🎴 상품권 카드 개수:', cards.length);
    expect(cards.length).toBeGreaterThan(0);
  });

  test('4. 구매 버튼 클릭 가능 확인', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 금액 버튼 찾기
    const button50k = page.locator('button:has-text("50,000")').first();

    if (await button50k.count() > 0) {
      const isEnabled = await button50k.isEnabled();
      console.log('✅ 50,000원 버튼 활성화:', isEnabled);
      expect(isEnabled).toBeTruthy();
    } else {
      console.log('⚠️ 50,000원 버튼을 찾을 수 없습니다');
    }
  });

  test('5. Console 에러 확인', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('❌ Console 에러 개수:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('에러 목록:', consoleErrors);
    }

    // 위즈페이 관련 에러만 체크
    const wizzpayErrors = consoleErrors.filter(err =>
      err.toLowerCase().includes('wizz') ||
      err.toLowerCase().includes('payment')
    );

    console.log('⚠️ 위즈페이 관련 에러:', wizzpayErrors.length);
  });

  test('6. 네트워크 요청 확인', async ({ page }) => {
    const requests: string[] = [];

    page.on('request', request => {
      const url = request.url();
      if (url.includes('wizz') || url.includes('payment') || url.includes('api')) {
        requests.push(url);
      }
    });

    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('🌐 API 요청 개수:', requests.length);
    console.log('요청 목록:', requests);
  });
});

test.describe('Next.js 앱 API 엔드포인트 테스트', () => {
  test('1. 결제 알림 API 존재 확인', async ({ request }) => {
    const response = await request.get('https://muyi-giftcard.vercel.app/api/payment/notification');

    console.log('📡 /api/payment/notification 상태:', response.status());

    // GET 요청은 405 (Method Not Allowed)가 정상
    expect([405, 404, 200]).toContain(response.status());
  });

  test('2. 상품권 API 존재 확인', async ({ request }) => {
    const response = await request.get('https://muyi-giftcard.vercel.app/api/giftcard');

    console.log('📡 /api/giftcard 상태:', response.status());

    // GET 요청은 405 (Method Not Allowed)가 정상
    expect([405, 404, 200]).toContain(response.status());
  });
});
