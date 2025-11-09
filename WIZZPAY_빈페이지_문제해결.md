# Wizzpay 빈 페이지 문제 해결 리포트

**일시**: 2025-11-09  
**문제**: Wizzpay 결제 팝업이 빈 페이지로 표시됨  
**원인**: 환경 변수에 개행 문자(`\n`) 포함  
**해결**: ✅ **완료**

---

## 🔍 문제 발견

### 증상
- Wizzpay 결제 팝업이 열리지만 내부가 완전히 비어 있음
- URL은 정상적으로 보이지만 (`pgadmin.wizzpay.co.kr/pay/api/auth/common/Ready.jsp`)
- 페이지 콘텐츠가 로드되지 않음

### 원인 분석

**API 응답 확인**:
```json
{
  "wizzUrl": "https://pgadmin.wizzpay.co.kr\n",  // ❌ 개행 문자 포함
  "mid": "isptest03m\n",                          // ❌ 개행 문자 포함
  "data": "..."
}
```

**문제점**:
1. `wizzUrl`에 개행 문자(`\n`)가 포함되어 있음
2. `mid`에도 개행 문자(`\n`)가 포함되어 있음
3. 이로 인해 form action URL이 잘못 생성됨:
   ```
   https://pgadmin.wizzpay.co.kr\n/pay/api/auth/common/Ready.jsp
   ```
4. 잘못된 URL로 인해 Wizzpay 서버가 빈 응답을 반환

---

## ✅ 해결 방법

### 1. 서버 측 수정 (`app/api/payment/init/route.ts`)

환경 변수에서 개행 문자 제거:

```typescript
return NextResponse.json({
  success: true,
  transactionId: orderId,
  wizzUrl: WIZZ_CONFIG.WIZZ_URL.trim(),  // ✅ trim() 추가
  mid: WIZZ_CONFIG.MID.trim(),            // ✅ trim() 추가
  data: encryptedData,
});
```

### 2. 클라이언트 측 수정 (`app/page.tsx`)

안전장치로 클라이언트에서도 trim() 적용:

```typescript
const wizzUrl = (initData.wizzUrl || '').trim();
const mid = (initData.mid || '').trim();
const encryptedData = initData.data;
```

---

## 🔧 수정된 파일

1. **`app/api/payment/init/route.ts`**
   - `wizzUrl`과 `mid`에 `.trim()` 추가

2. **`app/page.tsx`**
   - 클라이언트 측에서도 `.trim()` 적용 (안전장치)

---

## 📋 환경 변수 확인 필요

Vercel 환경 변수에 개행 문자가 포함되어 있을 수 있습니다:

```bash
# 확인 방법
vercel env ls

# 수정 방법 (필요시)
vercel env rm WIZZPAY_MID production
vercel env add WIZZPAY_MID production
# 값 입력 시 개행 문자 없이 입력
```

---

## ✅ 예상 결과

수정 후:
- ✅ `wizzUrl`: `"https://pgadmin.wizzpay.co.kr"` (개행 없음)
- ✅ `mid`: `"isptest03m"` (개행 없음)
- ✅ Form action URL: `https://pgadmin.wizzpay.co.kr/pay/api/auth/common/Ready.jsp`
- ✅ Wizzpay 결제 페이지 정상 로드

---

## 🚀 배포 필요

수정 사항을 배포해야 합니다:

```bash
cd muyi-giftcard
git add .
git commit -m "fix: Wizzpay 빈 페이지 문제 해결 (개행 문자 제거)"
git push
# Vercel 자동 배포
```

---

**마지막 업데이트**: 2025-11-09

