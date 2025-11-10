# 프로덕션 IP 화이트리스트 구성 방안

**일시**: 2025-11-09  
**문제**: Vercel은 동적 IP를 사용하므로 클라이프스 프로덕션 API IP 화이트리스트 등록이 어려움  
**해결 방안**: 여러 옵션 제시

---

## 🔍 현재 상황

### 클라이프스 프로덕션 API 요구사항
- **IP 화이트리스트 필수**: 특정 IP 주소만 허용
- **등록된 IP**: `220.85.91.151` (로컬 개발 환경)
- **서버**: `api.chlifes.co.kr` (117.52.74.41)

### Vercel의 제약사항
- ❌ **고정 IP 제공 안 함**: 동적 IP 사용
- ❌ **IP 범위 예측 불가**: 매 요청마다 다른 IP 사용 가능
- ✅ **Edge Functions**: 전 세계 여러 지역에서 실행

---

## 💡 해결 방안

### 방안 1: Vercel IP 범위 화이트리스트 등록 (권장)

**방법**:
1. Vercel의 아웃바운드 IP 범위 확인
2. 클라이프스에 IP 범위 전체를 화이트리스트에 추가 요청

**장점**:
- ✅ 코드 변경 불필요
- ✅ 가장 간단한 방법

**단점**:
- ⚠️ IP 범위가 넓을 수 있음
- ⚠️ 클라이프스 측 협의 필요

**구현**:
```bash
# Vercel의 IP 범위 확인 (공식 문서 참조)
# 또는 Vercel 지원팀에 문의
```

---

### 방안 2: 프록시 서버 사용 (가장 확실)

**아키텍처**:
```
Vercel (동적 IP)
    ↓
프록시 서버 (고정 IP) ← 화이트리스트 등록
    ↓
클라이프스 API (프로덕션)
```

**구현 옵션**:

#### 옵션 A: 별도 서버 구축
- AWS EC2, Google Cloud, Azure 등
- 고정 IP 할당
- Node.js 프록시 서버 구축

#### 옵션 B: 서버리스 프록시 (Vercel Edge Functions)
- Vercel Edge Functions 사용
- 하지만 여전히 동적 IP 문제 존재

**장점**:
- ✅ 완전한 제어 가능
- ✅ 고정 IP 보장

**단점**:
- ⚠️ 추가 인프라 비용
- ⚠️ 유지보수 필요

---

### 방안 3: 환경 변수로 개발/프로덕션 분리

**현재 구조**:
```typescript
// lib/chlifes.ts
const CHLIFES_CONFIG = {
  API_URL: process.env.NEXT_PUBLIC_CHLIFES_URL!,  // 개발/프로덕션 선택
  // ...
};
```

**개선 방안**:
- 프로덕션에서는 개발 API 사용 (임시)
- 또는 프로덕션 API는 서버 사이드에서만 호출
- 클라이언트는 항상 개발 API 사용

**장점**:
- ✅ 즉시 사용 가능
- ✅ 코드 변경 최소화

**단점**:
- ⚠️ 프로덕션에서 개발 API 사용 (비권장)
- ⚠️ 실제 프로덕션 테스트 불가

---

### 방안 4: 클라이프스에 Vercel IP 범위 등록 요청

**요청 내용**:
```
안녕하세요,

Vercel 플랫폼에서 클라이프스 프로덕션 API를 호출하려고 하는데,
Vercel은 동적 IP를 사용하여 고정 IP를 제공하지 않습니다.

다음 중 하나의 방법으로 해결 가능한지 문의드립니다:

1. Vercel의 IP 범위 전체를 화이트리스트에 추가
   (Vercel IP 범위: [확인 필요])

2. User-Agent 또는 API Key 기반 인증으로 변경
   (IP 대신 다른 방식의 인증)

3. 특정 도메인 기반 허용
   (muyi-giftcard.vercel.app에서의 요청만 허용)

어떤 방법이 가능한지 알려주시면 그에 맞춰 구성하겠습니다.

감사합니다.
```

---

## 🎯 권장 방안

### 단기: 방안 3 (임시)
- 프로덕션 배포는 개발 API 사용
- 실제 프로덕션 테스트는 로컬에서 진행

### 중기: 방안 4 (협의)
- 클라이프스에 Vercel IP 범위 등록 요청
- 또는 다른 인증 방식 협의

### 장기: 방안 2 (프록시 서버)
- 별도 프록시 서버 구축
- 고정 IP로 완전한 제어

---

## 📋 구현 예시

### 방안 2 구현 (프록시 서버)

#### 1. 프록시 API Route 생성

```typescript
// app/api/chlifes-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 클라이프스 API로 프록시 요청
    const response = await fetch('https://api.chlifes.co.kr/bro/gift_add.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**문제**: 여전히 Vercel의 동적 IP 사용

#### 2. 별도 프록시 서버 (Node.js)

```javascript
// proxy-server.js (별도 서버)
const express = require('express');
const app = express();

app.use(express.json());

app.post('/proxy/chlifes/*', async (req, res) => {
  const path = req.path.replace('/proxy/chlifes', '');
  const url = `https://api.chlifes.co.kr${path}`;
  
  try {
    const response = await fetch(url, {
      method: req.method,
      headers: req.headers,
      body: JSON.stringify(req.body),
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Proxy server running on port 3001');
});
```

**배포**: AWS EC2, Google Cloud 등 고정 IP 서버에 배포

---

## 🔧 현재 코드 수정 (방안 3 적용)

### 환경 변수 기반 분기

```typescript
// lib/chlifes.ts
const CHLIFES_CONFIG = {
  // 프로덕션에서는 개발 API 사용 (임시)
  API_URL: process.env.NODE_ENV === 'production' 
    ? process.env.CHLIFES_PROD_URL || process.env.NEXT_PUBLIC_CHLIFES_URL
    : process.env.NEXT_PUBLIC_CHLIFES_URL,
  // ...
};
```

---

## 📞 클라이프스 협의 필요 사항

### 질문 1: IP 범위 등록 가능 여부
- Vercel의 IP 범위 전체를 화이트리스트에 추가 가능한가?

### 질문 2: 대체 인증 방식
- IP 대신 API Key 또는 다른 인증 방식 사용 가능한가?

### 질문 3: 도메인 기반 허용
- 특정 도메인(`*.vercel.app`)에서의 요청만 허용 가능한가?

---

## ✅ 다음 단계

1. **즉시**: 방안 3 적용 (개발 API 사용)
2. **협의**: 클라이프스에 방안 4 문의
3. **장기**: 방안 2 구현 (프록시 서버 구축)

---

**마지막 업데이트**: 2025-11-09

