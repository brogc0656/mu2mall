'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatAmount, formatDate } from '@/lib/utils';

function ReturnContent() {
  const searchParams = useSearchParams();

  const returnCode = searchParams.get('RETURNCODE');
  const returnMsg = searchParams.get('RETURNMSG');
  const orderId = searchParams.get('ORDERID');
  const goodsName = searchParams.get('GOODSNAME');
  const amt = searchParams.get('AMT');
  const tranDate = searchParams.get('TRANDATE');
  const cardName = searchParams.get('CARDNAME');

  const isSuccess = returnCode === '0000';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        {/* 결제 성공 */}
        {isSuccess ? (
          <div className="bg-white rounded-2xl shadow-2xl p-12">
            {/* 성공 아이콘 */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-16 h-16 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                결제가 완료되었습니다!
              </h1>
              <p className="text-xl text-green-600 font-semibold mb-2">
                상품권이 휴대폰으로 발송되었습니다
              </p>
              <p className="text-gray-600">
                SMS를 확인해주세요
              </p>
            </div>

            {/* 결제 정보 */}
            <div className="border-t border-b py-6 my-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">주문번호</p>
                  <p className="font-bold text-gray-900">{orderId}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">결제일시</p>
                  <p className="font-bold text-gray-900">
                    {tranDate ? formatDate(tranDate) : '방금 전'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">상품명</p>
                  <p className="font-bold text-gray-900">{goodsName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">결제수단</p>
                  <p className="font-bold text-gray-900">{cardName || '신용카드'}</p>
                </div>

                <div className="col-span-2">
                  <p className="text-sm text-gray-600 mb-1">결제금액</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatAmount(Number(amt))}원
                  </p>
                </div>
              </div>
            </div>

            {/* 안내 사항 */}
            <div className="bg-blue-50 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-blue-900 mb-3">안내사항</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• 상품권 PIN 번호는 SMS로 발송되었습니다</li>
                <li>• 구매내역은 이메일로도 발송됩니다</li>
                <li>• 환불은 사용하지 않은 상품권에 한해 가능합니다</li>
                <li>• 문의사항은 고객센터로 연락주세요</li>
              </ul>
            </div>

            {/* 버튼 */}
            <div className="flex gap-4">
              <a
                href="/"
                className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-center rounded-xl transition-all"
              >
                홈으로
              </a>
            </div>
          </div>
        ) : (
          /* 결제 실패 */
          <div className="bg-white rounded-2xl shadow-2xl p-12">
            {/* 실패 아이콘 */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-16 h-16 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                결제가 실패했습니다
              </h1>
              <p className="text-xl text-red-600 font-semibold mb-4">
                {returnMsg || '결제 처리 중 오류가 발생했습니다'}
              </p>
              <p className="text-gray-600">
                다시 시도하거나 고객센터에 문의해주세요
              </p>
            </div>

            {/* 실패 정보 */}
            {orderId && (
              <div className="border-t border-b py-6 my-8">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">주문번호</p>
                    <p className="font-bold text-gray-900">{orderId}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">오류코드</p>
                    <p className="font-bold text-red-600">{returnCode}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-4">
              <a
                href="/"
                className="flex-1 py-4 bg-gray-600 hover:bg-gray-700 text-white font-bold text-center rounded-xl transition-all"
              >
                홈으로
              </a>
              <button
                onClick={() => window.history.back()}
                className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-center rounded-xl transition-all"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

        {/* 푸터 */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>무이상품권 주식회사</p>
          <p>고객센터: 1234-5678</p>
          <p>평일 09:00 - 18:00</p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <ReturnContent />
    </Suspense>
  );
}
