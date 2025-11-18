'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type SelectedProduct = {
  name: string;
  amount: number; // 액면가
  price: number;  // 실제 판매가
  quantity: number;
  brand: string;
  goodsCode: string;
};

const GOODS_CODE_MAP: Record<string, string> = {
  신세계: 'SSG',
  GS25: 'GS25',
  CU: 'CU',
  STARBUCKS: 'STARBUCKS',
};

// 신세계상품권 가격표 (4% 수수료)
const PRICE_MAP: Record<number, number> = {
  10000: 10400,   // 10,000원권 → 10,400원
  30000: 31200,   // 30,000원권 → 31,200원
  50000: 52000,   // 50,000원권 → 52,000원
  100000: 104000, // 100,000원권 → 104,000원
};

export default function HomePage() {
  const router = useRouter();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(10000);
  const [selectedBrand, setSelectedBrand] = useState('신세계');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);

  const amountButtonClass = (amount: number, brand: string) => {
    const baseClass = 'amount-btn px-4 py-3 bg-white border-2 rounded-lg text-sm font-medium transition-all';
    const isActive = selectedBrand === brand && selectedAmount === amount;
    const stateClass = isActive
      ? ' border-blue-600 text-blue-600 bg-blue-50'
      : ' border-gray-200 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50';
    return `${baseClass}${stateClass}`;
  };

  const selectAmount = (amount: number, brand: string) => {
    setSelectedAmount(amount);
    setSelectedBrand(brand);
  };

  const buyGiftCard = (brand: string) => {
    const goodsCode = GOODS_CODE_MAP[brand];
    if (!goodsCode) {
      alert('현재 지원하지 않는 상품입니다.');
      return;
    }

    const price = PRICE_MAP[selectedAmount] || selectedAmount;

    setSelectedBrand(brand);
    setSelectedProduct({
      name: `${brand}상품권`,
      amount: selectedAmount,
      price: price,
      quantity: selectedQuantity,
      brand,
      goodsCode,
    });
    setPaymentModalOpen(true);
  };

  const increaseQuantity = () => {
    if (selectedQuantity < 10) {
      setSelectedQuantity(selectedQuantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (selectedQuantity > 1) {
      setSelectedQuantity(selectedQuantity - 1);
    }
  };

  const closeModal = () => {
    setPaymentModalOpen(false);
  };

  const proceedToPayment = () => {
    if (!selectedProduct) {
      alert('상품을 선택해주세요.');
      return;
    }

    closeModal();

    const totalPrice = selectedProduct.price * selectedProduct.quantity;

    // Redirect to dedicated payment page with Seedpayments
    router.push(
      `/payment?code=${selectedProduct.goodsCode}&amount=${selectedProduct.amount}&price=${selectedProduct.price}&quantity=${selectedProduct.quantity}&total=${totalPrice}`
    );
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
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <button
                        onClick={() => selectAmount(10000, '신세계')}
                        className={amountButtonClass(10000, '신세계')}
                      >
                        <div className="text-left">
                          <div className="font-semibold">10,000원</div>
                          <div className="text-xs text-gray-500">판매가: 10,400원</div>
                        </div>
                      </button>
                      <button
                        onClick={() => selectAmount(30000, '신세계')}
                        className={amountButtonClass(30000, '신세계')}
                      >
                        <div className="text-left">
                          <div className="font-semibold">30,000원</div>
                          <div className="text-xs text-gray-500">판매가: 31,200원</div>
                        </div>
                      </button>
                      <button
                        onClick={() => selectAmount(50000, '신세계')}
                        className={amountButtonClass(50000, '신세계')}
                      >
                        <div className="text-left">
                          <div className="font-semibold">50,000원</div>
                          <div className="text-xs text-gray-500">판매가: 52,000원</div>
                        </div>
                      </button>
                      <button
                        onClick={() => selectAmount(100000, '신세계')}
                        className={amountButtonClass(100000, '신세계')}
                      >
                        <div className="text-left">
                          <div className="font-semibold">100,000원</div>
                          <div className="text-xs text-gray-500">판매가: 104,000원</div>
                        </div>
                      </button>
                    </div>

                    <p className="text-sm font-medium text-gray-700 mb-2">수량 선택</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={decreaseQuantity}
                        className="w-10 h-10 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center font-bold text-lg"
                      >
                        −
                      </button>
                      <div className="flex-1 text-center">
                        <span className="text-2xl font-bold text-gray-900">{selectedQuantity}</span>
                        <span className="text-sm text-gray-600 ml-1">개</span>
                      </div>
                      <button
                        onClick={increaseQuantity}
                        className="w-10 h-10 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center font-bold text-lg"
                      >
                        +
                      </button>
                    </div>
                    <div className="mt-3 text-center">
                      <span className="text-sm text-gray-600">총 금액: </span>
                      <span className="text-lg font-bold text-blue-600">
                        {(PRICE_MAP[selectedAmount] * selectedQuantity).toLocaleString()}원
                      </span>
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
                  a: '신용카드, 체크카드 등 카드 결제가 가능합니다. Seedpayments 안전 결제 시스템을 통해 안전하게 결제하실 수 있습니다.',
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
                  <span className="text-gray-600">액면가</span>
                  <span className="font-bold text-gray-900">{selectedProduct?.amount.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">판매가</span>
                  <span className="font-bold text-gray-900">{selectedProduct?.price.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">수량</span>
                  <span className="font-bold text-gray-900">{selectedProduct?.quantity}개</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">총 결제금액</span>
                  <span className="font-bold text-blue-600 text-xl">
                    {selectedProduct && (selectedProduct.price * selectedProduct.quantity).toLocaleString()}원
                  </span>
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
