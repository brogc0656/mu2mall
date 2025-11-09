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
 */
export function encryptWizzpay(data: string): string {
  const key = CryptoJS.enc.Utf8.parse(WIZZ_CONFIG.PASSWORD);
  const iv = CryptoJS.enc.Utf8.parse(WIZZ_CONFIG.IV_KEY);

  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return encrypted.toString();
}

/**
 * Wizzpay 복호화 함수
 */
export function decryptWizzpay(encryptedData: string): string {
  const key = CryptoJS.enc.Utf8.parse(WIZZ_CONFIG.PASSWORD);
  const iv = CryptoJS.enc.Utf8.parse(WIZZ_CONFIG.IV_KEY);

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
}

export function createPaymentData(data: PaymentRequest) {
  return {
    MID: WIZZ_CONFIG.MID,
    ORDERID: data.orderid,
    GOODSNAME: data.goodsname,
    AMT: data.amt,
    BUYERNAME: data.buyername,
    BUYERTEL: data.buyertel,
    BUYEREMAIL: data.buyeremail,
    BYPASSVALUE: data.bypassvalue || '',
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





