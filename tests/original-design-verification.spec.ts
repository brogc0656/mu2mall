import { test, expect } from '@playwright/test';

test.describe('원본 디자인 검증', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
  });

  test('페이지 로드 및 기본 요소 확인', async ({ page }) => {
    // Header 확인
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByRole('heading', { name: '무이몰' })).toBeVisible();

    // Logo 이미지 확인
    const logo = page.locator('img[alt="무이상품권"]');
    await expect(logo).toBeVisible();

    // Navigation 확인
    await expect(page.getByRole('link', { name: '상품권구매' })).toBeVisible();
    await expect(page.getByRole('link', { name: '이용안내' })).toBeVisible();
    await expect(page.getByRole('link', { name: '공지사항' })).toBeVisible();

    // Main Banner 확인
    await expect(page.getByRole('heading', { name: '365일 24시간 즉시발송' })).toBeVisible();
    await expect(page.getByText('빠르고 안전한 모바일 상품권 구매')).toBeVisible();
  });

  test('상품권 카드 표시 확인', async ({ page }) => {
    // 신세계상품권 카드 확인
    await expect(page.getByRole('heading', { name: '신세계상품권' })).toBeVisible();
    await expect(page.getByText('신세계백화점, 이마트 등에서 사용 가능')).toBeVisible();

    // 금액 버튼 확인
    await expect(page.getByRole('button', { name: '10,000원', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '30,000원', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '50,000원', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '100,000원', exact: true })).toBeVisible();

    // 구매 버튼 확인
    await expect(page.getByRole('button', { name: '지금 구매하기' })).toBeVisible();

    // 현대상품권 (준비 중) 확인
    await expect(page.getByRole('heading', { name: '현대상품권' })).toBeVisible();
    await expect(page.getByText('아직 발송되지 않습니다')).toBeVisible();
    await expect(page.getByRole('button', { name: '준비 중입니다' })).toBeVisible();
  });

  test('금액 선택 및 UI 업데이트', async ({ page }) => {
    // 10,000원 버튼 클릭
    const button10k = page.getByRole('button', { name: '10,000원', exact: true }).first();
    await button10k.click();

    // 버튼 스타일 변경 확인 (선택된 상태)
    await expect(button10k).toHaveClass(/border-blue-600/);
    await expect(button10k).toHaveClass(/text-blue-600/);
    await expect(button10k).toHaveClass(/bg-blue-50/);

    // 다른 금액 버튼 클릭
    const button30k = page.getByRole('button', { name: '30,000원', exact: true }).first();
    await button30k.click();

    // 30,000원 버튼이 선택된 상태로 변경
    await expect(button30k).toHaveClass(/border-blue-600/);
  });

  test('구매 버튼 클릭 시 모달 오픈', async ({ page }) => {
    // 금액 선택
    const button10k = page.getByRole('button', { name: '10,000원', exact: true }).first();
    await button10k.click();

    // 구매 버튼 클릭
    const buyButton = page.getByRole('button', { name: '지금 구매하기' });
    await buyButton.click();

    // 모달 표시 확인
    await expect(page.getByRole('heading', { name: '구매 확인' })).toBeVisible();
    await expect(page.getByText('결제 후 즉시 발송')).toBeVisible();
    await expect(page.getByText('상품명')).toBeVisible();
    await expect(page.getByText('신세계상품권')).toBeVisible();
    await expect(page.getByText('10,000원')).toBeVisible();

    // 입력 필드 확인
    const phoneInput = page.getByPlaceholder('010-1234-5678');
    await expect(phoneInput).toBeVisible();
    await expect(phoneInput).toHaveValue('010-1234-5678');

    const nameInput = page.getByPlaceholder('홍길동');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue('홍길동');

    // 취소/결제하기 버튼 확인
    await expect(page.getByRole('button', { name: '취소' })).toBeVisible();
    await expect(page.getByRole('button', { name: '결제하기' })).toBeVisible();
  });

  test('모달 입력 필드 수정 가능', async ({ page }) => {
    // 금액 선택 및 구매 버튼 클릭
    await page.getByRole('button', { name: '10,000원', exact: true }).first().click();
    await page.getByRole('button', { name: '지금 구매하기' }).click();

    // 전화번호 입력 필드 수정
    const phoneInput = page.getByPlaceholder('010-1234-5678');
    await phoneInput.fill('010-9999-8888');
    await expect(phoneInput).toHaveValue('010-9999-8888');

    // 구매자명 입력 필드 수정
    const nameInput = page.getByPlaceholder('홍길동');
    await nameInput.fill('테스터');
    await expect(nameInput).toHaveValue('테스터');
  });

  test('모달 취소 버튼 클릭', async ({ page }) => {
    // 금액 선택 및 구매 버튼 클릭
    await page.getByRole('button', { name: '10,000원', exact: true }).first().click();
    await page.getByRole('button', { name: '지금 구매하기' }).click();

    // 모달이 열린 상태 확인
    await expect(page.getByRole('heading', { name: '구매 확인' })).toBeVisible();

    // 취소 버튼 클릭
    await page.getByRole('button', { name: '취소' }).click();

    // 모달이 닫힌 상태 확인
    await expect(page.getByRole('heading', { name: '구매 확인' })).not.toBeVisible();
  });

  test('FAQ 섹션 확인', async ({ page }) => {
    // FAQ 섹션으로 스크롤
    await page.getByRole('heading', { name: '자주 묻는 질문' }).scrollIntoViewIfNeeded();

    // FAQ 항목 확인
    await expect(page.getByText('상품권은 언제 받을 수 있나요?')).toBeVisible();
    await expect(page.getByText('결제 수단은 무엇이 있나요?')).toBeVisible();
    await expect(page.getByText('환불은 가능한가요?')).toBeVisible();
    await expect(page.getByText('유효기간이 있나요?')).toBeVisible();
  });

  test('FAQ 아코디언 동작', async ({ page }) => {
    // FAQ 섹션으로 스크롤
    await page.getByRole('heading', { name: '자주 묻는 질문' }).scrollIntoViewIfNeeded();

    // 첫 번째 FAQ 클릭
    const faqButton = page.getByRole('button', { name: /상품권은 언제 받을 수 있나요\?/ });
    await faqButton.click();

    // 답변 표시 확인
    await expect(page.getByText('주문 후 즉시 발송됩니다.')).toBeVisible();

    // 아이콘 변경 확인 (+ → −)
    const icon = page.locator('#icon-1');
    await expect(icon).toHaveText('−');

    // 다시 클릭하면 닫힘
    await faqButton.click();
    await expect(page.getByText('주문 후 즉시 발송됩니다.')).not.toBeVisible();
    await expect(icon).toHaveText('+');
  });

  test('공지사항 섹션 확인', async ({ page }) => {
    // 공지사항 섹션으로 스크롤
    await page.getByRole('heading', { name: '공지사항' }).scrollIntoViewIfNeeded();

    // 공지사항 확인
    await expect(page.getByText('무이몰 오픈')).toBeVisible();
    await expect(page.getByText('2025-10-24')).toBeVisible();
  });

  test('Footer 정보 확인', async ({ page }) => {
    // Footer로 스크롤
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();

    // 회사 정보 확인
    await expect(page.getByText('상호: 무이상품권 주식회사')).toBeVisible();
    await expect(page.getByText('대표자: 전현우')).toBeVisible();
    await expect(page.getByText('사업자등록번호: 740-87-03673')).toBeVisible();
    await expect(page.getByText('법인등록번호: 110111-0923305')).toBeVisible();

    // 고객센터 정보 확인
    await expect(page.getByText('주소: 서울특별시 영등포구 영등포로 198-1, 2층')).toBeVisible();
    await expect(page.getByText('운영시간: 평일 09:00 - 18:00')).toBeVisible();

    // 이용안내 링크 확인
    await expect(page.getByRole('link', { name: '이용약관' })).toBeVisible();
    await expect(page.getByRole('link', { name: '개인정보처리방침' })).toBeVisible();
    await expect(page.getByRole('link', { name: '환불정책' })).toBeVisible();
  });

  test('WizzAuth 스크립트 로드 확인', async ({ page }) => {
    // WizzAuth 스크립트가 로드되었는지 확인
    const scripts = await page.locator('script[src*="wizzauth"]').count();
    expect(scripts).toBeGreaterThanOrEqual(3); // aes.js, pbkdf2.js, function.js
  });

  test('반응형 디자인 - 모바일 네비게이션 확인', async ({ page }) => {
    // 모바일 사이즈로 변경
    await page.setViewportSize({ width: 375, height: 667 });

    // 모바일 하단 네비게이션 확인
    const mobileNav = page.locator('nav.fixed.bottom-0');
    await expect(mobileNav).toBeVisible();

    // 네비게이션 버튼 확인
    await expect(page.getByRole('button', { name: '구매' })).toBeVisible();
    await expect(page.getByRole('button', { name: '쿠폰함' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'FAQ' })).toBeVisible();
    await expect(page.getByRole('button', { name: '고객센터' })).toBeVisible();
  });

  test('이미지 로딩 확인', async ({ page }) => {
    // 로고 이미지
    const logo = page.locator('img[alt="무이상품권"]');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('src', '/images/logo.png');

    // 신세계 상품권 이미지
    const shinsegaeImg = page.locator('img[alt="신세계상품권"]');
    await expect(shinsegaeImg).toBeVisible();
    await expect(shinsegaeImg).toHaveAttribute('src', '/images/shinsegae.avif');

    // 현대 상품권 이미지
    const hyundaiImg = page.locator('img[alt="현대상품권"]');
    await expect(hyundaiImg).toBeVisible();
    await expect(hyundaiImg).toHaveAttribute('src', '/images/현대상품권10만원권.jpg');

    // 롯데 상품권 이미지
    const lotteImg = page.locator('img[alt="롯데상품권"]');
    await expect(lotteImg).toBeVisible();
    await expect(lotteImg).toHaveAttribute('src', '/images/롯데상품권10만원권.jpg');
  });
});
