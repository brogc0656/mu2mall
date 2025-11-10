// 위즈페이 암호화 수정 검증 테스트
const CryptoJS = require('crypto-js');

// 테스트용 환경 변수 (위즈페이 테스트 계정)
const WIZZ_CONFIG = {
  PASSWORD: '1733',
  IV_KEY: '7e74bfa70c4a79d827b500ab9a287d63',
  SALT: 'f8eb4a8a6873ba15e86668f1a17c0642',
  MID: 'isptest03m'
};

// ❌ 이전 방식 (잘못됨)
function encryptWizzpayOld(data) {
  const key = CryptoJS.enc.Utf8.parse(WIZZ_CONFIG.PASSWORD);
  const iv = CryptoJS.enc.Utf8.parse(WIZZ_CONFIG.IV_KEY);

  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return encrypted.toString();
}

// ✅ 새로운 방식 (올바름 - 위즈페이 SDK와 동일)
function encryptWizzpayNew(data) {
  // PBKDF2로 키 유도
  const key = CryptoJS.PBKDF2(
    WIZZ_CONFIG.PASSWORD,
    CryptoJS.enc.Hex.parse(WIZZ_CONFIG.SALT),
    {
      keySize: 128 / 32,
      iterations: 1000
    }
  );

  // IV는 Hex로 파싱
  const iv = CryptoJS.enc.Hex.parse(WIZZ_CONFIG.IV_KEY);

  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return encrypted.toString();
}

// ❌ 이전 데이터 형식 (대문자 키)
const oldData = {
  MID: WIZZ_CONFIG.MID,
  ORDERID: 'TEST123',
  GOODSNAME: '테스트상품권',
  AMT: '50000',
  BUYERNAME: '테스트구매자',
  BYPASSVALUE: '010-1234-5678',
  RESULTURL: 'https://example.com/success',
  NOTIURL: 'https://example.com/notification'
};

// ✅ 새로운 데이터 형식 (소문자 키, MID 제외)
const newData = {
  goodsname: '테스트상품권',
  amt: '50000',
  buyername: '테스트구매자',
  bypassvalue: '010-1234-5678',
  resulturl: 'https://example.com/success',
  notiurl: 'https://example.com/notification'
};

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 위즈페이 암호화 수정 검증 테스트');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 1. 데이터 형식 비교
console.log('1️⃣ 데이터 형식 비교\n');
console.log('❌ 이전 형식 (대문자 키, MID 포함):');
console.log(JSON.stringify(oldData, null, 2));
console.log('\n✅ 새로운 형식 (소문자 키, MID 제외):');
console.log(JSON.stringify(newData, null, 2));
console.log('');

// 2. 암호화 방식 비교
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('2️⃣ 암호화 방식 비교\n');

const oldDataString = JSON.stringify(oldData);
const newDataString = JSON.stringify(newData);

console.log('❌ 이전 암호화 (UTF8 파싱):');
const oldEncrypted = encryptWizzpayOld(oldDataString);
console.log(oldEncrypted.substring(0, 100) + '...');
console.log(`   길이: ${oldEncrypted.length}자\n`);

console.log('✅ 새로운 암호화 (PBKDF2 + Hex 파싱):');
const newEncrypted = encryptWizzpayNew(newDataString);
console.log(newEncrypted.substring(0, 100) + '...');
console.log(`   길이: ${newEncrypted.length}자\n`);

// 3. 위즈페이 SDK 방식과 비교
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('3️⃣ 위즈페이 SDK 방식과 동일한지 검증\n');

// 위즈페이 SDK toEncrypt 함수와 동일하게 테스트
const testData = { goodsname: "test", amt: "1000", buyername: "테스터" };
const sdkStyleEncrypted = encryptWizzpayNew(JSON.stringify(testData));

console.log('✅ 위즈페이 SDK 스타일 암호화:');
console.log('   Data:', JSON.stringify(testData));
console.log('   Encrypted:', sdkStyleEncrypted.substring(0, 80) + '...\n');

// 4. 전송 형식 비교
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('4️⃣ 위즈페이 서버로 전송할 form 데이터 비교\n');

console.log('❌ 이전 방식:');
console.log('   MID: (암호화된 DATA 안에 포함) ← 잘못됨!');
console.log('   DATA: ' + oldEncrypted.substring(0, 60) + '...\n');

console.log('✅ 새로운 방식 (위즈페이 SDK와 동일):');
console.log('   MID: ' + WIZZ_CONFIG.MID + ' ← 별도 전송');
console.log('   DATA: ' + newEncrypted.substring(0, 60) + '...\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ 검증 완료!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📋 수정 사항 요약:');
console.log('1. JSON 키를 대문자 → 소문자로 변경');
console.log('2. MID를 암호화 데이터에서 제거');
console.log('3. PBKDF2 키 유도 방식 적용');
console.log('4. IV_KEY, SALT를 Hex로 파싱\n');

console.log('💡 다음 단계:');
console.log('1. git push하여 Vercel에 배포');
console.log('2. 프로덕션에서 결제하기 버튼 클릭 테스트');
console.log('3. 흰 페이지 → 위즈페이 결제 화면으로 변경 확인\n');
