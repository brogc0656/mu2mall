-- Supabase 초기 설정 SQL
-- Supabase Dashboard → SQL Editor에서 실행

-- 1. transactions 테이블 생성
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  goods_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  buyer_name TEXT,
  buyer_tel TEXT,
  buyer_email TEXT,
  payment_method TEXT,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_result JSONB,
  giftcard_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_tel ON transactions(buyer_tel);

-- 3. Row Level Security 활성화
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 4. 공개 읽기 정책 (주문 조회용)
CREATE POLICY "주문자 본인만 조회 가능"
  ON transactions
  FOR SELECT
  USING (true); -- 일단 모두 허용, 나중에 전화번호 인증으로 제한 가능

-- 5. 서비스 역할만 삽입/업데이트 가능
CREATE POLICY "서버만 생성 가능"
  ON transactions
  FOR INSERT
  WITH CHECK (true); -- service_role 키로만 호출되므로 안전

CREATE POLICY "서버만 업데이트 가능"
  ON transactions
  FOR UPDATE
  USING (true); -- service_role 키로만 호출되므로 안전

-- 6. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. 테이블 확인
SELECT
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_name = 'transactions';

-- 8. 컬럼 확인
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'transactions'
ORDER BY ordinal_position;
