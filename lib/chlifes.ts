/**
 * lib/chlifes.ts - 클라이프스 상품권 API 유틸리티
 * 
 * 규격서: 상품권 발송 연동 규격서 Ver1.0 - 브라더
 * 엔드포인트: /bro/gift_add.php, /bro/gift_send.php, /bro/gift_check.php
 * 
 * ⚠️ 서버 사이드 전용 - 민감한 키는 클라이언트에 노출되지 않음
 */

import CryptoJS from 'crypto-js';
import { generateIssueReqSn } from './utils';

// 환경 변수에서만 읽음 (브라우저 노출 방지)
const CHLIFES_CONFIG = {
  API_URL: process.env.NEXT_PUBLIC_CHLIFES_URL!,
  GENID: process.env.CHLIFES_GENID!,
  GIFTNM: process.env.CHLIFES_GIFTNM!,
  ENC_KEY: process.env.CHLIFES_ENC_KEY!,
  IV: process.env.CHLIFES_IV!,
};

/**
 * AES-256-CBC 암호화 (클라이프스 규격서 준수)
 * - 알고리즘: AES-256-CBC
 * - IV: 1234123412341234 (고정값)
 * - 인코딩: Base64
 */
export function encryptChlifes(data: string): string {
  const key = CryptoJS.enc.Utf8.parse(CHLIFES_CONFIG.ENC_KEY);
  const iv = CryptoJS.enc.Utf8.parse(CHLIFES_CONFIG.IV);

  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return encrypted.toString();
}

/**
 * AES-256-CBC 복호화 (클라이프스 규격서 준수)
 */
