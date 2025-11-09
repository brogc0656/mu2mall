# 무이상품권 - 클라이프스 API 연동

**프로젝트**: muyi-giftcard (Next.js 14)  
**API**: 클라이프스 상품권 발송 API  
**규격서**: 상품권 발송 연동 규격서 Ver1.0 - 브라더  
**상태**: ✅ 규격서 준수 완료

---

## 📋 목차

1. [개요](#개요)
2. [환경 설정](#환경-설정)
3. [API 사용법](#api-사용법)
4. [규격서 준수 사항](#규격서-준수-사항)
5. [보안](#보안)
6. [문제 해결](#문제-해결)

---

## 개요

무이상품권 쇼핑몰에서 클라이프스 상품권 발송 API를 연동하여 실시간 상품권 발행 기능을 제공합니다.

### 주요 기능

- ✅ 상품권 실시간 발행 (ADD → SEND)
- ✅ AES-256-CBC 암호화/복호화
- ✅ 발행 내역 조회 (QRY)
- ✅ 발행 취소 (DEL)
- ✅ SMS 자동 발송
- ✅ TypeScript 완벽 지원

### 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **암호화**: crypto-js
- **API**: 클라이프스 상품권 발송 API

---

## 환경 설정

### 1. 환경 변수 설정

`.env.local` 파일 생성 (로컬 개발용):

```env
# 클라이프스 API (서버 전용 - 클라이언트 노출 금지!)
CHLIFES_GENID=AG20181105144054
CHLIFES_GIFTNM=TE20241216184900
CHLIFES_ENC_KEY=39Vh8PgDwE2k9AfEvs2PW3kaxheEy064
CHLIFES_IV=1234123412341234

# 클라이프스 API URL (클라이언트 노출 가능)
NEXT_PUBLIC_CHLIFES_URL=https://devapi.chlifes.co.kr

# Wizzpay (서버 전용)
WIZZPAY_MID=isptest03m
WIZZPAY_IV_KEY=7e74bfa70c4a79d827b500ab9a287d63
WIZZPAY_SALT=f8eb4a8a6873ba15e86668f1a17c0642
WIZZPAY_PASSWORD=1733

# Wizzpay URL (클라이언트 노출 가능)
NEXT_PUBLIC_WIZZPAY_URL=https://pgadmin.wizzpay.co.kr

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 2. 프로덕션 환경

프로덕션 환경에서는 다음 값으로 변경:

```env
NEXT_PUBLIC_CHLIFES_URL=https://api.chlifes.co.kr
CHLIFES_GENID=AG20251006211422
CHLIFES_GIFTNM=PR20251006212653
CHLIFES_ENC_KEY=brcardealpasswords2PW3kaxheYY064
```

### 3. 패키지 설치

```bash
npm install
```

---

## API 사용법

### 1. 상품권 발급 (간편)

ADD → SEND를 한 번에 처리:

```typescript
import { issueGiftCard } from '@/lib/chlifes';

const result = await issueGiftCard({
  phone: '01012345678',      // 수신자 전화번호 (숫자만)
  amount: 10000,             // 금액 (원)
  message: '생일 축하합니다!', // 메시지 (선택)
  validDay: '30',            // 유효기간 일수 (선택, 기본 30일)
});

if (result.success) {
  console.log('발행 성공!');
  console.log('바코드:', result.barcode);
  console.log('발행번호:', result.issueReqSn);
} else {
  console.error('발행 실패:', result.error);
}
```

### 2. 단계별 발행

세밀한 제어가 필요한 경우:

```typescript
import { addGiftCard, sendGiftCard } from '@/lib/chlifes';

// 1단계: 예비발행
const addResult = await addGiftCard({
  phone: '01012345678',
  amount: 10000,
  message: '생일 축하!',
});

if (!addResult.success) {
  throw new Error(addResult.error);
}

// 2단계: 실제 발송
const sendResult = await sendGiftCard(
  addResult.issueReqSn!,
  addResult.issueAprvSn!,
  'Y' // Y: 클라이프스 발송, N: 자체 발송
);

if (sendResult.success) {
  console.log('바코드:', sendResult.barcode);
}
```

### 3. 발행 내역 조회

```typescript
import { queryGiftCard } from '@/lib/chlifes';

const result = await queryGiftCard(issueReqSn, issueAprvSn);

if (result.success && result.data) {
  console.log('상태:', result.data.ISSUE_STATUS);
  console.log('잔액:', result.data.CURR_PRICE);
}
```

### 4. 발행 취소

```typescript
import { cancelGiftCard } from '@/lib/chlifes';

const result = await cancelGiftCard(issueReqSn, issueAprvSn);

if (result.success) {
  console.log('취소 완료');
}
```

### 5. API Route 사용

서버 사이드에서 처리:

```typescript
// app/api/giftcard/route.ts
const response = await fetch('/api/giftcard', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: 'ORD1234567890',
    phone: '01012345678',
    amount: 10000,
    message: '축하합니다!',
  }),
});

const data = await response.json();
```

---

## 규격서 준수 사항

### ✅ 완전 준수

본 프로젝트는 **상품권 발송 연동 규격서 Ver1.0 - 브라더**를 완전히 준수합니다.

#### 1. API 엔드포인트

| API | 규격서 | 구현 | 상태 |
|-----|--------|------|------|
| ADD | `/bro/gift_add.php` | ✅ | 준수 |
| SEND | `/bro/gift_send.php` | ✅ | 준수 |
| QRY | `/bro/gift_check.php` | ✅ | 준수 |
| DEL | `/bro/gift_check.php` | ✅ | 준수 |

#### 2. 요청 형식

- ✅ 필드명: 대문자 (GENID, CMD, GIFTNM 등)
- ✅ 필수 필드: 모두 포함
- ✅ 암호화: FACE_PRICE, RECV_HPNO 암호화 적용
- ✅ MESSAGE: 평문 전송

#### 3. 암호화 규격

- ✅ 알고리즘: AES-256-CBC
- ✅ IV: `1234123412341234` (고정값)
- ✅ 인코딩: Base64
- ✅ 암호화 대상: FACE_PRICE, RECV_HPNO

#### 4. 응답 처리

- ✅ 응답 코드: `RET_CODE` (6자리, "000000" = 성공)
- ✅ ISSUE_APRV_SN: ADD 응답에서 저장 후 SEND API에 사용

---

## 보안

### ✅ 보안 조치

1. **서버 전용 키 관리**
   - 민감한 키는 `NEXT_PUBLIC_` 접두사 없이 관리
   - 클라이언트에 노출되지 않음

2. **환경 변수 검증**
   - `lib/env.ts`에서 필수 환경 변수 검증
   - 민감 정보의 클라이언트 노출 방지

3. **로깅 보안**
   - `lib/logger.ts`에서 민감 정보 자동 마스킹
   - PIN, 암호화 키 등은 로그에 기록되지 않음

4. **.gitignore**
   - `.env*.local` 파일 무시
   - 인증 정보 파일 커밋 방지

### ⚠️ 주의사항

- **절대 Git에 커밋하지 말 것**: `.env.local`, `PRODUCTION_CREDENTIALS.md`
- **프로덕션 키 관리**: Vercel 환경 변수 또는 안전한 키 관리 시스템 사용
- **정기적인 키 로테이션**: 보안을 위해 주기적으로 키 변경

---

## 문제 해결

### 1. 환경 변수 오류

**증상**: `Chlifes API 설정이 올바르지 않습니다`

**해결**:
```bash
# .env.local 파일 확인
cat .env.local | grep CHLIFES

# 필수 환경 변수 확인
- CHLIFES_GENID
- CHLIFES_GIFTNM
- CHLIFES_ENC_KEY
- CHLIFES_IV
- NEXT_PUBLIC_CHLIFES_URL
```

### 2. API 호출 실패

**증상**: `RET_CODE`가 "000000"이 아님

**해결**:
- 응답의 `RET_CODE`와 `RET_MESG` 확인
- 규격서의 에러 코드 참조
- `ISSUE_REQ_SN` 중복 여부 확인 (010120 오류)

### 3. 암호화 오류

**증상**: 암호화 실패

**해결**:
- IV 값 확인: `1234123412341234`
- 암호화 키 길이 확인: 32자
- Base64 인코딩 확인

### 4. SEND API 실패

**증상**: `020012` 오류 (존재하지 않은 발행 정보)

**해결**:
- ADD API 응답에서 `ISSUE_APRV_SN` 저장 확인
- SEND API 요청에 `ISSUE_APRV_SN` 포함 확인

---

## 개발 서버 실행

```bash
# 개발 서버 시작
npm run dev

# 브라우저에서 접속
open http://localhost:3000
```

---

## 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm start
```

---

## 참고 문서

- [상품권 발송 연동 규격서 Ver1.0 - 브라더](../상품권발송연동규격서_브라더_분석.md)
- [API_INTEGRATION_GUIDE.md](../API_INTEGRATION_GUIDE.md)
- [연동_규격서_준수_분석_리포트.md](./연동_규격서_준수_분석_리포트.md)

---

## 지원

### 문의

- 개발 문제: Brother 개발팀
- API 문의: 클라이프스 API 지원팀

---

**마지막 업데이트**: 2025-01-XX  
**버전**: 2.0 (규격서 준수 완료)
