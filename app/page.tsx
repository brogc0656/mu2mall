import Link from 'next/link';

const giftCards = [
  {
    id: 'starbucks',
    name: '스타벅스',
    brand: 'Starbucks',
    image: '/images/starbucks.png',
    amounts: [10000, 30000, 50000, 100000],
    description: '전국 스타벅스 매장에서 사용 가능'
  },
  {
    id: 'cu',
    name: 'CU 편의점',
    brand: 'CU',
    image: '/images/cu.png',
    amounts: [5000, 10000, 30000, 50000],
    description: '전국 CU 편의점에서 사용 가능'
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-gray-900">무이상품권</h1>
          <p className="text-gray-600 mt-1">간편하게 구매하는 모바일 상품권</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">인기 상품권</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {giftCards.map((card) => (
            <div key={card.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <span className="text-4xl font-bold text-gray-700">{card.name}</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{card.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{card.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {card.amounts.map((amount) => (
                    <span key={amount} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {amount.toLocaleString()}원
                    </span>
                  ))}
                </div>
                <Link
                  href={`/products/${card.id}`}
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-medium transition-colors"
                >
                  구매하기
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* 안내 문구 */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">PG 결제 준비 중</h3>
          <p className="text-blue-700">
            현재 결제 시스템을 준비 중입니다. 곧 간편하고 안전한 결제 서비스를 제공할 예정입니다.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500 text-sm">
            © 2025 무이상품권. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
