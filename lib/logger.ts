/**
 * 보안 로깅 유틸리티
 * 민감한 정보를 로그에 포함하지 않도록 필터링
 */

import { isDevelopment, isProduction } from './env';

/**
 * 민감한 키워드 목록 (대소문자 구분 없음)
 */
const SENSITIVE_KEYS = [
  'password',
  'secret',
  'token',
  'key',
  'auth',
  'credential',
  'api_key',
  'apikey',
  'private',
  'salt',
  'iv',
  'enc',
];

/**
 * 객체에서 민감한 정보 마스킹
 * @param obj - 마스킹할 객체
 * @returns 마스킹된 객체
 */
function maskSensitiveData(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(maskSensitiveData);
  }

  const masked: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive));

    if (isSensitive && typeof value === 'string') {
      // 민감한 정보는 앞 4자만 표시
      masked[key] = value.length > 4 ? `${value.substring(0, 4)}***` : '***';
    } else if (typeof value === 'object') {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

/**
 * 로그 레벨
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * 보안 로거 클래스
 */
class SecureLogger {
  /**
   * 로그 출력 (민감한 정보 자동 마스킹)
   */
  private log(level: LogLevel, message: string, data?: any): void {
    // 프로덕션에서는 ERROR와 WARN만 출력
    if (isProduction && (level === LogLevel.DEBUG || level === LogLevel.INFO)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;

    if (data) {
      const maskedData = maskSensitiveData(data);
      console.log(prefix, message, maskedData);
    } else {
      console.log(prefix, message);
    }
  }

  /**
   * 디버그 로그 (개발 환경에서만)
   */
  debug(message: string, data?: any): void {
    if (isDevelopment) {
      this.log(LogLevel.DEBUG, message, data);
    }
  }

  /**
   * 정보 로그
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * 경고 로그
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * 에러 로그
   */
  error(message: string, error?: Error | any): void {
    if (error instanceof Error) {
      this.log(LogLevel.ERROR, message, {
        message: error.message,
        stack: isDevelopment ? error.stack : undefined,
      });
    } else {
      this.log(LogLevel.ERROR, message, error);
    }
  }

  /**
   * API 요청 로그 (민감한 정보 자동 필터링)
   */
  apiRequest(method: string, url: string, data?: any): void {
    this.debug(`API Request: ${method} ${url}`, data);
  }

  /**
   * API 응답 로그 (민감한 정보 자동 필터링)
   */
  apiResponse(method: string, url: string, status: number, data?: any): void {
    this.debug(`API Response: ${method} ${url} - ${status}`, data);
  }

  /**
   * 보안 이벤트 로그 (항상 기록)
   */
  security(event: string, details?: any): void {
    console.warn(
      `[SECURITY] [${new Date().toISOString()}]`,
      event,
      details ? maskSensitiveData(details) : ''
    );
  }
}

/**
 * 싱글톤 로거 인스턴스
 */
export const logger = new SecureLogger();

/**
 * 보안 검증 실패 로그
 */
export function logSecurityViolation(violation: string, details?: any): void {
  logger.security(`🚨 Security Violation: ${violation}`, details);

  // 프로덕션에서는 모니터링 시스템에 전송할 수 있음
  // 예: Sentry, DataDog 등
  if (isProduction) {
    // TODO: 외부 모니터링 시스템 연동
  }
}

/**
 * 환경 변수 접근 로그
 */
export function logEnvAccess(key: string, isServer: boolean): void {
  logger.debug(`Environment variable accessed: ${key}`, {
    isServer,
    timestamp: new Date().toISOString(),
  });
}
