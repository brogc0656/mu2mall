'use client';
import { useState, useEffect } from 'react';
import Script from 'next/script';

// 전역 타입 선언
declare global {
  interface Window {
    WizzpayISP: any;
    wizzpayInstance: any;
    selectedAmount: number;
    currentBrand: string;
    currentTransaction: any;
  }
}

export default function HomePage() {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [processingOverlayOpen, setProcessingOverlayOpen] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<{ name: string; amount: number } | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('010-1234-5678');
  const [buyerName, setBuyerName] = useState('홍길동');

  const [resultData, setResultData] = useState<{
    icon: 'success' | 'error' | 'warning';
    title: string;
    message: string;
    details?: string;
  } | null>(null);

  // WizzAuth 스크립트 로드 완료 후 초기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.selectedAmount = 10000;
      window.currentBrand = '';
      window.currentTransaction = null;
    }
  }, []);

  // 금액 선택
  const selectAmount = (amount: number, brand: string) => {
    if (typeof window !== 'undefined') {
      window.selectedAmount = amount;
      window.currentBrand = brand;
    }

    // UI 업데이트를 위한 상태는 별도로 관리하지 않고 직접 DOM 조작
    const buttons = document.querySelectorAll('.amount-btn');
    buttons.forEach((btn) => {
      btn.classList.remove('border-blue-600', 'text-blue-600', 'bg-blue-50');
      btn.classList.add('border-gray-200');
    });

    const clickedButton = event?.target as HTMLElement;
    if (clickedButton) {
      clickedButton.classList.remove('border-gray-200');
      clickedButton.classList.add('border-blue-600', 'text-blue-600', 'bg-blue-50');
    }
  };

  // 상품권 구매하기 클릭
  const buyGiftCard = (brand: string) => {
    if (typeof window === 'undefined' || !window.selectedAmount) {
      alert('금액을 선택해주세요.');
      return;
    }

    setSelectedProduct({
      name: `${brand}상품권`,
      amount: window.selectedAmount,
    });
    setPaymentModalOpen(true);
  };

  // Modal 닫기
  const closeModal = () => {
    setPaymentModalOpen(false);
  };

  // 결제 진행
  const proceedToPayment = async () => {
    if (!phoneNumber || !buyerName) {
      alert('휴대폰 번호와 구매자명을 입력해주세요.');
      return;
    }

    if (!selectedProduct) {
      alert('상품을 선택해주세요.');
      return;
    }

    closeModal();
    setProcessingMessage('결제 진행 중...');
    setProcessingOverlayOpen(true);

    const orderId = 'ORDER_' + Date.now();
    const productName = selectedProduct.name;
    const amount = selectedProduct.amount;
    const GOODS_CODE = 'SSG'; // 상품권 코드

    // 거래 정보 저장
    if (typeof window !== 'undefined') {
      window.currentTransaction = {
        orderId: orderId,
        productName: productName,
        amount: amount,
        phoneNumber: phoneNumber,
        buyerName: buyerName,
        goodsCode: GOODS_CODE,
      };
    }

    try {
      // ✅ 보안: 서버에서 결제 초기화 API 호출 (키 노출 방지)
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const bypassValue = JSON.stringify({
        orderId: orderId,
        phone: phoneNumber,
        goodsCode: GOODS_CODE,
        buyerName: buyerName,
      });

      const initResponse = await fetch(`${baseUrl}/api/payment/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goodsname: productName,
          amt: amount.toString(),
          buyername: buyerName,
          bypassValue: bypassValue,
        }),
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(errorData.error || '결제 초기화에 실패했습니다.');
      }

      const initData = await initResponse.json();

      if (!initData.success) {
        throw new Error(initData.error || '결제 초기화에 실패했습니다.');
      }

      // ✅ 서버에서 받은 암호화된 데이터로 Wizzpay 결제 진행 (키 노출 없음)
      // ⚠️ 중요: 개행 문자 제거 (안전장치)
      const wizzUrl = (initData.wizzUrl || '').trim();
      const mid = (initData.mid || '').trim();
      const encryptedData = initData.data;

      // Wizzpay 결제 팝업 생성
      const popupName = 'wizzpayPopup';
      const popup = window.open(
        'about:blank',
        popupName,
        'left=50, top=50, width=710px, height=510px, toolbar=no, scrollbars=no, status=no, resizable=no'
      );

      if (!popup) {
        throw new Error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
      }

      // Wizzpay 서버로 전송할 form 생성
      const requestForm = document.createElement('form');
      requestForm.action = `${wizzUrl}/pay/api/auth/common/Ready.jsp`;
      requestForm.method = 'POST';
      requestForm.target = popupName;
      requestForm.style.display = 'none';

      // MID와 암호화된 DATA 전송 (규격서 준수)
      const midInput = document.createElement('input');
      midInput.type = 'hidden';
      midInput.name = 'MID';
      midInput.value = mid;
      requestForm.appendChild(midInput);

      const dataInput = document.createElement('input');
      dataInput.type = 'hidden';
      dataInput.name = 'DATA';
      dataInput.value = encryptedData;
      requestForm.appendChild(dataInput);

      const blockInput = document.createElement('input');
      blockInput.type = 'hidden';
      blockInput.name = 'BLOCK_CARD_COMPANIES';
      blockInput.value = '';
      requestForm.appendChild(blockInput);

      document.body.appendChild(requestForm);
      requestForm.submit();

      // 팝업이 닫힐 때 결과 처리
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          if (document.body.contains(requestForm)) {
            document.body.removeChild(requestForm);
          }
          // 결제 결과는 /api/payment/notification에서 처리됨
          setProcessingOverlayOpen(false);
          setResultData({
            icon: 'success',
            title: '결제 진행 중',
            message: '결제가 완료되면 SMS로 상품권이 발송됩니다.',
          });
          setResultModalOpen(true);
        }
      }, 1000);

      console.log('✅ Wizzpay 결제 팝업 열림 (서버 암호화 데이터 사용)');
    } catch (error: any) {
      console.error('❌ Payment launch failed:', error);
      setProcessingOverlayOpen(false);
      alert('결제 시스템 오류가 발생했습니다: ' + error.message);
    }
  };

  // 결제 결과 처리
  const handlePaymentResult = async () => {
    if (typeof window === 'undefined' || !window.wizzpayInstance) return;

    console.log('📊 Payment result received');
    const returnData = window.wizzpayInstance.getResultData();
    console.log('결제 결과:', returnData);

    setProcessingOverlayOpen(false);

    if (returnData.RETURNCODE === '0000') {
      // 결제 성공 - 상품권 발급은 서버에서 자동으로 처리됨
      console.log('✅ Payment successful');

      setResultData({
        icon: 'success',
        title: '구매 완료!',
        message: 'SMS로 상품권이 발송되었습니다.',
        details: `거래번호: ${returnData.TID}`,
      });
      setResultModalOpen(true);
    } else {
      // 결제 실패
      console.log('❌ Payment failed:', returnData.RETURNMSG);
      setResultData({
        icon: 'error',
        title: '결제 실패',
        message: returnData.RETURNMSG || '결제가 취소되었거나 실패했습니다.',
      });
      setResultModalOpen(true);
    }
  };

  // 결과 모달 닫기
  const closeResultModal = () => {
    setResultModalOpen(false);
    setResultData(null);
    if (typeof window !== 'undefined') {
      window.currentTransaction = null;
      window.selectedAmount = 10000;
    }
  };

  // FAQ Accordion
  const toggleAccordion = (num: number) => {
    const content = document.getElementById(`content-${num}`);
    const icon = document.getElementById(`icon-${num}`);

    if (!content || !icon) return;

    if (content.classList.contains('active')) {
      content.classList.remove('active');
      icon.textContent = '+';
    } else {
      document.querySelectorAll('.accordion-content').forEach((item) => {
        item.classList.remove('active');
      });
      document.querySelectorAll('[id^="icon-"]').forEach((item) => {
        item.textContent = '+';
      });

      content.classList.add('active');
      icon.textContent = '−';
    }
  };

  return (
    <>
      {/* WizzAuth Scripts */}
      <Script src="/wizzauth/aes.js" strategy="beforeInteractive" />
      <Script src="/wizzauth/pbkdf2.js" strategy="beforeInteractive" />
      <Script src="/wizzauth/function.js" strategy="beforeInteractive" />

      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src="/images/logo.png" alt="무이상품권" className="h-12" />
                <h1 className="text-2xl font-bold text-gray-900">무이몰</h1>
              </div>
              <nav className="hidden md:flex space-x-8">
                <a href="#products" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  상품권구매
                </a>
                <a href="#faq" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  이용안내
                </a>
                <a href="#notice" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  공지사항
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Banner */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="max-w-6xl mx-auto px-4 py-16 text-center">
            <h2 className="text-4xl font-bold mb-4">365일 24시간 즉시발송</h2>
            <p className="text-blue-50 text-xl mb-8">빠르고 안전한 모바일 상품권 구매</p>
            <div className="flex justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>즉시 발송</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>안전 결제</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>고객 만족</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-10" id="products">
          {/* Product Section */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-gray-900 mb-3">판매 상품권</h3>
              <p className="text-gray-600">다양한 브랜드의 모바일 상품권을 만나보세요</p>
            </div>

            {/* Gift Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {/* 신세계상품권 */}
              <div className="product-card bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all hover:scale-105">
                <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100">
                  <img
                    src="/images/shinsegae.avif"
                    alt="신세계상품권"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    즉시 발송
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-5">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">신세계상품권</h4>
                    <p className="text-gray-600">신세계백화점, 이마트 등에서 사용 가능</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-5">
                    <p className="text-sm font-medium text-gray-700 mb-3">금액 선택</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => selectAmount(10000, '신세계')}
                        className="amount-btn px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 text-sm font-medium transition-all"
                      >
                        10,000원
                      </button>
                      <button
                        onClick={() => selectAmount(30000, '신세계')}
                        className="amount-btn px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 text-sm font-medium transition-all"
                      >
                        30,000원
                      </button>
                      <button
                        onClick={() => selectAmount(50000, '신세계')}
                        className="amount-btn px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 text-sm font-medium transition-all"
                      >
                        50,000원
                      </button>
                      <button
                        onClick={() => selectAmount(100000, '신세계')}
                        className="amount-btn px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 text-sm font-medium transition-all"
                      >
                        100,000원
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => buyGiftCard('신세계')}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all"
                  >
                    지금 구매하기
                  </button>
                </div>
              </div>

              {/* 현대상품권 (준비 중) */}
              <div className="product-card bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all hover:scale-105 opacity-75">
                <div className="relative h-64 bg-gradient-to-br from-purple-100 to-pink-100">
                  <img src="/images/현대상품권10만원권.jpg" alt="현대상품권" className="w-full h-full object-cover" />
                  <div className="absolute top-4 right-4 bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    준비 중
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="bg-white rounded-lg px-6 py-3">
                      <p className="text-gray-900 font-bold text-lg">아직 발송되지 않습니다</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-5">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">현대상품권</h4>
                    <p className="text-gray-600">현대백화점, 현대홈쇼핑에서 사용 가능</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-5">
                    <p className="text-sm font-medium text-gray-700 mb-3">금액 선택</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled
                        className="px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
                      >
                        10,000원
                      </button>
                      <button
                        disabled
                        className="px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
                      >
                        30,000원
                      </button>
                      <button
                        disabled
                        className="px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
                      >
                        50,000원
                      </button>
                      <button
                        disabled
                        className="px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
                      >
                        100,000원
                      </button>
                    </div>
                  </div>

                  <button
                    disabled
                    className="w-full bg-gray-400 cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-md opacity-60"
                  >
                    준비 중입니다
                  </button>
                </div>
              </div>

              {/* 롯데상품권 (준비 중) */}
              <div className="product-card bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all hover:scale-105 opacity-75">
                <div className="relative h-64 bg-gradient-to-br from-red-100 to-orange-100">
                  <img src="/images/롯데상품권10만원권.jpg" alt="롯데상품권" className="w-full h-full object-cover" />
                  <div className="absolute top-4 right-4 bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    준비 중
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="bg-white rounded-lg px-6 py-3">
                      <p className="text-gray-900 font-bold text-lg">아직 발송되지 않습니다</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-5">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">롯데상품권</h4>
                    <p className="text-gray-600">롯데백화점, 롯데마트에서 사용 가능</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-5">
                    <p className="text-sm font-medium text-gray-700 mb-3">금액 선택</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled
                        className="px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
                      >
                        10,000원
                      </button>
                      <button
                        disabled
                        className="px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
                      >
                        30,000원
                      </button>
                      <button
                        disabled
                        className="px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
                      >
                        50,000원
                      </button>
                      <button
                        disabled
                        className="px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
                      >
                        100,000원
                      </button>
                    </div>
                  </div>

                  <button
                    disabled
                    className="w-full bg-gray-400 cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-md opacity-60"
                  >
                    준비 중입니다
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <section className="mb-16" id="faq">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-gray-900 mb-3">자주 묻는 질문</h3>
              <p className="text-gray-600">궁금하신 사항을 확인해보세요</p>
            </div>
            <div className="space-y-3 max-w-3xl mx-auto">
              {[
                {
                  q: '상품권은 언제 받을 수 있나요?',
                  a: '주문 후 즉시 발송됩니다. 365일 24시간 언제든지 주문하시면 바로 사용 가능한 모바일 상품권을 받으실 수 있습니다.',
                },
                {
                  q: '결제 수단은 무엇이 있나요?',
                  a: '신용카드, 체크카드 등 카드 결제가 가능합니다. Wizzpay 안전 결제 시스템을 통해 안전하게 결제하실 수 있습니다.',
                },
                {
                  q: '환불은 가능한가요?',
                  a: '미사용 상품권에 한하여 구매일로부터 7일 이내 환불 가능합니다. 고객센터로 문의해 주시면 신속하게 처리해 드립니다.',
                },
                {
                  q: '유효기간이 있나요?',
                  a: '발행일로부터 5년간 사용 가능합니다. 상품권별로 유효기간이 다를 수 있으니 구매 시 확인해 주세요.',
                },
              ].map((faq, index) => (
                <div key={index} className="bg-white border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleAccordion(index + 1)}
                    className="w-full text-left px-5 py-4 flex justify-between items-center hover:bg-gray-50"
                  >
                    <span className="font-medium text-gray-900">{faq.q}</span>
                    <span className="text-gray-400" id={`icon-${index + 1}`}>
                      +
                    </span>
                  </button>
                  <div id={`content-${index + 1}`} className="accordion-content">
                    <div className="px-5 pb-4 text-gray-600 text-sm">{faq.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Notice Section */}
          <section className="mb-16" id="notice">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-gray-900 mb-3">공지사항</h3>
              <p className="text-gray-600">최신 소식을 확인하세요</p>
            </div>
            <div className="bg-white border rounded-xl shadow-sm max-w-3xl mx-auto divide-y">
              <div className="px-5 py-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900">무이몰 오픈</span>
                  <span className="text-sm text-gray-500">2025-10-24</span>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-50">
          <div className="grid grid-cols-4">
            <button
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex flex-col items-center py-3 text-gray-600 hover:text-blue-600"
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="text-xs">구매</span>
            </button>
            <button
              onClick={() => alert('내 쿠폰함 기능은 준비 중입니다.')}
              className="flex flex-col items-center py-3 text-gray-600 hover:text-blue-600"
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <span className="text-xs">쿠폰함</span>
            </button>
            <button
              onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex flex-col items-center py-3 text-gray-600 hover:text-blue-600"
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xs">FAQ</span>
            </button>
            <button className="flex flex-col items-center py-3 text-gray-600 hover:text-blue-600">
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span className="text-xs">고객센터</span>
            </button>
          </div>
        </nav>

        {/* Payment Confirmation Modal */}
        {paymentModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
            <div className="bg-white p-8 rounded-2xl max-w-md w-[90%] max-h-[90vh] overflow-y-auto animate-slideUp">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">구매 확인</h3>

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-blue-900 font-medium mb-1">결제 후 즉시 발송</p>
                    <p className="text-sm text-blue-700">결제가 완료되면 즉시 SMS로 상품권이 발송됩니다.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">상품명</span>
                  <span className="font-bold text-gray-900">{selectedProduct?.name}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">금액</span>
                  <span className="font-bold text-gray-900">{selectedProduct?.amount.toLocaleString()}원</span>
                </div>
                <div className="pb-3 border-b">
                  <label className="block text-gray-600 mb-2">받는 분 휴대폰 번호</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="010-1234-5678"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">구매자명</label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-bold transition-all"
                >
                  취소
                </button>
                <button
                  onClick={proceedToPayment}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-lg font-bold transition-all"
                >
                  결제하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing Overlay */}
        {processingOverlayOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-white text-lg font-bold">{processingMessage}</p>
            </div>
          </div>
        )}

        {/* Result Modal */}
        {resultModalOpen && resultData && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-2xl max-w-md w-[90%]">
              <div className="text-center mb-6">
                <div
                  className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    resultData.icon === 'success'
                      ? 'bg-green-100'
                      : resultData.icon === 'error'
                      ? 'bg-red-100'
                      : 'bg-yellow-100'
                  }`}
                >
                  {resultData.icon === 'success' && (
                    <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {resultData.icon === 'error' && (
                    <svg className="w-12 h-12 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {resultData.icon === 'warning' && (
                    <svg className="w-12 h-12 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{resultData.title}</h3>
                <p className="text-gray-600">{resultData.message}</p>
              </div>

              {resultData.details && (
                <div className="mb-6">
                  <div
                    className={`rounded-lg p-4 text-sm ${
                      resultData.icon === 'success'
                        ? 'bg-green-50 text-green-800'
                        : resultData.icon === 'error'
                        ? 'bg-red-50 text-red-800'
                        : 'bg-yellow-50 text-yellow-800'
                    }`}
                  >
                    {resultData.details}
                  </div>
                </div>
              )}

              <button
                onClick={closeResultModal}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-lg font-bold transition-all"
              >
                확인
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-gray-100 border-t pt-10 pb-20 md:pb-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h4 className="font-bold text-gray-900 mb-3">회사정보</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>상호: 무이상품권 주식회사</p>
                  <p>대표자: 전현우</p>
                  <p>사업자등록번호: 740-87-03673</p>
                  <p>법인등록번호: 110111-0923305</p>
                  <p>통신판매업 신고번호: 제 2025-서울영등포-2421호</p>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-3">고객센터</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>주소: 서울특별시 영등포구 영등포로 198-1, 2층</p>
                  <p>운영시간: 평일 09:00 - 18:00</p>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-3">이용안내</h4>
                <div className="text-sm space-y-1">
                  <p>
                    <a href="/terms" className="text-gray-600 hover:text-blue-600">
                      이용약관
                    </a>
                  </p>
                  <p>
                    <a href="/privacy" className="text-gray-600 hover:text-blue-600">
                      개인정보처리방침
                    </a>
                  </p>
                  <p>
                    <a href="/refund" className="text-gray-600 hover:text-blue-600">
                      환불정책
                    </a>
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t pt-6 text-center text-sm text-gray-500">
              <p>© 2025 무이상품권 주식회사. All rights reserved.</p>
              <p className="mt-2">전자상거래 등에서의 소비자보호에 관한 법률에 따른 통신판매업을 신고하였습니다.</p>
            </div>
          </div>
        </footer>

        {/* CSS for Accordion */}
        <style jsx global>{`
          .accordion-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
          }
          .accordion-content.active {
            max-height: 500px;
          }
          .product-card {
            transition: all 0.3s ease;
          }
          .product-card:hover {
            transform: translateY(-4px);
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes slideUp {
            from {
              transform: translateY(50px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s;
          }
          .animate-slideUp {
            animation: slideUp 0.3s;
          }
        `}</style>
      </div>
    </>
  );
}
