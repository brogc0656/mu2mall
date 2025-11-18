import { Suspense } from 'react';
import { formatAmount } from '@/lib/utils';
import { SeedpaymentsClient, loadSeedpaymentsConfig } from '@/lib/seedpayments';
import { generateOrderId } from '@/lib/utils';
import PaymentFormClient from './PaymentFormClient';

// 상품권 목록 (메인 페이지와 동일)
const giftcards = [
  { code: 'SSG', name: 'SSG 모바일상품권' },
  { code: 'GS25', name: 'GS25 모바일상품권' },
  { code: 'CU', name: 'CU 모바일상품권' },
  { code: 'STARBUCKS', name: '스타벅스 모바일상품권' },
];

async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string;
    amount?: string;
    price?: string;
    quantity?: string;
    total?: string;
  }>;
}) {
  const params = await searchParams;
  const goodsCode = params.code;
  const amount = params.amount || params.price; // 액면가 (backwards compatibility)
  const price = params.price; // 단가
  const quantity = params.quantity ? parseInt(params.quantity) : 1;
  const total = params.total ? parseInt(params.total) : (price ? parseInt(price) : 0);

  const giftcard = giftcards.find((card) => card.code === goodsCode);

  if (!giftcard || !total) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">잘못된 접근입니다</h2>
          <p className="text-gray-600 mb-6">상품권을 먼저 선택해주세요</p>
          <a
            href="/"
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  // 서버 사이드에서 결제 데이터 생성 (PHP/JSP 방식)
  const config = loadSeedpaymentsConfig();
  const client = new SeedpaymentsClient(config);
  const orderId = generateOrderId();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // 상품명 구성: 수량이 1개 초과이면 수량 표시
  const goodsName = quantity > 1
    ? `${giftcard.name} ${formatAmount(Number(amount))} x ${quantity}개`
    : `${giftcard.name} ${formatAmount(Number(amount))}`;

  const paymentData = client.createPaymentData({
    method: 'ALL',
    goodsNm: goodsName,
    goodsAmt: total,
    ordNo: orderId,
    ordNm: '',  // 클라이언트에서 입력받음
    ordEmail: '',  // 클라이언트에서 입력받음
    ordTel: '',  // 클라이언트에서 입력받음
    ordIp: '',
    mbsUsrId: '',
    mbsReserved: JSON.stringify({
      orderId,
      goodsCode,
      amount: Number(amount),
      quantity,
      unitPrice: Number(price),
      totalPrice: total,
    }),
    returnUrl: `${baseUrl}/api/payment/result`,
  });

  return (
    <PaymentFormClient
      giftcard={giftcard}
      amount={amount || '0'}
      price={price || '0'}
      quantity={quantity}
      total={total.toString()}
      paymentData={paymentData}
      pgUrl={config.pgUrl}
    />
  );
}

export default PaymentPage;
