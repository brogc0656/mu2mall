// lib/wizzpay.ts - 서버사이드 전용 Wizzpay 유틸리티
import CryptoJS from 'crypto-js';

// ✅ 환경 변수에서만 읽음 (브라우저 노출 방지)
const WIZZ_CONFIG = {
  WIZZ_URL: process.env.NEXT_PUBLIC_WIZZPAY_URL!,
  MID: process.env.WIZZPAY_MID!,
  IV_KEY: process.env.WIZZPAY_IV_KEY!,
  SALT: process.env.WIZZPAY_SALT!,
  PASSWORD: process.env.WIZZPAY_PASSWORD!,
};

/**
 * Wizzpay 암호화 함수
 * ⚠️ 중요: 위즈페이 SDK와 동일한 방식 사용 (PBKDF2 키 유도)
 */
export function encryptWizzpay(data: string): string {
  // PBKDF2로 키 유도 (위즈페이 SDK function.js와 동일)
  const key = CryptoJS.PBKDF2(
    WIZZ_CONFIG.PASSWORD,
    CryptoJS.enc.Hex.parse(WIZZ_CONFIG.SALT),
    {
      keySize: 128 / 32,  // 128 bits = 4 words
      iterations: 1000
    }
  );

  // IV는 Hex로 파싱 (위즈페이 SDK와 동일)
  const iv = CryptoJS.enc.Hex.parse(WIZZ_CONFIG.IV_KEY);

  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return encrypted.toString();
}

/**
 * Wizzpay 복호화 함수
 * ⚠️ 중요: 위즈페이 SDK와 동일한 방식 사용 (PBKDF2 키 유도)
 */
export function decryptWizzpay(encryptedData: string): string {
  // PBKDF2로 키 유도 (암호화와 동일)
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

  const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * 결제 요청 데이터 생성
 */
export interface PaymentRequest {
  orderid: string;
  goodsname: string;
  amt: string;
  buyername: string;
  buyertel: string;
  buyeremail: string;
  bypassvalue?: string;
  resulturl?: string;
  notiurl?: string;
}

export function createPaymentData(data: PaymentRequest) {
  // ⚠️ 중요: 위즈페이 SDK와 동일한 소문자 키 사용
  // MID는 암호화된 DATA에 포함하지 않음 (별도로 전송)
  return {
    goodsname: data.goodsname,
    amt: data.amt,
    buyername: data.buyername,
    resulturl: data.resulturl || '',
    notiurl: data.notiurl || '',
    bypassvalue: data.bypassvalue || '',
  };
}

/**
 * 환경 변수 검증
 */
export function validateWizzpayConfig(): boolean {
  return !!(
    WIZZ_CONFIG.WIZZ_URL &&
    WIZZ_CONFIG.MID &&
    WIZZ_CONFIG.IV_KEY &&
    WIZZ_CONFIG.SALT &&
    WIZZ_CONFIG.PASSWORD
  );
}

export { WIZZ_CONFIG };





