// lib/utils.ts - 공통 유틸리티 함수

/**
 * 고유한 주문 ID 생성
 * 형식: ORD{timestamp}{random}
 * 예시: ORD1736345678ABC123
 */
export function generateOrderId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD${timestamp}${random}`;
}

/**
 * 전화번호 포맷 검증
 * 010-1234-5678 형식만 허용
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^010-\d{4}-\d{4}$/;
  return phoneRegex.test(phone);
}

/**
 * 전화번호 포맷팅
 * 01012345678 → 010-1234-5678
 */
export function formatPhoneNumber(phone: string): string {
  // 숫자만 추출
  const numbers = phone.replace(/\D/g, '');

  // 010으로 시작하는 11자리 숫자인지 확인
  if (numbers.length === 11 && numbers.startsWith('010')) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }

  return phone; // 포맷팅 실패 시 원본 반환
}

/**
 * 이메일 형식 검증
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 금액 포맷팅 (천 단위 콤마)
 * 10000 → 10,000
 */
export function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

/**
 * 날짜 포맷팅
 * 2025-01-10T12:34:56 → 2025년 1월 10일 12:34
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 상품권 코드 마스킹
 * ABC123DEF456 → ABC***DEF***
 */
export function maskGiftcardCode(code: string): string {
  if (code.length <= 6) return code;

  const visibleStart = code.slice(0, 3);
  const visibleEnd = code.slice(-3);
  const maskedLength = code.length - 6;

  return `${visibleStart}${'*'.repeat(maskedLength)}${visibleEnd}`;
}

/**
 * ISSUE_REQ_SN 생성 (클라이프스 규격서 준수)
 * 형식: BRO{YYYYMMDDHHmmss}{random}
 * 예시: BRO2025011012345678
 * 규칙: 20자 이하, 유니크 보장
 */
export function generateIssueReqSn(): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-:T.]/g, '')
    .slice(0, 14); // YYYYMMDDHHmmss
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `BRO${timestamp}${random}`;
}
