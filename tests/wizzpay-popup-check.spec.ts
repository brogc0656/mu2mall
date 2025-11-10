import { test, expect } from '@playwright/test';

/**
 * 위즈페이 팝업 정상 동작 확인 테스트
 * 프로덕션에서 실제로 팝업이 열리고 정상적으로 표시되는지 확인
 */
const PRODUCTION_URL = 'https://muyi-giftcard.vercel.app';

test.describe('위즈페이 팝업 확인', () => {
  test('위즈페이 팝업이 정상적으로 열리는지 확인', async ({ page, context }) => {
    // 프로덕션 사이트 접속
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');

    // 스크린샷 1: 초기 페이지
    await page.screenshot({ path: 'test-results/wizzpay-01-initial-page.png', fullPage: true });
    console.log('✅ 초기 페이지 캡처 완료');

    // 금액 선택 버튼 찾기
    const amountButtons = page.locator('.amount-btn, button:has-text("10,000"), button:has-text("10000")');
    const amountButtonCount = await amountButtons.count();
    
    if (amountButtonCount > 0) {
      // 첫 번째 금액 버튼 클릭
      await amountButtons.first().click();
      await page.waitForTimeout(500);
      console.log('✅ 금액 선택 완료');
    }

    // 상품권 구매 버튼 찾기
    const buyButtons = page.locator('button:has-text("구매"), button:has-text("상품권"), button:has-text("결제")');
    const buyButtonCount = await buyButtons.count();
    
    if (buyButtonCount === 0) {
      // 대체 방법: 모든 버튼 확인
      const allButtons = page.locator('button');
      const buttonCount = await allButtons.count();
      console.log(`발견된 버튼 수: ${buttonCount}`);
      
      // 페이지 전체 스크린샷
      await page.screenshot({ path: 'test-results/wizzpay-02-buttons-check.png', fullPage: true });
      
      // 버튼 텍스트 출력
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = allButtons.nth(i);
        const text = await button.textContent();
        console.log(`버튼 ${i}: ${text}`);
      }
    } else {
      // 구매 버튼 클릭
      await buyButtons.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ 구매 버튼 클릭 완료');

      // 스크린샷 2: 모달 열림
      await page.screenshot({ path: 'test-results/wizzpay-03-modal-opened.png', fullPage: true });
      console.log('✅ 모달 열림 캡처 완료');

      // 전화번호 입력 필드 찾기 및 입력
      const phoneInput = page.locator('input[type="tel"], input[name*="phone"], input[placeholder*="전화"], input[placeholder*="휴대폰"]').first();
      if (await phoneInput.count() > 0) {
        await phoneInput.fill('01012345678');
        console.log('✅ 전화번호 입력 완료');
      }

      // 구매자명 입력 필드 찾기 및 입력
      const nameInput = page.locator('input[name*="name"], input[placeholder*="이름"], input[placeholder*="구매자"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill('테스트');
        console.log('✅ 구매자명 입력 완료');
      }

      // 결제 진행 버튼 찾기 및 클릭
      const payButton = page.locator('button:has-text("결제"), button:has-text("구매"), button[type="submit"]').first();
      if (await payButton.count() > 0) {
        // 팝업 이벤트 리스너 설정
        const popupPromise = context.waitForEvent('page', { timeout: 10000 }).catch(() => null);
        
        await payButton.click();
        console.log('✅ 결제 버튼 클릭 완료');

        // 팝업 대기
        const popup = await popupPromise;
        
        if (popup) {
          console.log('✅ 위즈페이 팝업 감지됨');
          
          // 팝업이 로드될 때까지 대기
          await popup.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
            console.log('⚠️ 팝업 로드 완료 대기 중...');
          });
          
          await popup.waitForTimeout(3000); // 추가 대기

          // 스크린샷 3: 위즈페이 팝업
          await popup.screenshot({ path: 'test-results/wizzpay-04-popup-opened.png', fullPage: true });
          console.log('✅ 위즈페이 팝업 캡처 완료');

          // 팝업 URL 확인
          const popupUrl = popup.url();
          console.log(`팝업 URL: ${popupUrl}`);

          // 팝업 내용 확인
          const popupContent = await popup.content();
          const popupTitle = await popup.title();
          console.log(`팝업 제목: ${popupTitle}`);
          console.log(`팝업 내용 길이: ${popupContent.length}`);

          // 흰 페이지인지 확인
          const bodyText = await popup.locator('body').textContent();
          const bodyHTML = await popup.locator('body').innerHTML();
          
          console.log(`팝업 body 텍스트 길이: ${bodyText?.length || 0}`);
          console.log(`팝업 body HTML 길이: ${bodyHTML?.length || 0}`);

          // 흰 페이지 체크
          if ((bodyText?.trim().length || 0) < 10 && (bodyHTML?.trim().length || 0) < 100) {
            console.error('🚨 흰 페이지 감지됨!');
            
            // 에러 정보 수집
            const errors = await popup.evaluate(() => {
              const scripts = Array.from(document.querySelectorAll('script'));
              const errors: string[] = [];
              
              // 콘솔 에러 확인
              window.addEventListener('error', (e) => {
                errors.push(`Error: ${e.message} at ${e.filename}:${e.lineno}`);
              });
              
              return {
                scripts: scripts.length,
                bodyText: document.body?.textContent?.trim().length || 0,
                bodyHTML: document.body?.innerHTML?.trim().length || 0,
                errors: errors
              };
            });
            
            console.error('팝업 에러 정보:', errors);
            
            // 추가 디버깅 스크린샷
            await popup.screenshot({ path: 'test-results/wizzpay-05-white-page-error.png', fullPage: true });
            
            // 네트워크 요청 확인
            const requests: string[] = [];
            popup.on('request', (request) => {
              requests.push(request.url());
            });
            
            await popup.waitForTimeout(2000);
            console.log('팝업 네트워크 요청:', requests.slice(0, 10));
            
            // 실패로 표시하되 계속 진행
            expect(bodyText?.trim().length || 0).toBeGreaterThan(10);
          } else {
            console.log('✅ 팝업이 정상적으로 로드됨');
          }

          // 팝업 닫기
          await popup.close();
        } else {
          console.log('⚠️ 팝업이 감지되지 않음 - form submit 방식일 수 있음');
          
          // form submit 방식 확인
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'test-results/wizzpay-04-no-popup.png', fullPage: true });
          
          // 새 창/탭 확인
          const pages = context.pages();
          console.log(`현재 열린 페이지 수: ${pages.length}`);
          
          if (pages.length > 1) {
            const newPage = pages[pages.length - 1];
            await newPage.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
            await newPage.screenshot({ path: 'test-results/wizzpay-04-new-tab.png', fullPage: true });
            console.log(`새 탭 URL: ${newPage.url()}`);
          }
        }
      } else {
        console.log('⚠️ 결제 버튼을 찾을 수 없음');
        await page.screenshot({ path: 'test-results/wizzpay-02-no-pay-button.png', fullPage: true });
      }
    }
  });

  test('API 응답 확인 - 결제 초기화', async ({ request }) => {
    // 결제 초기화 API 테스트
    const response = await request.post(`${PRODUCTION_URL}/api/payment/init`, {
      data: {
        goodsname: '테스트 상품권',
        amt: '10000',
        buyername: '테스트',
        bypassValue: JSON.stringify({
          orderId: 'TEST_' + Date.now(),
          phone: '01012345678',
          goodsCode: 'SSG'
        })
      }
    });

    console.log(`API 응답 상태: ${response.status()}`);
    
    if (response.status() === 200) {
      const data = await response.json();
      console.log('API 응답 데이터:', JSON.stringify(data, null, 2));
      
      // 필수 필드 확인
      expect(data).toHaveProperty('success');
      
      if (data.success) {
        expect(data).toHaveProperty('wizzUrl');
        expect(data).toHaveProperty('mid');
        expect(data).toHaveProperty('data');
        
        // URL에 개행 문자가 있는지 확인
        if (data.wizzUrl) {
          const hasNewline = data.wizzUrl.includes('\n') || data.wizzUrl.includes('\r');
          if (hasNewline) {
            console.error('🚨 wizzUrl에 개행 문자가 포함되어 있습니다!');
            console.error(`wizzUrl: "${data.wizzUrl}"`);
          }
          expect(hasNewline).toBe(false);
        }
        
        if (data.mid) {
          const hasNewline = data.mid.includes('\n') || data.mid.includes('\r');
          if (hasNewline) {
            console.error('🚨 mid에 개행 문자가 포함되어 있습니다!');
            console.error(`mid: "${data.mid}"`);
          }
          expect(hasNewline).toBe(false);
        }
      }
    } else {
      const errorText = await response.text();
      console.error('API 에러:', errorText);
    }
  });
});

