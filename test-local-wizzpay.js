const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // 로컬 위즈페이 테스트 페이지 열기
  const localPath = path.join(__dirname, '../pg/wizzpay/Main.html');
  const fileUrl = 'file://' + localPath;

  console.log('🌐 로컬 위즈페이 테스트 페이지 열기...');
  console.log('파일 경로:', fileUrl);

  await page.goto(fileUrl);
  await page.waitForTimeout(2000);

  console.log('✅ 페이지 로드 완료');
  console.log('📄 페이지 제목:', await page.title());

  // 스크린샷
  await page.screenshot({ path: './wizzpay-local-page.png', fullPage: true });
  console.log('📸 스크린샷 저장: ./wizzpay-local-page.png');

  // WizzpayISP 객체 확인
  console.log('\n🔍 WizzpayISP 객체 확인...');
  const wizzpayCheck = await page.evaluate(() => {
    return {
      exists: typeof WizzpayISP !== 'undefined',
      isFunction: typeof WizzpayISP === 'function',
      hasPrototype: typeof WizzpayISP !== 'undefined' && WizzpayISP.prototype !== undefined
    };
  });

  console.log('WizzpayISP 존재:', wizzpayCheck.exists ? '✅' : '❌');
  console.log('WizzpayISP 함수:', wizzpayCheck.isFunction ? '✅' : '❌');
  console.log('WizzpayISP prototype:', wizzpayCheck.hasPrototype ? '✅' : '❌');

  // 환경 변수 확인
  console.log('\n🔐 설정된 환경 변수 확인...');
  const config = await page.evaluate(() => {
    return {
      WIZZ_URL: typeof WIZZ_URL !== 'undefined' ? WIZZ_URL : 'undefined',
      MID: typeof MID !== 'undefined' ? (MID || '(빈 문자열)') : 'undefined',
      IV_KEY: typeof IV_KEY !== 'undefined' ? (IV_KEY ? '설정됨 (' + IV_KEY.length + '자)' : '(빈 문자열)') : 'undefined',
      SALT: typeof SALT !== 'undefined' ? (SALT ? '설정됨 (' + SALT.length + '자)' : '(빈 문자열)') : 'undefined',
      PASSWORD: typeof PASSWORD !== 'undefined' ? (PASSWORD ? '설정됨 (' + PASSWORD.length + '자)' : '(빈 문자열)') : 'undefined'
    };
  });

  console.log('WIZZ_URL:', config.WIZZ_URL);
  console.log('MID:', config.MID);
  console.log('IV_KEY:', config.IV_KEY);
  console.log('SALT:', config.SALT);
  console.log('PASSWORD:', config.PASSWORD);

  // 입력 필드 값 설정
  console.log('\n📝 테스트 데이터 입력...');
  await page.fill('#GOODSNAME', '테스트상품권');
  await page.fill('#AMT', '50000');
  await page.fill('#BUYERNAME', '테스트구매자');

  console.log('✅ 테스트 데이터 입력 완료');

  // 스크린샷
  await page.screenshot({ path: './wizzpay-local-filled.png', fullPage: true });
  console.log('📸 입력 완료 스크린샷 저장');

  // Console 로그 모니터링
  console.log('\n📊 브라우저 콘솔 모니터링 중...');
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log('❌ Console Error:', text);
    } else if (text.includes('Wizzpay') || text.includes('wizz')) {
      console.log('💬 Console:', text);
    }
  });

  console.log('\n⚠️  결제 버튼을 클릭하면 실제 위즈페이 팝업이 열립니다');
  console.log('⚠️  테스트 환경이므로 실제 결제는 진행되지 않습니다');
  console.log('\n⏳ 60초 대기 - 수동으로 결제 버튼을 클릭해보세요...');

  await page.waitForTimeout(60000);

  await browser.close();
  console.log('✅ 테스트 완료!');
})();
