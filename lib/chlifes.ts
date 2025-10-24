import CryptoJS from 'crypto-js';

// 클라이프스 API 설정
const CHLIFES_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_CHLIFES_URL || 'https://devapi.chlifes.co.kr',
  genid: process.env.CHLIFES_GENID || 'AG20181105144054',
  giftnm: process.env.CHLIFES_GIFTNM || 'TE20241216184900',
  encKey: process.env.CHLIFES_ENC_KEY || '39Vh8PgDwE2k9AfEvs2PW3kaxheEy064',
  iv: '1234123412341234',
};

// AES-256-CBC 암호화
export function encryptAES256(plaintext: string): string {
  const key = CryptoJS.enc.Utf8.parse(CHLIFES_CONFIG.encKey);
  const iv = CryptoJS.enc.Utf8.parse(CHLIFES_CONFIG.iv);

  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return encrypted.toString();
}

// AES-256-CBC 복호화
export function decryptAES256(ciphertext: string): string {
  const key = CryptoJS.enc.Utf8.parse(CHLIFES_CONFIG.encKey);
  const iv = CryptoJS.enc.Utf8.parse(CHLIFES_CONFIG.iv);

  const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
}

// ISSUE_REQ_SN 생성 (유니크 ID)
export function generateIssueReqSn(): string {
  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 90 + 10); // 10-99
  return `BRO${timestamp}${random}`;
}

// 상품권 발행 요청 (ADD API)
export async function issueGiftCard(data: {
  amount: number;
  phone: string;
  message?: string;
  validDays?: number;
}) {
  const issueReqSn = generateIssueReqSn();

  const requestData = {
    GENID: CHLIFES_CONFIG.genid,
    CMD: 'ADD',
    GIFTNM: CHLIFES_CONFIG.giftnm,
    FACE_PRICE: encryptAES256(data.amount.toString()),
    ISSUE_REQ_SN: issueReqSn,
    RECV_HPNO: encryptAES256(data.phone),
    MESSAGE: data.message || '무이상품권 구매 감사합니다',
    VALID_DAY: (data.validDays || 30).toString(),
  };

  const response = await fetch(`${CHLIFES_CONFIG.baseUrl}/bro/gift_add.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });

  return response.json();
}

// 바코드 발급 (SEND API)
export async function sendBarcode(issueReqSn: string, issueAprvSn: string) {
  const requestData = {
    GENID: CHLIFES_CONFIG.genid,
    CMD: 'SEND',
    GIFTNM: CHLIFES_CONFIG.giftnm,
    ISSUE_REQ_SN: issueReqSn,
    ISSUE_APRV_SN: issueAprvSn,
    MSG_YN: 'Y',
  };

  const response = await fetch(`${CHLIFES_CONFIG.baseUrl}/bro/gift_send.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });

  return response.json();
}

// 상품권 조회 (QRY API)
export async function queryGiftCard(issueReqSn: string) {
  const requestData = {
    GENID: CHLIFES_CONFIG.genid,
    CMD: 'QRY',
    GIFTNM: CHLIFES_CONFIG.giftnm,
    ISSUE_REQ_SN: issueReqSn,
  };

  const response = await fetch(`${CHLIFES_CONFIG.baseUrl}/bro/gift_check.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });

  return response.json();
}

// 상품권 취소 (DEL API)
export async function cancelGiftCard(issueReqSn: string) {
  const requestData = {
    GENID: CHLIFES_CONFIG.genid,
    CMD: 'DEL',
    GIFTNM: CHLIFES_CONFIG.giftnm,
    ISSUE_REQ_SN: issueReqSn,
  };

  const response = await fetch(`${CHLIFES_CONFIG.baseUrl}/bro/gift_check.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });

  return response.json();
}
