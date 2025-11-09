/**
 * 클라이언트 측 결제 유틸리티
 * - API 키는 서버에서만 관리
 * - 브라우저에서는 API 호출만 수행
 */

/**
 * 결제 초기화 및 암호화된 데이터 받기
 */
export async function initPayment(data: {
  goodsname: string;
  amt: number;
  buyername: string;
  resultUrl?: string;
  notiUrl?: string;
  bypassValue?: string;
}) {
  const response = await fetch('/api/payment/init', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '결제 초기화 실패');
  }

  return await response.json();
}

/**
 * 상품권 발행 요청
 */
export async function issueGiftCard(data: {
  transactionId: string;
  facePrice: number;
  recvHpno: string;
  message?: string;
}) {
  const response = await fetch('/api/giftcard/issue', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '상품권 발행 실패');
  }

  return await response.json();
}

/**
 * 상품권 발행 확정 및 바코드 수령
 */
export async function confirmGiftCard(data: {
  transactionId: string;
  issueAprvSn: string;
}) {
  const response = await fetch('/api/giftcard/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '상품권 발행 확정 실패');
  }

  return await response.json();
}

/**
 * 거래 기록 조회
 */
export async function getTransaction(transactionId: string) {
  const response = await fetch(`/api/transactions/${transactionId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '거래 기록 조회 실패');
  }

  return await response.json();
}






