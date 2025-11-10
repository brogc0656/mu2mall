import { test, expect } from '@playwright/test';

/**
 * 위즈페이 개발 연동 구체적 검증 테스트
 */
const PRODUCTION_URL = 'https://muyi-giftcard.vercel.app';

test.describe('위즈페이 개발 연동 검증', () => {
  
  test('1. API 엔드포인트 응답 검증', async ({ request }) => {
    console.log('\n=== 1. API 엔드포인트 응답 검증 ===');
    
    const response = await request.post(`${PRODUCTION_URL}/api/payment/init`, {
      data: {
        goodsname: '테스트 상품권',
        amt: '10000',
        buyername: '홍길동',
        bypassValue: JSON.stringify({
          orderId: 'TEST_' + Date.now(),
          phone: '01012345678',
          goodsCode: 'SSG'
        })
      }
    });

    console.log(`응답 상태 코드: ${response.status()}`);
    
    if (response.status() !== 200) {
      const errorText = await response.text();
      console.error('❌ API 에러:', errorText);
      throw new Error(`API 응답 실패: ${response.status()}`);
    }

    const data = await response.json();
    console.log('API 응답 데이터:', JSON.stringify(data, null, 2));

    // 필수 필드 확인
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);
    
    expect(data).toHaveProperty('wizzUrl');
    expect(data).toHaveProperty('mid');
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('transactionId');

    // URL 형식 검증
    const wizzUrl = data.wizzUrl;
    console.log(`위즈페이 URL: "${wizzUrl}"`);
    console.log(`URL 길이: ${wizzUrl.length}`);
    
    // 개행 문자 체크
    const hasNewline = wizzUrl.includes('\n') || wizzUrl.includes('\r');
    if (hasNewline) {
      console.error('❌ wizzUrl에 개행 문자가 포함되어 있습니다!');
      console.error(`원본: ${JSON.stringify(wizzUrl)}`);
    }
    expect(hasNewline).toBe(false);
    
    // URL이 유효한지 확인
    expect(wizzUrl).toMatch(/^https?:\/\//);
    expect(wizzUrl.length).toBeGreaterThan(10);
    expect(wizzUrl.trim()).toBe(wizzUrl);

    // MID 검증
    const mid = data.mid;
    console.log(`MID: "${mid}"`);
    console.log(`MID 길이: ${mid.length}`);
    
    const midHasNewline = mid.includes('\n') || mid.includes('\r');
    if (midHasNewline) {
      console.error('❌ mid에 개행 문자가 포함되어 있습니다!');
      console.error(`원본: ${JSON.stringify(mid)}`);
    }
    expect(midHasNewline).toBe(false);
    expect(mid.length).toBeGreaterThan(0);
    expect(mid.trim()).toBe(mid);

    // 암호화된 데이터 검증
    const encryptedData = data.data;
    console.log(`암호화된 데이터 길이: ${encryptedData.length}`);
    expect(encryptedData.length).toBeGreaterThan(0);
    expect(typeof encryptedData).toBe('string');

    console.log('✅ API 응답 검증 완료');
  });

  test('2. 위즈페이 팝업 실제 동작 검증', async ({ page, context }) => {
    console.log('\n=== 2. 위즈페이 팝업 실제 동작 검증 ===');
    
    // 프로덕션 사이트 접속
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    console.log('✅ 프로덕션 사이트 접속 완료');

    // 초기 페이지 스크린샷
    await page.screenshot({ path: 'test-results/wizzpay-verification-01-initial.png', fullPage: true });

    // 금액 선택 버튼 찾기
    const amountSelectors = [
      '.amount-btn',
      'button:has-text("10,000")',
      'button:has-text("10000")',
      '[data-amount="10000"]',
      'button[class*="amount"]'
    ];

    let amountButton = null;
    for (const selector of amountSelectors) {
      const buttons = page.locator(selector);
      if (await buttons.count() > 0) {
        amountButton = buttons.first();
        break;
      }
    }

    if (!amountButton) {
      // 모든 버튼 확인
      const allButtons = page.locator('button');
      const buttonCount = await allButtons.count();
      console.log(`발견된 버튼 수: ${buttonCount}`);
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const btn = allButtons.nth(i);
        const text = await btn.textContent();
        const classes = await btn.getAttribute('class');
        console.log(`버튼 ${i}: "${text}" (class: ${classes})`);
      }
      
      throw new Error('금액 선택 버튼을 찾을 수 없습니다');
    }

    await amountButton.click();
    await page.waitForTimeout(500);
    console.log('✅ 금액 선택 완료');

    // 구매 버튼 찾기
    const buySelectors = [
      'button:has-text("구매")',
      'button:has-text("상품권")',
      'button:has-text("결제")',
      'button[class*="buy"]',
      'button[class*="purchase"]'
    ];

    let buyButton = null;
    for (const selector of buySelectors) {
      const buttons = page.locator(selector);
      if (await buttons.count() > 0) {
        buyButton = buttons.first();
        break;
      }
    }

    if (!buyButton) {
      await page.screenshot({ path: 'test-results/wizzpay-verification-02-no-buy-button.png', fullPage: true });
      throw new Error('구매 버튼을 찾을 수 없습니다');
    }

    await buyButton.click();
    await page.waitForTimeout(1000);
    console.log('✅ 구매 버튼 클릭 완료');

    // 모달 스크린샷
    await page.screenshot({ path: 'test-results/wizzpay-verification-03-modal.png', fullPage: true });

    // 입력 필드 찾기 및 입력
    const phoneInput = page.locator('input[type="tel"], input[name*="phone"], input[placeholder*="전화"], input[placeholder*="휴대폰"]').first();
    if (await phoneInput.count() > 0) {
      await phoneInput.fill('01012345678');
      console.log('✅ 전화번호 입력 완료');
    }

    const nameInput = page.locator('input[name*="name"], input[placeholder*="이름"], input[placeholder*="구매자"]').first();
    if (await nameInput.count() > 0) {
      await nameInput.fill('홍길동');
      console.log('✅ 구매자명 입력 완료');
    }

    // 결제 버튼 찾기
    const payButton = page.locator('button:has-text("결제"), button:has-text("구매"), button[type="submit"]').first();
    
    if (await payButton.count() === 0) {
      await page.screenshot({ path: 'test-results/wizzpay-verification-04-no-pay-button.png', fullPage: true });
      throw new Error('결제 버튼을 찾을 수 없습니다');
    }

    // 팝업 이벤트 리스너 설정
    const popupPromise = context.waitForEvent('page', { timeout: 15000 }).catch(() => null);
    
    // 네트워크 요청 모니터링
    const apiRequests: any[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/payment/init')) {
        apiRequests.push({
          url: url,
          method: request.method(),
          headers: request.headers()
        });
      }
    });

    const apiResponses: any[] = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/payment/init')) {
        try {
          const body = await response.json();
          apiResponses.push({
            url: url,
            status: response.status(),
            body: body
          });
        } catch (e) {
          apiResponses.push({
            url: url,
            status: response.status(),
            error: 'JSON 파싱 실패'
          });
        }
      }
    });

    // 결제 버튼 클릭
    await payButton.click();
    console.log('✅ 결제 버튼 클릭 완료');

    // API 응답 대기
    await page.waitForTimeout(2000);

    // API 요청/응답 확인
    if (apiRequests.length > 0) {
      console.log('✅ API 요청 확인:', apiRequests.length, '개');
      apiRequests.forEach((req, i) => {
        console.log(`  요청 ${i + 1}: ${req.method} ${req.url}`);
      });
    } else {
      console.log('⚠️ API 요청이 감지되지 않았습니다');
    }

    if (apiResponses.length > 0) {
      console.log('✅ API 응답 확인:', apiResponses.length, '개');
      apiResponses.forEach((res, i) => {
        console.log(`  응답 ${i + 1}: ${res.status}`);
        if (res.body) {
          console.log(`    success: ${res.body.success}`);
          console.log(`    wizzUrl: ${res.body.wizzUrl?.substring(0, 50)}...`);
          console.log(`    mid: ${res.body.mid}`);
        }
      });
    }

    // 팝업 대기
    const popup = await popupPromise;
    
    if (popup) {
      console.log('✅ 위즈페이 팝업 감지됨');
      
      // 팝업 로드 대기
      try {
        await popup.waitForLoadState('networkidle', { timeout: 20000 });
      } catch (e) {
        console.log('⚠️ 팝업 로드 완료 대기 중 타임아웃');
      }
      
      await popup.waitForTimeout(3000);

      // 팝업 URL 확인
      const popupUrl = popup.url();
      console.log(`팝업 URL: ${popupUrl}`);

      // 팝업 스크린샷
      await popup.screenshot({ path: 'test-results/wizzpay-verification-05-popup.png', fullPage: true });
      console.log('✅ 팝업 스크린샷 저장 완료');

      // 팝업 내용 확인
      const popupTitle = await popup.title();
      const bodyText = await popup.locator('body').textContent();
      const bodyHTML = await popup.locator('body').innerHTML();
      
      console.log(`팝업 제목: "${popupTitle}"`);
      console.log(`팝업 body 텍스트 길이: ${bodyText?.length || 0}`);
      console.log(`팝업 body HTML 길이: ${bodyHTML?.length || 0}`);

      // 흰 페이지 체크
      const isWhitePage = (bodyText?.trim().length || 0) < 10 && (bodyHTML?.trim().length || 0) < 100;
      
      if (isWhitePage) {
        console.error('❌ 흰 페이지 감지됨!');
        
        // 에러 정보 수집
        const errorInfo = await popup.evaluate(() => {
          return {
            scripts: document.querySelectorAll('script').length,
            bodyText: document.body?.textContent?.trim().length || 0,
            bodyHTML: document.body?.innerHTML?.trim().length || 0,
            url: window.location.href,
            readyState: document.readyState
          };
        });
        
        console.error('팝업 에러 정보:', JSON.stringify(errorInfo, null, 2));
        
        // 추가 디버깅 스크린샷
        await popup.screenshot({ path: 'test-results/wizzpay-verification-06-white-page-error.png', fullPage: true });
        
        // 네트워크 요청 확인
        const popupRequests: string[] = [];
        popup.on('request', (request) => {
          popupRequests.push(request.url());
        });
        
        await popup.waitForTimeout(2000);
        console.log('팝업 네트워크 요청:', popupRequests.slice(0, 10));
        
        throw new Error('위즈페이 팝업이 흰 페이지로 표시됩니다');
      } else {
        console.log('✅ 팝업이 정상적으로 로드됨');
        
        // 위즈페이 관련 요소 확인
        const hasWizzpayContent = bodyText?.includes('위즈페이') || 
                                  bodyText?.includes('Wizzpay') ||
                                  bodyText?.includes('결제') ||
                                  bodyHTML?.includes('wizz') ||
                                  popupUrl.includes('wizz');
        
        if (hasWizzpayContent) {
          console.log('✅ 위즈페이 관련 내용 확인됨');
        } else {
          console.log('⚠️ 위즈페이 관련 내용이 명확하지 않음');
        }
      }

      // 팝업 닫기
      await popup.close();
    } else {
      console.log('⚠️ 팝업이 감지되지 않음 - form submit 방식일 수 있음');
      
      // form submit 확인
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/wizzpay-verification-05-no-popup.png', fullPage: true });
      
      // 새 창/탭 확인
      const pages = context.pages();
      console.log(`현재 열린 페이지 수: ${pages.length}`);
      
      if (pages.length > 1) {
        const newPage = pages[pages.length - 1];
        await newPage.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        await newPage.screenshot({ path: 'test-results/wizzpay-verification-05-new-tab.png', fullPage: true });
        console.log(`새 탭 URL: ${newPage.url()}`);
        
        const newPageText = await newPage.locator('body').textContent();
        console.log(`새 탭 내용 길이: ${newPageText?.length || 0}`);
      }
    }

    console.log('✅ 위즈페이 팝업 동작 검증 완료');
  });

  test('3. 환경 변수 및 설정 검증', async ({ request }) => {
    console.log('\n=== 3. 환경 변수 및 설정 검증 ===');
    
    // API 호출하여 응답 확인
    const response = await request.post(`${PRODUCTION_URL}/api/payment/init`, {
      data: {
        goodsname: '테스트',
        amt: '10000',
        buyername: '테스트',
        bypassValue: '{}'
      }
    });

    if (response.status() === 200) {
      const data = await response.json();
      
      // 환경 변수 검증
      console.log('환경 변수 검증:');
      console.log(`  WIZZ_URL 설정됨: ${!!data.wizzUrl}`);
      console.log(`  MID 설정됨: ${!!data.mid}`);
      console.log(`  암호화 데이터 생성됨: ${!!data.data}`);
      
      // URL 형식 검증
      if (data.wizzUrl) {
        const isValidUrl = /^https?:\/\/.+/.test(data.wizzUrl.trim());
        console.log(`  URL 형식 유효: ${isValidUrl}`);
        expect(isValidUrl).toBe(true);
      }
      
      // MID 형식 검증
      if (data.mid) {
        const midTrimmed = data.mid.trim();
        console.log(`  MID 길이: ${midTrimmed.length}`);
        expect(midTrimmed.length).toBeGreaterThan(0);
      }
      
      console.log('✅ 환경 변수 검증 완료');
    } else {
      const errorText = await response.text();
      console.error('❌ API 에러:', errorText);
      throw new Error('환경 변수 검증 실패');
    }
  });
});

