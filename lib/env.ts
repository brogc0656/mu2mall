/**
 * 환경 변수 검증 유틸리티
 * 보안: 민감한 환경 변수가 제대로 설정되어 있는지 검증
 */

export interface EnvConfig {
  // 클라이언트 노출 가능 (URL만)
  NEXT_PUBLIC_BASE_URL: string;
  NEXT_PUBLIC_WIZZPAY_URL: string;
  NEXT_PUBLIC_CHLIFES_URL: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;

  // 서버 전용 (절대 클라이언트 노출 금지)
  WIZZPAY_MID: string;
  WIZZPAY_IV_KEY: string;
  WIZZPAY_SALT: string;
  WIZZPAY_PASSWORD: string;
  CHLIFES_GENID: string;
  CHLIFES_GIFTNM: string;
  CHLIFES_ENC_KEY: string;
  CHLIFES_IV: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

/**
 * 필수 환경 변수 목록
 */
const REQUIRED_ENV_VARS = {
  client: [
    'NEXT_PUBLIC_BASE_URL',
    'NEXT_PUBLIC_WIZZPAY_URL',
    'NEXT_PUBLIC_CHLIFES_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ],
  server: [
    'WIZZPAY_MID',
    'WIZZPAY_IV_KEY',
    'WIZZPAY_SALT',
    'WIZZPAY_PASSWORD',
    'CHLIFES_GENID',
    'CHLIFES_GIFTNM',
    'CHLIFES_ENC_KEY',
    'CHLIFES_IV',
    'SUPABASE_SERVICE_ROLE_KEY',
  ],
};

/**
 * 환경 변수 보안 검증
 * @throws {Error} 필수 환경 변수가 없거나 보안 위반 시
 */
export function validateEnv(): void {
  const errors: string[] = [];

  // 1. 필수 클라이언트 환경 변수 확인
  for (const key of REQUIRED_ENV_VARS.client) {
    if (!process.env[key]) {
      errors.push(`❌ 필수 클라이언트 환경 변수 누락: ${key}`);
    }
  }

  // 2. 필수 서버 환경 변수 확인 (서버 사이드에서만)
  if (typeof window === 'undefined') {
    for (const key of REQUIRED_ENV_VARS.server) {
      if (!process.env[key]) {
        errors.push(`❌ 필수 서버 환경 변수 누락: ${key}`);
      }
    }
  }

  // 3. 보안 위반 확인: 민감한 정보가 NEXT_PUBLIC_으로 노출되는지 체크
  const dangerousVars = [
    'NEXT_PUBLIC_WIZZPAY_MID',
    'NEXT_PUBLIC_WIZZPAY_IV_KEY',
    'NEXT_PUBLIC_WIZZPAY_SALT',
    'NEXT_PUBLIC_WIZZPAY_PASSWORD',
    'NEXT_PUBLIC_CHLIFES_GENID',
    'NEXT_PUBLIC_CHLIFES_GIFTNM',
    'NEXT_PUBLIC_CHLIFES_ENC_KEY',
    'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
  ];

  for (const key of dangerousVars) {
    if (process.env[key]) {
      errors.push(`🚨 보안 위반: 민감한 정보가 클라이언트에 노출됨 - ${key}`);
    }
  }

  // 4. 에러가 있으면 throw
  if (errors.length > 0) {
    const errorMessage = [
      '='.repeat(80),
      '🔐 환경 변수 검증 실패',
      '='.repeat(80),
      ...errors,
      '='.repeat(80),
      '해결 방법:',
      '1. .env.local 파일 확인',
      '2. Vercel 대시보드에서 환경 변수 설정',
      '3. 민감한 정보는 NEXT_PUBLIC_ 접두사 없이 설정',
      '='.repeat(80),
    ].join('\n');

    throw new Error(errorMessage);
  }
}

/**
 * 서버 환경 변수 안전하게 가져오기
 * @param key - 환경 변수 이름
 * @returns 환경 변수 값
 * @throws {Error} 서버 전용 변수를 클라이언트에서 접근 시
 */
export function getServerEnv(key: keyof EnvConfig): string {
  // 클라이언트에서 서버 전용 변수 접근 방지
  if (typeof window !== 'undefined') {
    throw new Error(
      `🚨 보안 위반: 클라이언트에서 서버 전용 환경 변수 접근 시도 - ${key}`
    );
  }

  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ 환경 변수 누락: ${key}`);
  }

  return value;
}

/**
 * 클라이언트 환경 변수 안전하게 가져오기
 * @param key - 환경 변수 이름 (NEXT_PUBLIC_으로 시작해야 함)
 * @returns 환경 변수 값
 */
export function getClientEnv(key: string): string {
  if (!key.startsWith('NEXT_PUBLIC_')) {
    throw new Error(
      `🚨 보안 위반: 클라이언트 환경 변수는 NEXT_PUBLIC_으로 시작해야 함 - ${key}`
    );
  }

  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ 환경 변수 누락: ${key}`);
  }

  return value;
}

/**
 * 개발 모드 여부 확인
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * 프로덕션 모드 여부 확인
 */
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * 테스트 모드 여부 확인
 */
export const isTest = process.env.NODE_ENV === 'test';
