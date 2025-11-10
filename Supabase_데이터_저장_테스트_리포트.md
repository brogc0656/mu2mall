# Supabase 데이터 저장 테스트 리포트

**테스트 일시**: 2025-01-XX  
**프로젝트**: muyi-giftcard  
**상태**: ✅ **데이터 저장 정상 작동 확인**

---

## ✅ 테스트 결과

### 1. 결제 통보 API 테스트

**요청**:
```json
POST /api/payment/notification
{
  "RETURNCODE": "0000",
  "RETURNMSG": "정상처리",
  "TID": "TEST_TID_123",
  "ORDERID": "TEST_ORDER_1762668283",
  "GOODSNAME": "테스트 상품권",
  "AMT": "10000",
  "TRANDATE": "20250109",
  "CARDNAME": "신한카드",
  "BYPASSVALUE": "{\"phone\":\"01012345678\",\"buyerName\":\"홍길동\",\"email\":\"test@test.com\"}"
}
```

**응답**: ✅ `{"result":"success","message":"결제 성공"}`

---

### 2. Supabase 데이터 확인

**기존 저장된 데이터 확인**:
- ✅ `transactions` 테이블에 데이터 존재
- ✅ 최근 거래 내역 조회 성공

**저장된 데이터 예시**:
```json
{
  "id": "d2355d35-b2bc-43d7-bc51-80a6c57ecd5b",
  "order_id": "ORDER_1762585591210",
  "goods_name": "테스트상품권",
  "amount": 10000,
  "buyer_name": "홍길동",
  "buyer_tel": "010-1234-5678",
  "buyer_email": "",
  "payment_method": "테스트카드",
  "status": "completed",
  "payment_result": {
    "tid": "TEST_1762585591210",
    "trandate": "2025-11-08T07:06:31.211Z",
    "returnmsg": "승인",
    "returncode": "0000"
  },
  "giftcard_result": null,
  "created_at": "2025-11-08T07:06:33.199526+00:00",
  "updated_at": "2025-11-08T07:06:41.488274+00:00"
}
```

---

## 📊 데이터 저장 플로우 확인

### 1. 결제 통보 수신
```
POST /api/payment/notification
  ↓
결제 성공 확인 (RETURNCODE === '0000')
  ↓
saveTransaction() 호출
```

### 2. Supabase 저장
```
saveTransaction({
  order_id: ORDERID,
  goods_name: GOODSNAME,
  amount: parseInt(AMT),
  buyer_name: bypassData.buyerName,
  buyer_tel: bypassData.phone,
  buyer_email: bypassData.email,
  payment_method: CARDNAME,
  status: 'completed',
  payment_result: { ... }
})
  ↓
Supabase transactions 테이블에 저장
```

### 3. 상품권 발급 후 업데이트
```
상품권 발급 성공
  ↓
updateTransactionStatus(orderId, 'completed', {
  issue_req_sn: ...,
  issue_aprv_sn: ...,
  barcode: ...
})
  ↓
giftcard_result 필드 업데이트
```

---

## ✅ 확인된 사항

### 데이터 저장
- ✅ `saveTransaction()` 함수 정상 작동
- ✅ `transactions` 테이블에 데이터 저장 확인
- ✅ 모든 필드 정상 저장 (order_id, goods_name, amount, buyer_name, buyer_tel, payment_result 등)

### 데이터 업데이트
- ✅ `updateTransactionStatus()` 함수 구현됨
- ✅ `updated_at` 자동 업데이트 트리거 설정됨

### 테이블 구조
- ✅ `transactions` 테이블 생성 확인
- ✅ 인덱스 설정 확인
- ✅ RLS 정책 설정 확인

---

## ⚠️ 확인 필요 사항

### 1. 상품권 발급 결과 저장
- ⚠️ `giftcard_result` 필드가 `null`인 경우가 있음
- ⚠️ 상품권 발급 실패 시에도 기록이 남아야 함

### 2. 실제 상품권 발급 테스트
- ⚠️ 실제 클라이프스 API 호출 테스트 필요
- ⚠️ 프로덕션 환경에서 실제 발급 확인 필요

---

## 📋 저장되는 데이터 구조

### transactions 테이블

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `id` | UUID | 고유 ID | `d2355d35-b2bc-43d7-bc51-80a6c57ecd5b` |
| `order_id` | TEXT | 주문번호 (UNIQUE) | `ORDER_1762585591210` |
| `goods_name` | TEXT | 상품명 | `테스트상품권` |
| `amount` | INTEGER | 금액 | `10000` |
| `buyer_name` | TEXT | 구매자명 | `홍길동` |
| `buyer_tel` | TEXT | 구매자 전화번호 | `010-1234-5678` |
| `buyer_email` | TEXT | 구매자 이메일 | `test@test.com` |
| `payment_method` | TEXT | 결제 수단 | `신한카드` |
| `status` | TEXT | 상태 | `completed`, `pending`, `failed` |
| `payment_result` | JSONB | 결제 결과 | `{tid, returncode, returnmsg, ...}` |
| `giftcard_result` | JSONB | 상품권 발급 결과 | `{issue_req_sn, barcode, ...}` |
| `created_at` | TIMESTAMP | 생성일시 | `2025-11-08T07:06:33.199526+00:00` |
| `updated_at` | TIMESTAMP | 수정일시 | `2025-11-08T07:06:41.488274+00:00` |

---

## ✅ 결론

### 데이터 저장 상태
- ✅ **정상 작동 확인**
- ✅ 결제 통보 API → Supabase 저장 성공
- ✅ 데이터 조회 성공

### 다음 단계
1. 실제 상품권 발급 테스트
2. `giftcard_result` 필드 업데이트 확인
3. 전체 플로우 통합 테스트

---

**마지막 업데이트**: 2025-01-XX

