/**
 * 클라이프스 개발 환경 API 테스트
 * 규격서 Ver1.0 준수
 */

const CryptoJS = require('crypto-js');

// 개발 환경 설정 (규격서 1.3)
const DEV_CONFIG = {
  API_URL: 'https://devapi.chlifes.co.kr',
  GENID: 'AG20181105144054',
  GIFTNM: 'TE20241216184900',
  ENC_KEY: '39Vh8PgDwE2k9AfEvs2PW3kaxheEy064',
  IV: '1234123412341234',
};

/**
 * AES-256-CBC 암호화 (규격서 2.1)
 */
function encryptChlifes(data) {
  const key = CryptoJS.enc.Utf8.parse(DEV_CONFIG.ENC_KEY);
  const iv = CryptoJS.enc.Utf8.parse(DEV_CONFIG.IV);

  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return encrypted.toString();
}

/**
 * ISSUE_REQ_SN 생성 (규격서: 유니크 보장, 20자 이하)
 * 규격서: C, 20자, 필수
 */
function generateIssueReqSn() {
  const timestamp = Date.now().toString();
  // BRO(3) + timestamp(13) + random(4) = 20자
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const sn = `BRO${timestamp}${random}`;
  // 20자 초과 시 자르기
  return sn.length > 20 ? sn.substring(0, 20) : sn;
}

/**
 * ADD API 테스트 (규격서 4.1)
 */
async function testAddAPI() {
  console.log('\n=== [1/2] ADD API 테스트 (예비발행) ===\n');
  
  const issueReqSn = generateIssueReqSn();
  const phone = '01012345678';
  const amount = '10000';
  const message = '테스트 상품권입니다';

  // 요청 데이터 (규격서 준수)
  const addPayload = {
    GENID: DEV_CONFIG.GENID,                                    // 대문자
    CMD: 'ADD',                                                  // 필수
    GIFTNM: DEV_CONFIG.GIFTNM,                                  // 대문자
    FACE_PRICE: encryptChlifes(amount),                          // 암호화 필수
    ISSUE_REQ_SN: issueReqSn,                                   // 필수 (20자 이하)
    RECV_HPNO: encryptChlifes(phone.replace(/\D/g, '')),        // 암호화 필수 (숫자만)
    MESSAGE: encryptChlifes(message),                            // 규격서 2.2: 암호화 대상
    VALID_DAY: '30'                                             // 선택
  };

  console.log('요청 URL:', `${DEV_CONFIG.API_URL}/bro/gift_add.php`);
  console.log('요청 데이터:', JSON.stringify(addPayload, null, 2));
  console.log('\n암호화 확인:');
  console.log('  FACE_PRICE (암호화됨):', addPayload.FACE_PRICE);
  console.log('  RECV_HPNO (암호화됨):', addPayload.RECV_HPNO);
  console.log('  MESSAGE (암호화됨):', addPayload.MESSAGE);
  console.log('  ISSUE_REQ_SN 길이:', issueReqSn.length, '자');

  try {
    const response = await fetch(`${DEV_CONFIG.API_URL}/bro/gift_add.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(addPayload),
    });

    console.log('\n응답 상태:', response.status, response.statusText);
    console.log('응답 헤더:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ HTTP 오류:', text);
      return null;
    }

    const result = await response.json();
    console.log('\n✅ 응답 데이터:', JSON.stringify(result, null, 2));

    if (result.RET_CODE === '000000') {
      console.log('\n✅ ADD 성공!');
      console.log('  ISSUE_REQ_SN:', result.ISSUE_REQ_SN);
      console.log('  ISSUE_APRV_SN:', result.ISSUE_APRV_SN);
      console.log('  유효기간:', result.VALID_START_DATE, '~', result.VALID_END_DATE);
      return result;
    } else {
      console.error('\n❌ ADD 실패:', result.RET_CODE, result.RET_MESG);
      return null;
    }
  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error('스택:', error.stack);
    return null;
  }
}

/**
 * SEND API 테스트 (규격서 4.2)
 */
async function testSendAPI(issueReqSn, issueAprvSn) {
  console.log('\n=== [2/2] SEND API 테스트 (발행확정) ===\n');

  // 요청 데이터 (규격서 준수)
  const sendPayload = {
    GENID: DEV_CONFIG.GENID,      // 대문자
    CMD: 'SEND',                   // 필수
    GIFTNM: DEV_CONFIG.GIFTNM,     // 대문자
    ISSUE_REQ_SN: issueReqSn,      // ADD에서 사용한 값
    ISSUE_APRV_SN: issueAprvSn,    // ADD 응답에서 받은 값 (필수!)
    MSG_YN: 'Y'                    // Y: 클라이프스 발송, N: 자체 발송
  };

  console.log('요청 URL:', `${DEV_CONFIG.API_URL}/bro/gift_send.php`);
  console.log('요청 데이터:', JSON.stringify(sendPayload, null, 2));

  try {
    const response = await fetch(`${DEV_CONFIG.API_URL}/bro/gift_send.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(sendPayload),
    });

    console.log('\n응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ HTTP 오류:', text);
      return null;
    }

    const result = await response.json();
    console.log('\n✅ 응답 데이터:', JSON.stringify(result, null, 2));

    if (result.RET_CODE === '000000') {
      console.log('\n✅ SEND 성공!');
      console.log('  ISSUE_REQ_SN:', result.ISSUE_REQ_SN);
      console.log('  ISSUE_APRV_SN:', result.ISSUE_APRV_SN);
      console.log('  BARCODE:', result.BARCODE);
      return result;
    } else {
      console.error('\n❌ SEND 실패:', result.RET_CODE, result.RET_MESG);
      return null;
    }
  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error('스택:', error.stack);
    return null;
  }
}

/**
 * 전체 플로우 테스트
 */
async function testFullFlow() {
  console.log('================================================================================');
  console.log('🎫 클라이프스 개발 환경 API 테스트 (규격서 Ver1.0 준수)');
  console.log('================================================================================');
  console.log('\n개발 환경 설정:');
  console.log('  API_URL:', DEV_CONFIG.API_URL);
  console.log('  GENID:', DEV_CONFIG.GENID);
  console.log('  GIFTNM:', DEV_CONFIG.GIFTNM);
  console.log('  ENC_KEY:', DEV_CONFIG.ENC_KEY.substring(0, 10) + '...');
  console.log('  IV:', DEV_CONFIG.IV);

  // 1. ADD API 테스트
  const addResult = await testAddAPI();

  if (!addResult || !addResult.ISSUE_APRV_SN) {
    console.log('\n❌ ADD 실패로 인해 SEND 테스트를 중단합니다.');
    return;
  }

  // 2. SEND API 테스트
  const sendResult = await testSendAPI(addResult.ISSUE_REQ_SN, addResult.ISSUE_APRV_SN);

  // 결과 요약
  console.log('\n================================================================================');
  console.log('📊 테스트 결과 요약');
  console.log('================================================================================');
  console.log('ADD API:', addResult ? '✅ 성공' : '❌ 실패');
  console.log('SEND API:', sendResult ? '✅ 성공' : '❌ 실패');
  
  if (addResult && sendResult) {
    console.log('\n✅ 전체 플로우 성공!');
    console.log('  발행요청번호:', addResult.ISSUE_REQ_SN);
    console.log('  발행승인번호:', addResult.ISSUE_APRV_SN);
    console.log('  바코드:', sendResult.BARCODE);
  } else {
    console.log('\n❌ 일부 단계 실패');
  }
  console.log('================================================================================\n');
}

// 테스트 실행
testFullFlow().catch(console.error);

