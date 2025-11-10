/**
 * 공식 샘플 vs 우리 구현의 실제 Ready.jsp POST 요청 비교
 */
const { chromium } = require('playwright');

async function captureRequest(url, name) {
  const separator = '='.repeat(60);
  console.log(`\n${separator}`);
  console.log(`${name} 테스트`);
  console.log(separator);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  let capturedRequest = null;

  // Ready.jsp POST 요청 캡처
  page.on('request', request => {
    if (request.url().includes('Ready.jsp') && request.method() === 'POST') {
      const postData = request.postData();
      capturedRequest = {
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: postData,
        postDataParsed: postData ? new URLSearchParams(postData) : null
      };

      console.log('\n📦 Ready.jsp POST 요청 캡처:');
      console.log('URL:', request.url());

      if (postData) {
        const params = new URLSearchParams(postData);
        console.log('\n📝 POST 파라미터:');
        console.log('  MID:', params.get('MID'));
        console.log('  DATA 길이:', params.get('DATA')?.length || 0);
        console.log('  DATA 앞부분:', params.get('DATA')?.substring(0, 100) + '...');
        console.log('  BLOCK_CARD_COMPANIES:', params.get('BLOCK_CARD_COMPANIES'));
      }
    }
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    if (url.includes('Main.html')) {
      // 공식 샘플
      await page.locator('button:has-text("결제"), button.btnPay').click();
    } else {
      // 우리 구현
      await page.locator('button:has-text("10,000원")').first().click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("지금 구매하기")').first().click();
      await page.waitForTimeout(1000);

      const inputs = await page.locator('input[type="tel"], input[type="text"]').all();
      if (inputs.length >= 2) {
        await inputs[0].fill('010-1234-5678');
        await inputs[1].fill('테스트');
      }

      await page.locator('button:has-text("결제하기")').first().click();
    }

    // 요청 캡처 대기
    await page.waitForTimeout(3000);

    await browser.close();
    return capturedRequest;

  } catch (error) {
    console.log('❌ 오류:', error.message);
    await browser.close();
    return null;
  }
}

(async () => {
  console.log('🔍 요청 비교 분석 시작...\n');

  // 1. 공식 샘플 요청 캡처
  const officialRequest = await captureRequest(
    'https://muyi-giftcard.vercel.app/Main.html',
    '공식 샘플 (성공)'
  );

  // 2. 우리 구현 요청 캡처
  const ourRequest = await captureRequest(
    'https://muyi-giftcard.vercel.app',
    '우리 구현 (실패)'
  );

  // 3. 비교 분석
  const separator = '='.repeat(60);
  console.log(`\n${separator}`);
  console.log('📊 비교 분석 결과');
  console.log(separator);

  if (officialRequest && ourRequest) {
    const officialParams = officialRequest.postDataParsed;
    const ourParams = ourRequest.postDataParsed;

    console.log('\n1️⃣ MID 비교:');
    console.log('  공식:', officialParams?.get('MID'));
    console.log('  우리:', ourParams?.get('MID'));
    console.log('  일치:', officialParams?.get('MID') === ourParams?.get('MID') ? '✅' : '❌');

    console.log('\n2️⃣ DATA 길이 비교:');
    const officialDataLen = officialParams?.get('DATA')?.length || 0;
    const ourDataLen = ourParams?.get('DATA')?.length || 0;
    console.log('  공식:', officialDataLen, 'bytes');
    console.log('  우리:', ourDataLen, 'bytes');
    console.log('  차이:', Math.abs(officialDataLen - ourDataLen), 'bytes');
    console.log('  일치:', officialDataLen === ourDataLen ? '✅' : '❌');

    console.log('\n3️⃣ DATA 내용 비교 (처음 100자):');
    const officialData = officialParams?.get('DATA') || '';
    const ourData = ourParams?.get('DATA') || '';
    console.log('  공식:', officialData.substring(0, 100));
    console.log('  우리:', ourData.substring(0, 100));
    console.log('  일치:', officialData === ourData ? '✅' : '❌');

    console.log('\n4️⃣ BLOCK_CARD_COMPANIES 비교:');
    console.log('  공식:', officialParams?.get('BLOCK_CARD_COMPANIES'));
    console.log('  우리:', ourParams?.get('BLOCK_CARD_COMPANIES'));
    console.log('  일치:', officialParams?.get('BLOCK_CARD_COMPANIES') === ourParams?.get('BLOCK_CARD_COMPANIES') ? '✅' : '❌');

    console.log('\n5️⃣ 전체 POST 데이터:');
    console.log('\n공식 샘플:');
    console.log(officialRequest.postData);
    console.log('\n우리 구현:');
    console.log(ourRequest.postData);

    if (officialRequest.postData !== ourRequest.postData) {
      console.log('\n⚠️ POST 데이터가 다릅니다!');
      console.log('이것이 실패 원인일 수 있습니다.');
    }
  } else {
    console.log('❌ 요청 캡처 실패');
  }

  console.log('\n✅ 분석 완료');
})();
