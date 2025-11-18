'use client';
import { useState, useEffect } from 'react';
import { formatAmount, validatePhoneNumber, validateEmail } from '@/lib/utils';
import Script from 'next/script';

interface PaymentFormClientProps {
  giftcard: {
    code: string;
    name: string;
  };
  amount: string;   // 액면가
  price: string;    // 단가
  quantity: number; // 수량
  total: string;    // 총 금액
  paymentData: Record<string, string>;
  pgUrl: string;
}

export default function PaymentFormClient({
  giftcard,
  amount,
  price,
  quantity,
  total,
  paymentData,
  pgUrl,
}: PaymentFormClientProps) {
  const [buyerName, setBuyerName] = useState('');
  const [buyerTel, setBuyerTel] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const handlePayment = () => {
    if (!buyerName.trim()) {
      alert('구매자 이름을 입력해주세요');
      return;
    }

    if (!validatePhoneNumber(buyerTel)) {
      alert('휴대폰 번호를 010-1234-5678 형식으로 입력해주세요');
      return;
    }

    if (!validateEmail(buyerEmail)) {
      alert('올바른 이메일 주소를 입력해주세요');
      return;
    }

    if (!agreeTerms) {
      alert('이용약관에 동의해주세요');
      return;
    }

    if (!sdkLoaded || typeof window.SendPay !== 'function') {
      alert('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsProcessing(true);

    try {
      // PHP/JSP처럼 HTML form을 SendPay로 전달 (동적 생성 없음!)
      const form = document.querySelector('form[name="payInit"]') as HTMLFormElement;

      if (!form) {
        throw new Error('결제 폼을 찾을 수 없습니다.');
      }

      // Seedpayments SDK 호출 (팝업 결제창)
      window.SendPay(form);
    } catch (error: any) {
      alert('결제 처리 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Seedpayments SDK 로드 */}
      <Script
        src={`${pgUrl}/js/pgAsistant.js`}
        strategy="lazyOnload"
        onLoad={() => {
          console.log('Seedpayments SDK 로드 완료');
          setSdkLoaded(true);
        }}
        onError={() => {
          console.error('Seedpayments SDK 로드 실패');
          alert('결제 모듈을 불러올 수 없습니다. 페이지를 새로고침해주세요.');
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">결제하기</h1>
            <p className="text-gray-600">안전한 결제를 위해 정보를 입력해주세요</p>
          </div>

          {/* 주문 정보 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">주문 정보</h2>

            <div className="space-y-3 border-t border-b py-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">상품명</span>
                <span className="font-bold text-gray-900">{giftcard.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">액면가</span>
                <span className="font-bold text-gray-900">{formatAmount(Number(amount))}원</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">판매가</span>
                <span className="font-bold text-gray-900">{formatAmount(Number(price))}원</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">수량</span>
                <span className="font-bold text-gray-900">{quantity}개</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-lg font-bold text-gray-900">총 결제금액</span>
                <span className="text-3xl font-bold text-blue-600">
                  {formatAmount(Number(total))}원
                </span>
              </div>
            </div>
          </div>

          {/* 구매자 정보 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">구매자 정보</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  이름 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  휴대폰 번호 <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  value={buyerTel}
                  onChange={(e) => setBuyerTel(e.target.value)}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  이메일 <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 약관 동의 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="agreeTerms" className="ml-3 text-gray-700">
                <span className="font-bold">개인정보 수집 및 이용약관</span>에 동의합니다.
                <span className="text-red-600">*</span>
              </label>
            </div>
          </div>

          {/*
            PHP/JSP 방식: HTML form을 JSX로 렌더링 (서버 사이드 렌더링)
            이렇게 하면 JavaScript ByteString 제약을 우회하고 한글 처리 가능
          */}
          <form name="payInit" method="post" action="" style={{ display: 'none' }}>
            <input type="hidden" name="method" value={paymentData.method} />
            <input type="hidden" name="mid" value={paymentData.mid} />
            <input type="hidden" name="goodsNm" value={paymentData.goodsNm} />
            <input type="hidden" name="goodsAmt" value={paymentData.goodsAmt} />
            <input type="hidden" name="ordNo" value={paymentData.ordNo} />
            <input type="hidden" name="ordNm" value={buyerName} />
            <input type="hidden" name="ordEmail" value={buyerEmail} />
            <input type="hidden" name="ordTel" value={buyerTel} />
            <input type="hidden" name="ordIp" value={paymentData.ordIp} />
            <input type="hidden" name="mbsUsrId" value={paymentData.mbsUsrId} />
            <input type="hidden" name="mbsReserved" value={paymentData.mbsReserved} />
            <input type="hidden" name="returnUrl" value={paymentData.returnUrl} />
            <input type="hidden" name="ediDate" value={paymentData.ediDate} />
            <input type="hidden" name="hashString" value={paymentData.hashString} />
          </form>

          {/* 결제 버튼 */}
          <button
            onClick={handlePayment}
            disabled={isProcessing || !sdkLoaded}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              isProcessing || !sdkLoaded
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-2xl'
            }`}
          >
            {isProcessing
              ? '결제 처리 중...'
              : !sdkLoaded
              ? '결제 모듈 로딩 중...'
              : `${formatAmount(Number(price))}원 결제하기`}
          </button>

          {/* 안내 사항 */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>안전한 결제를 위해 본인인증이 필요합니다</p>
            <p>결제 완료 후 SMS로 상품권이 발송됩니다</p>
          </div>
        </div>
      </div>
    </>
  );
}
