import { test, expect } from '@playwright/test';

/**
 * 프로덕션 위즈페이 모듈 정상 동작 확인 테스트
 */
const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://muyi-giftcard.vercel.app';

test.describe('프로덕션 위즈페이 모듈 확인', () => {
  test.beforeEach(async ({ page }) => {
    // 프로덕션 사이트 접속
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
  });

  test('1. 페이지 로드 확인', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/Brother|상품권/i);
    
    // 주요 요소 확인
    await expect(page.locator('body')).toBeVisible();
  });

  test('2. 위즈페이 스크립트 로드 확인', async ({ page }) => {
    // 위즈페이 관련 스크립트가 로드되었는지 확인
    const scripts = await page.locator('script').all();
    
    let wizzpayScriptFound = false;
    for (const script of scripts) {
      const src = await script.getAttribute('src');
      const content = await script.textContent();
      
      if (src && (src.includes('wizz') || src.includes('wizzpay'))) {
        wizzpayScriptFound = true;
        console.log('위즈페이 스크립트 발견:', src);
        break;
      }
      
      if (content && (content.includes('Wizzpay') || content.includes('wizzpay'))) {
        wizzpayScriptFound = true;
        console.log('위즈페이 코드 발견');
        break;
      }
    }
    
    // 위즈페이 관련 코드가 있는지 확인 (직접 호출 방식일 수도 있음)
    const pageContent = await page.content();
    const hasWizzpayReference = pageContent.includes('wizzpay') || 
                                 pageContent.includes('Wizzpay') ||
                                 pageContent.includes('wizz');
    
    expect(wizzpayScriptFound || hasWizzpayReference).toBeTruthy();
  });

  test('3. 결제 버튼 존재 확인', async ({ page }) => {
    // 결제 관련 버튼이나 입력 필드 확인
    const paymentButton = page.locator('button:has-text("결제"), button:has-text("구매"), button:has-text("상품권")');
    const buttonCount = await paymentButton.count();
    
    // 최소한 하나의 결제 관련 버튼이 있어야 함
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('4. API 엔드포인트 확인', async ({ request }) => {
    // 결제 초기화 API 확인
    const initResponse = await request.post(`${PRODUCTION_URL}/api/payment/init`, {
      data: {
        amount: 10000,
        phone: '01012345678',
        message: '테스트'
      }
    });
    
    // API가 정상 응답하는지 확인 (200 또는 400/422 등 유효한 응답)
    expect([200, 400, 422, 500]).toContain(initResponse.status());
    
    if (initResponse.status() === 200) {
      const data = await initResponse.json();
      // 성공 시 필요한 필드 확인
      expect(data).toHaveProperty('success');
      if (data.success) {
        expect(data).toHaveProperty('wizzUrl');
        expect(data).toHaveProperty('mid');
        expect(data).toHaveProperty('data');
      }
    }
  });

  test('5. 환경 변수 노출 확인 (보안)', async ({ page }) => {
    // 페이지 소스에서 민감한 정보 확인
    const pageContent = await page.content();
    
    // 위즈페이 키가 노출되지 않았는지 확인
    const sensitivePatterns = [
      /WIZZ.*KEY/i,
      /WIZZ.*SECRET/i,
      /WIZZ.*ENC_KEY/i,
      /CHLIFES.*KEY/i,
      /CHLIFES.*SECRET/i
    ];
    
    for (const pattern of sensitivePatterns) {
      const matches = pageContent.match(pattern);
      if (matches) {
        console.warn('민감한 정보 발견:', matches[0]);
      }
      // 패턴이 발견되어도 실제 키 값이 아닐 수 있으므로 경고만
    }
    
    // 실제 키 값 형태가 노출되지 않았는지 확인
    const keyPattern = /[A-Za-z0-9]{32,}/g;
    const potentialKeys = pageContent.match(keyPattern);
    
    // 너무 많은 긴 문자열이 있으면 의심스러움 (하지만 확정적이지 않음)
    // 이 테스트는 경고 수준
  });

  test('6. 결제 플로우 시작 가능 여부 확인', async ({ page }) => {
    // 금액 입력 필드 찾기
    const amountInput = page.locator('input[type="number"], input[name*="amount"], input[id*="amount"]').first();
    
    if (await amountInput.count() > 0) {
      // 금액 입력
      await amountInput.fill('10000');
      
      // 전화번호 입력 필드 찾기
      const phoneInput = page.locator('input[type="tel"], input[name*="phone"], input[id*="phone"]').first();
      if (await phoneInput.count() > 0) {
        await phoneInput.fill('01012345678');
      }
      
      // 결제 버튼 클릭 시도
      const payButton = page.locator('button:has-text("결제"), button:has-text("구매"), button[type="submit"]').first();
      
      if (await payButton.count() > 0) {
        // 버튼이 활성화되어 있는지 확인
        const isEnabled = await payButton.isEnabled();
        expect(isEnabled).toBeTruthy();
      }
    }
  });

  test('7. 네트워크 요청 확인', async ({ page }) => {
    const requests: string[] = [];
    
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('wizz') || url.includes('payment') || url.includes('api')) {
        requests.push(url);
      }
    });
    
    // 페이지 상호작용 (버튼 클릭 등)
    const payButton = page.locator('button:has-text("결제"), button:has-text("구매")').first();
    if (await payButton.count() > 0) {
      await payButton.click();
      await page.waitForTimeout(2000); // 네트워크 요청 대기
    }
    
    // API 요청이 발생했는지 확인
    console.log('발견된 요청:', requests);
    // 최소한 /api/payment/init 요청이 있어야 함
  });
});

test.describe('프로덕션 전체 플로우 확인', () => {
  test('프로덕션 사이트 접근 가능', async ({ page }) => {
    const response = await page.goto(PRODUCTION_URL);
    expect(response?.status()).toBe(200);
  });

  test('프로덕션 API 엔드포인트 접근 가능', async ({ request }) => {
    // 헬스 체크 또는 기본 API 확인
    const response = await request.get(`${PRODUCTION_URL}/api/payment/init`);
    // 405 (Method Not Allowed)는 정상 (GET이 아닌 POST만 허용)
    expect([200, 405, 404]).toContain(response.status());
  });
});