export function decryptChlifes(encryptedData: string): string {
  const key = CryptoJS.enc.Utf8.parse(CHLIFES_CONFIG.ENC_KEY);
  const iv = CryptoJS.enc.Utf8.parse(CHLIFES_CONFIG.IV);

  const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * 상품권 발급 요청 인터페이스
 */
export interface GiftcardRequest {
  phone: string;      // 수신자 전화번호 (01012345678 형식)
  amount: number;     // 금액 (원 단위)
  message?: string;   // 메시지 (선택, 기본값: "상품권입니다")
  validDay?: string;  // 유효기간 일수 (선택, 기본값: "30")
}

/**
 * ADD API 응답 인터페이스
 */
export interface AddResponse {
  GENID: string;
  CMD: string;
  GIFTNM?: string;
  ISSUE_REQ_SN: string;
  ISSUE_APRV_SN: string;  // SEND API에 필수!
  VALID_START_DATE?: string;
  VALID_END_DATE?: string;
  RET_CODE: string;       // "000000" = 성공
  RET_MESG?: string;
}

/**
 * SEND API 응답 인터페이스
 */
export interface SendResponse {
  GENID: string;
  CMD: string;
  ISSUE_REQ_SN: string;
  ISSUE_APRV_SN: string;
  BARCODE: string;        // 상품권 바코드
  RET_CODE: string;       // "000000" = 성공
  RET_MESG?: string;
}

/**
 * 상품권 발급 결과
 */
export interface GiftcardResult {
  success: boolean;
  issueReqSn?: string;
  issueAprvSn?: string;
  barcode?: string;
  error?: string;
  retCode?: string;
  retMesg?: string;
}

/**
 * ADD API - 상품권 예비발행
 * 규격서: 4.1 신규 영업대행사 예비발행
 */
export async function addGiftCard(request: GiftcardRequest): Promise<GiftcardResult> {
  try {
    // ISSUE_REQ_SN 생성 (유니크 보장)
    const issueReqSn = generateIssueReqSn();

    // 요청 데이터 (규격서 준수)
    const addPayload = {
      GENID: CHLIFES_CONFIG.GENID,                                    // 대문자
      CMD: "ADD",                                                      // 필수
      GIFTNM: CHLIFES_CONFIG.GIFTNM,                                   // 대문자
      FACE_PRICE: encryptChlifes(request.amount.toString()),           // 암호화 필수
      ISSUE_REQ_SN: issueReqSn,                                       // 필수
      RECV_HPNO: encryptChlifes(request.phone.replace(/\D/g, '')),    // 암호화 필수 (숫자만)
      MESSAGE: request.message || "상품권입니다",                      // 평문
      VALID_DAY: request.validDay || "30"                              // 선택
    };

    // API 호출
    const response = await fetch(`${CHLIFES_CONFIG.API_URL}/bro/gift_add.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(addPayload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: AddResponse = await response.json();

    // 응답 코드 확인 (규격서: RET_CODE는 6자리)
    if (result.RET_CODE !== '000000') {
      return {
        success: false,
        error: result.RET_MESG || `ADD 실패: ${result.RET_CODE}`,
        retCode: result.RET_CODE,
        retMesg: result.RET_MESG,
      };
    }

    // ISSUE_APRV_SN 저장 필수! (SEND API에 필요)
    return {
      success: true,
      issueReqSn: result.ISSUE_REQ_SN,
      issueAprvSn: result.ISSUE_APRV_SN,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'ADD API 호출 실패',
    };
  }
}

/**
 * SEND API - 발행확정 및 바코드 수령
 * 규격서: 4.2 발행확정
 * 
 * ⚠️ 중요: ADD API에서 받은 ISSUE_APRV_SN이 필수!
 */
export async function sendGiftCard(
  issueReqSn: string,
  issueAprvSn: string,
  msgYn: 'Y' | 'N' = 'Y'
): Promise<GiftcardResult> {
  try {
    // 요청 데이터 (규격서 준수)
    const sendPayload = {
      GENID: CHLIFES_CONFIG.GENID,      // 대문자
      CMD: "SEND",                      // 필수
      GIFTNM: CHLIFES_CONFIG.GIFTNM,    // 대문자
      ISSUE_REQ_SN: issueReqSn,        // ADD에서 사용한 값
      ISSUE_APRV_SN: issueAprvSn,      // ADD 응답에서 받은 값 (필수!)
      MSG_YN: msgYn                     // Y: 클라이프스 발송, N: 자체 발송
    };

    // API 호출
    const response = await fetch(`${CHLIFES_CONFIG.API_URL}/bro/gift_send.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(sendPayload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: SendResponse = await response.json();

    // 응답 코드 확인
    if (result.RET_CODE !== '000000') {
      return {
        success: false,
        error: result.RET_MESG || `SEND 실패: ${result.RET_CODE}`,
        retCode: result.RET_CODE,
        retMesg: result.RET_MESG,
      };
    }

    return {
      success: true,
      issueReqSn: result.ISSUE_REQ_SN,
      issueAprvSn: result.ISSUE_APRV_SN,
      barcode: result.BARCODE,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'SEND API 호출 실패',
    };
  }
}

/**
 * 상품권 발급 (ADD → SEND 자동 처리)
 * 재시도 로직 포함 (최대 3회)
 */
export async function issueGiftCard(
  request: GiftcardRequest,
  maxRetries: number = 3
): Promise<GiftcardResult> {
  let lastError: GiftcardResult | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 1단계: ADD (예비발행)
      const addResult = await addGiftCard(request);

      if (!addResult.success) {
        lastError = addResult;
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        return addResult;
      }

      // ISSUE_APRV_SN 확인
      if (!addResult.issueAprvSn) {
        return {
          success: false,
          error: 'ISSUE_APRV_SN이 응답에 없습니다',
        };
      }

      // 2단계: SEND (발행확정)
      const sendResult = await sendGiftCard(
        addResult.issueReqSn!,
        addResult.issueAprvSn,
        'Y' // 클라이프스가 SMS 발송
      );

      if (!sendResult.success) {
        lastError = sendResult;
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        return sendResult;
      }

      // 성공
      return {
        success: true,
        issueReqSn: addResult.issueReqSn,
        issueAprvSn: addResult.issueAprvSn,
        barcode: sendResult.barcode,
      };
    } catch (error: any) {
      lastError = {
        success: false,
        error: error.message || '알 수 없는 오류',
      };

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  // 모든 재시도 실패
  return lastError || {
    success: false,
    error: '상품권 발급 실패 (최대 재시도 횟수 초과)',
  };
}

/**
 * QRY API - 상품권 상태 조회
 * 규격서: 4.3 영업대행사 조회
 */
export interface QueryResponse {
  GENID: string;
  CMD: string;
  GIFTNM: string;
  ISSUE_REQ_SN: string;
  ISSUE_APRV_SN: string;
  FACE_PRICE?: string;
  CURR_PRICE?: string;
  ISSUE_STATUS?: string;
  VALID_START_DATE?: string;
  VALID_END_DATE?: string;
  RET_CODE: string;
  RET_MESG?: string;
}

export async function queryGiftCard(
  issueReqSn: string,
  issueAprvSn: string
): Promise<{ success: boolean; data?: QueryResponse; error?: string }> {
  try {
    const queryPayload = {
      GENID: CHLIFES_CONFIG.GENID,
      CMD: "QRY",
      GIFTNM: CHLIFES_CONFIG.GIFTNM,
      ISSUE_REQ_SN: issueReqSn,
      ISSUE_APRV_SN: issueAprvSn,
    };

    const response = await fetch(`${CHLIFES_CONFIG.API_URL}/bro/gift_check.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(queryPayload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: QueryResponse = await response.json();

    if (result.RET_CODE !== '000000') {
      return {
        success: false,
        error: result.RET_MESG || `조회 실패: ${result.RET_CODE}`,
      };
    }

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'QRY API 호출 실패',
    };
  }
}

/**
 * DEL API - 상품권 발행 취소
 * 규격서: 4.3 영업대행사 취소
 */
export async function cancelGiftCard(
  issueReqSn: string,
  issueAprvSn: string
): Promise<{ success: boolean; error?: string; retCode?: string }> {
  try {
    const delPayload = {
      GENID: CHLIFES_CONFIG.GENID,
      CMD: "DEL",
      GIFTNM: CHLIFES_CONFIG.GIFTNM,
      ISSUE_REQ_SN: issueReqSn,
      ISSUE_APRV_SN: issueAprvSn,
    };

    const response = await fetch(`${CHLIFES_CONFIG.API_URL}/bro/gift_check.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(delPayload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.RET_CODE !== '000000') {
      return {
        success: false,
        error: result.RET_MESG || `취소 실패: ${result.RET_CODE}`,
        retCode: result.RET_CODE,
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'DEL API 호출 실패',
    };
  }
}

/**
 * 환경 변수 검증
 */
export function validateChlifesConfig(): boolean {
  return !!(
    CHLIFES_CONFIG.API_URL &&
    CHLIFES_CONFIG.GENID &&
    CHLIFES_CONFIG.GIFTNM &&
    CHLIFES_CONFIG.ENC_KEY &&
    CHLIFES_CONFIG.IV
  );
}

export { CHLIFES_CONFIG };
