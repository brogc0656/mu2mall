# 무이상품권 - 모바일 상품권 판매 플랫폼

Next.js 14와 TypeScript로 구축된 모던 상품권 판매 사이트입니다.

## 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **API**: Next.js API Routes
- **연동**: 클라이프스 상품권 발행 API
- **암호화**: crypto-js (AES-256-CBC)

## 프로젝트 구조

```
muyi-giftcard/
├── app/
│   ├── page.tsx              # 메인 페이지 (상품권 목록)
│   ├── products/             # 상품권 상세 페이지 (구현 예정)
│   ├── checkout/             # 결제 페이지 (구현 예정)
│   ├── admin/                # 관리자 페이지 (구현 예정)
│   └── api/
│       └── chlifes/          # 클라이프스 API Routes (구현 예정)
├── lib/
│   └── chlifes.ts            # 클라이프스 API 유틸리티
├── types/
│   └── index.ts              # TypeScript 타입 정의
└── components/               # 재사용 가능한 컴포넌트 (구현 예정)
```

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local.example`을 `.env.local`로 복사하고 필요한 값 설정:

```bash
cp .env.local.example .env.local
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 주요 기능

### ✅ 구현 완료
- 메인 페이지 (상품권 목록)
- 클라이프스 API 연동 유틸리티
- TypeScript 타입 정의
- 반응형 디자인 (Tailwind CSS)

### 🔜 구현 예정
- 상품권 상세/구매 페이지
- **PG 결제 연동** (준비 단계)
- 주문 관리 시스템
- 관리자 대시보드
- 사용자 인증/로그인

## 클라이프스 API 연동

### 사용 가능한 함수

```typescript
import { issueGiftCard, sendBarcode, queryGiftCard, cancelGiftCard } from '@/lib/chlifes';

// 상품권 발행
const result = await issueGiftCard({
  amount: 10000,
  phone: '01012345678',
  message: '선물입니다',
  validDays: 30
});

// 바코드 수령
const barcode = await sendBarcode(issueReqSn, issueAprvSn);
```

### API 프로세스

1. **ADD** - 상품권 발행 요청 → `ISSUE_APRV_SN` 수령
2. **SEND** - 바코드 발급 → 실제 사용 가능한 상품권 수령
3. **QRY** - 상품권 상태 조회
4. **DEL** - 상품권 취소

## 배포

### Vercel 배포 (권장)

```bash
npm run build
```

Vercel CLI로 배포하거나 GitHub 연결 후 자동 배포

### 환경 변수 설정
Vercel 대시보드에서 `.env.local`의 변수들을 동일하게 설정

## 개발 가이드

### 페이지 추가하기

Next.js App Router를 사용하여 `app/` 폴더에 새 경로 추가:

```bash
# 상품권 구매 페이지 예시
app/products/[id]/page.tsx
```

### API Route 추가하기

`app/api/` 폴더에 새 엔드포인트 추가:

```typescript
// app/api/chlifes/issue/route.ts
export async function POST(request: Request) {
  // 클라이프스 API 호출
}
```

## 라이선스

MIT License
