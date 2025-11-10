/**
 * 팝업 내 Ready.jsp POST 요청 캡처
 */
const { chromium } = require('playwright');

async function captureWithPopup(url, name) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`${name}`);
  console.log('='.repeat(70));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  let capturedRequest = null;
  let popupPage = null;

  // 메인 페이지 요청 모니터링
  page.on('request', request => {
    if (request.url().includes('Ready.jsp') && request.method() === 'POST') {
      console.log('\n📦 메인 페이지에서 Ready.jsp POST 감지');
      capturedRequest = {
        url: request.url(),
        postData: request.postData(),
        source: 'main'
      };
    }
  });

  // 팝업 감지
  const popupPromise = new Promise(resolve => {
    context.on('page', async popup => {
      console.log('\n🔔 팝업 생성됨');
      popupPage = popup;

      // 팝업의 요청 모니터링
      popup.on('request', request => {
        console.log('  요청:', request.method(), request.url().substring(0, 80));

        if (request.url().includes('Ready.jsp')) {
          const postData = request.postData();
          console.log('\n📦 팝업에서 Ready.jsp 요청 캡처!');

          if (postData) {
            const params = new URLSearchParams(postData);
            console.log('\n📝 POST 파라미터:');
            console.log('  MID:', params.get('MID'));
            console.log('  DATA 길이:', params.get('DATA')?.length || 0);
            console.log('  BLOCK_CARD_COMPANIES:', params.get('BLOCK_CARD_COMPANIES'));

            capturedRequest = {
              url: request.url(),
              postData: postData,
              params: {
                MID: params.get('MID'),
                DATA: params.get('DATA'),
                BLOCK_CARD_COMPANIES: params.get('BLOCK_CARD_COMPANIES')
              },
              source: 'popup'
            };
          }
        }
      });

      resolve(popup);
    });
  });

  try {
    console.log('\n1️⃣ 페이지 접속...');
    await page.goto(url, { waitUntil: 'networkidle' });

    console.log('2️⃣ 결제 프로세스 시작...');
    if (url.includes('Main.html')) {
      await page.locator('button:has-text("결제"), button.btnPay').click();
    } else {
      await page.locator('button:has-text("10,000원")').first().click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("지금 구매하기")').first().click();
      await page.waitForTimeout(1000);

      const inputs = await page.locator('input[type="tel"], input[type="text"]').all();
      if (inputs.length >= 2) {
        await inputs[0].fill('010-1234-5678');
        await inputs[1].fill('테스트');
      }

      console.log('3️⃣ 결제하기 클릭...');
      await page.locator('button:has-text("결제하기")').first().click();
    }

    console.log('⏳ 팝업 및 요청 대기...');
    await Promise.race([
      popupPromise,
      page.waitForTimeout(10000)
    ]);

    await page.waitForTimeout(5000);

    console.log('\n✅ 캡처 완료');
    await browser.close();
    return capturedRequest;

  } catch (error) {
    console.log('\n❌ 오류:', error.message);
    await browser.close();
    return null;
  }
}

(async () => {
  console.log('🔍 팝업 요청 캡처 시작...\n');

  // 1. 공식 샘플 캡처
  const officialRequest = await captureWithPopup(
    'https://muyi-giftcard.vercel.app/Main.html',
    '공식 샘플 (Main.html) - 성공 케이스'
  );

  // 잠시 대기
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 2. 우리 구현 캡처
  const ourRequest = await captureWithPopup(
    'https://muyi-giftcard.vercel.app',
    '우리 구현 (Next.js) - 실패 케이스'
  );

  // 3. 비교 분석
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 최종 비교 분석');
  console.log('='.repeat(70));

  if (officialRequest && ourRequest) {
    console.log('\n✅ 두 요청 모두 캡처 성공\n');

    // MID 비교
    console.log('1️⃣ MID 비교:');
    console.log('  공식:', officialRequest.params.MID);
    console.log('  우리:', ourRequest.params.MID);
    const midMatch = officialRequest.params.MID === ourRequest.params.MID;
    console.log('  결과:', midMatch ? '✅ 일치' : '❌ 불일치');

    // DATA 길이 비교
    console.log('\n2️⃣ DATA 길이 비교:');
    const officialLen = officialRequest.params.DATA?.length || 0;
    const ourLen = ourRequest.params.DATA?.length || 0;
    console.log('  공식:', officialLen, 'bytes');
    console.log('  우리:', ourLen, 'bytes');
    console.log('  차이:', Math.abs(officialLen - ourLen), 'bytes');
    const lenMatch = officialLen === ourLen;
    console.log('  결과:', lenMatch ? '✅ 일치' : '❌ 불일치');

    // DATA 내용 비교
    console.log('\n3️⃣ DATA 암호화 값 비교 (처음 50자):');
    console.log('  공식:', officialRequest.params.DATA?.substring(0, 50));
    console.log('  우리:', ourRequest.params.DATA?.substring(0, 50));
    const dataMatch = officialRequest.params.DATA === ourRequest.params.DATA;
    console.log('  결과:', dataMatch ? '✅ 완전 일치' : '❌ 불일치');

    // 전체 POST 데이터
    console.log('\n4️⃣ 전체 POST 데이터 비교:');
    console.log('\n[공식 샘플]');
    console.log(officialRequest.postData);
    console.log('\n[우리 구현]');
    console.log(ourRequest.postData);

    const fullMatch = officialRequest.postData === ourRequest.postData;
    console.log('\n전체 POST 데이터:', fullMatch ? '✅ 완전 일치' : '❌ 불일치');

    // 결론
    console.log('\n' + '='.repeat(70));
    console.log('📋 결론');
    console.log('='.repeat(70));

    if (midMatch && lenMatch && dataMatch && fullMatch) {
      console.log('✅ 요청이 완전히 동일합니다!');
      console.log('   → 문제는 다른 곳에 있을 수 있습니다.');
    } else {
      console.log('❌ 요청에 차이가 있습니다!');
      if (!midMatch) console.log('   - MID가 다름');
      if (!lenMatch) console.log('   - DATA 길이가 다름 (암호화 데이터 내용이 다름)');
      if (!dataMatch) console.log('   - DATA 암호화 값이 다름');
      console.log('   → 이 차이가 Ready.jsp에서 멈추는 원인일 수 있습니다.');
    }

  } else {
    console.log('\n❌ 요청 캡처 실패');
    if (!officialRequest) console.log('   - 공식 샘플 캡처 실패');
    if (!ourRequest) console.log('   - 우리 구현 캡처 실패');
  }

  console.log('\n✅ 분석 완료\n');
})();
