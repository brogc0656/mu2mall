# Vercel 환경 변수 설정 가이드

## 🎯 개발 연동 테스트 환경 설정

⚠️ **중요**: 이것은 **개발 연동 테스트** 환경입니다. 실제 결제는 발생하지 않습니다.

---

## 📋 설정할 환경 변수 목록

아래 7개 환경 변수를 Vercel 대시보드에 설정하세요:

### 1. NEXT_PUBLIC_WIZZPAY_URL
```
값: https://pgadmin.wizzpay.co.kr
환경: Production, Preview, Development 모두 체크
```

### 2. WIZZPAY_MID
```
값: isptest03m
환경: Production, Preview, Development 모두 체크
설명: 위즈페이 테스트 가맹점 ID
```

### 3. WIZZPAY_IV_KEY
```
값: 7e74bfa70c4a79d827b500ab9a287d63
환경: Production, Preview, Development 모두 체크
설명: 암호화 IV 키 (Hex)
```

### 4. WIZZPAY_SALT
```
값: f8eb4a8a6873ba15e86668f1a17c0642
환경: Production, Preview, Development 모두 체크
설명: 암호화 Salt (Hex)
```

### 5. WIZZPAY_PASSWORD
```
값: 1733
환경: Production, Preview, Development 모두 체크
설명: 암호화 Password
```

### 6. NEXT_PUBLIC_APP_URL
```
값: https://muyi-giftcard.vercel.app
환경: Production, Preview, Development 모두 체크
```

### 7. NEXT_PUBLIC_BASE_URL
```
값: https://muyi-giftcard.vercel.app
환경: Production, Preview, Development 모두 체크
```

---

## 🖱️ Vercel 대시보드에서 설정하는 방법

### 1단계: Vercel 대시보드 접속

1. 브라우저에서 https://vercel.com 접속
2. 로그인 (brogc0656 계정)
3. `muyi-giftcard` 프로젝트 클릭

### 2단계: Environment Variables 페이지 이동

1. 상단 메뉴에서 **Settings** 클릭
2. 왼쪽 사이드바에서 **Environment Variables** 클릭

### 3단계: 환경 변수 추가

각 변수마다 다음 단계를 반복:

1. **Variable Name** 입력 (예: `NEXT_PUBLIC_WIZZPAY_URL`)
2. **Value** 입력 (위 목록의 값 복사해서 붙여넣기)
3. **Environments** 선택:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. **Add** 버튼 클릭

**총 7번 반복**하여 모든 변수 추가

### 4단계: 확인

모든 변수가 추가되면 다음과 같이 표시됩니다:

```
NEXT_PUBLIC_WIZZPAY_URL     Production, Preview, Development
WIZZPAY_MID                 Production, Preview, Development
WIZZPAY_IV_KEY              Production, Preview, Development
WIZZPAY_SALT                Production, Preview, Development
WIZZPAY_PASSWORD            Production, Preview, Development
NEXT_PUBLIC_APP_URL         Production, Preview, Development
NEXT_PUBLIC_BASE_URL        Production, Preview, Development
```

---

## 🚀 설정 완료 후 배포

환경 변수 설정이 완료되면 **재배포**가 필요합니다.

### 방법 1: GitHub Push로 자동 배포 (권장)

```bash
# 로컬에서 push
git push

# Vercel이 자동으로 배포 시작 (3-5분 소요)
```

### 방법 2: Vercel에서 수동 재배포

1. Vercel 대시보드 → `muyi-giftcard` 프로젝트
2. **Deployments** 탭 클릭
3. 최신 배포 찾기
4. 오른쪽 ⋯ 메뉴 → **Redeploy** 클릭
5. **Redeploy** 확인

---

## ✅ 설정 확인

### 1. 배포 완료 대기

Vercel 대시보드 → Deployments에서 배포 상태 확인:
- 🟡 Building...
- 🟢 Ready (완료!)

### 2. 환경 변수 로드 확인

터미널에서 확인:
```bash
# Vercel 환경 변수 목록 확인
vercel env ls

# 로컬로 pull (확인용)
vercel env pull .env.vercel
cat .env.vercel
```

### 3. 프로덕션 사이트 테스트

```bash
# 브라우저에서 열기
open https://muyi-giftcard.vercel.app

# 또는 직접 접속
https://muyi-giftcard.vercel.app
```

**테스트 시나리오**:
1. 신세계상품권 선택
2. 50,000원 클릭
3. "지금 구매하기" 클릭
4. 정보 입력
5. **"결제하기" 버튼 클릭**
6. ✅ **위즈페이 테스트 결제 화면 표시!** (흰 페이지 ❌ 해결!)

---

## 🔧 문제 해결

### Q1: 환경 변수가 적용되지 않습니다

**해결책**:
1. Vercel 대시보드에서 환경 변수 다시 확인
2. 재배포 트리거:
   ```bash
   # GitHub에 더미 커밋
   git commit --allow-empty -m "Trigger redeploy"
   git push
   ```

### Q2: 여전히 흰 페이지가 표시됩니다

**해결책**:
1. 브라우저 캐시 삭제 (Cmd+Shift+R 또는 Ctrl+Shift+R)
2. 개발자 도구 (F12) → Console 탭에서 에러 확인
3. Network 탭에서 `/api/payment/init` 응답 확인

### Q3: 환경 변수 값이 노출되나요?

**답변**:
- `NEXT_PUBLIC_*` 변수만 클라이언트에 노출됩니다
- `WIZZPAY_*` 변수는 서버에서만 사용되어 안전합니다
- 개발 테스트 계정이므로 노출되어도 실제 결제는 발생하지 않습니다

---

## 📸 스크린샷 참고

### Vercel Environment Variables 화면 예시:

```
┌─────────────────────────────────────────────────────────┐
│ Environment Variables                                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Variable Name: [NEXT_PUBLIC_WIZZPAY_URL          ]     │
│                                                          │
│ Value:         [https://pgadmin.wizzpay.co.kr    ]     │
│                                                          │
│ Environments:  ☑ Production                             │
│                ☑ Preview                                │
│                ☑ Development                            │
│                                                          │
│               [Add]                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 체크리스트

설정 전:
- [ ] Vercel 대시보드 로그인 확인
- [ ] `muyi-giftcard` 프로젝트 선택
- [ ] Settings → Environment Variables 페이지 확인

설정 중:
- [ ] NEXT_PUBLIC_WIZZPAY_URL 추가
- [ ] WIZZPAY_MID 추가
- [ ] WIZZPAY_IV_KEY 추가
- [ ] WIZZPAY_SALT 추가
- [ ] WIZZPAY_PASSWORD 추가
- [ ] NEXT_PUBLIC_APP_URL 추가
- [ ] NEXT_PUBLIC_BASE_URL 추가

설정 후:
- [ ] 총 7개 환경 변수 확인
- [ ] Git push 또는 수동 재배포
- [ ] 배포 완료 확인 (3-5분 대기)
- [ ] 프로덕션 사이트 테스트
- [ ] **위즈페이 결제 화면 정상 표시** ⭐

---

**작성일**: 2025년 11월 10일
**환경**: 개발 연동 테스트 (위즈페이 테스트 계정)
**상태**: 설정 대기 중
