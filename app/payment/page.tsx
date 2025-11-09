'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { generateOrderId, formatAmount, formatPhoneNumber, validatePhoneNumber, validateEmail } from '@/lib/utils';

// 상품권 목록 (메인 페이지와 동일)
const giftcards = [
  { code: 'SSG', name: 'SSG 모바일상품권' },
  { code: 'GS25', name: 'GS25 모바일상품권' },
  { code: 'CU', name: 'CU 모바일상품권' },
  { code: 'STARBUCKS', name: '스타벅스 모바일상품권' },
];

function PaymentForm() {
  const searchParams = useSearchParams();
  const goodsCode = searchParams.get('code');
  const price = searchParams.get('price');

  const [buyerName, setBuyerName] = useState('');
  const [buyerTel, setBuyerTel] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const giftcard = giftcards.find((card) => card.code === goodsCode);

  useEffect(() => {
    // Wizzpay SDK 로드
    const script = document.createElement('script');
    script.src = 'https://pgadmin.wizzpay.co.kr/wizzauth/wizzauth.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    // 입력 검증
    if (!buyerName.trim()) {
      alert('구매자 이름을 입력해주세요');
      return;
    }

    const formattedPhone = formatPhoneNumber(buyerTel);
    if (!validatePhoneNumber(formattedPhone)) {
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

    setIsProcessing(true);

    try {
      const orderId = generateOrderId();
      const baseUrl = window.location.origin;

      // BYPASSVALUE: 결제 완료 후 필요한 추가 정보
      const bypassValue = JSON.stringify({
        goodsCode,
        count: 1,
        phone: formattedPhone,
        buyerName,
        email: buyerEmail,
      });

      // Wizzpay 결제 실행
      // @ts-ignore
      if (typeof WizzpayISP !== 'undefined') {
        // @ts-ignore
        const wizzpay = new WizzpayISP();

        // 결제 정보 설정
        wizzpay.setOrderId(orderId);
        wizzpay.setGoodsname(`${giftcard?.name} ${formatAmount(Number(price))}원권`);
        wizzpay.setAmt(price);
        wizzpay.setBuyername(buyerName);
        wizzpay.setBuyertel(formattedPhone);
        wizzpay.setBuyeremail(buyerEmail);
        wizzpay.setBypassvalue(bypassValue);
        wizzpay.setReturnUrl(`${baseUrl}/payment/return`);
        wizzpay.setNotiUrl(`${baseUrl}/api/payment/notification`);

        // 결제 실행
        wizzpay.pay();
      } else {
        alert('결제 모듈을 로딩하는 중입니다. 잠시 후 다시 시도해주세요.');
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error('결제 오류:', error);
      alert('결제 처리 중 오류가 발생했습니다: ' + error.message);
      setIsProcessing(false);
    }
  };

  if (!giftcard || !price) {
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

  return (
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

          <div className="flex justify-between items-center border-t border-b py-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{giftcard.name}</h3>
              <p className="text-gray-600">수량: 1개</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">
                {formatAmount(Number(price))}원
              </p>
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
              <p className="text-sm text-gray-500 mt-1">
                상품권이 이 번호로 발송됩니다
              </p>
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
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 w-5 h-5 text-blue-600"
            />
            <span className="ml-3 text-gray-700">
              <span className="font-bold">이용약관</span>, <span className="font-bold">개인정보처리방침</span>, <span className="font-bold">환불규정</span>에 모두 동의합니다
            </span>
          </label>
        </div>

        {/* 결제 버튼 */}
        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className={`w-full py-5 text-white font-bold text-xl rounded-xl shadow-lg transition-all ${
            isProcessing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isProcessing ? '결제 진행 중...' : `${formatAmount(Number(price))}원 결제하기`}
        </button>

        <div className="text-center mt-8">
          <a href="/" className="text-blue-600 hover:underline">
            취소하고 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <PaymentForm />
    </Suspense>
  );
}
