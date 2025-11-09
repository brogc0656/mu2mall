-- Supabase 데이터베이스 스키마
-- transactions 테이블 생성

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  brand TEXT NOT NULL,
  buyer_name TEXT,
  buyer_phone TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_result JSONB,
  issue_req_sn TEXT,
  issue_aprv_sn TEXT,
  barcode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 정책 설정
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 서비스 역할이 모든 데이터 접근 가능하도록 정책 생성
CREATE POLICY "Service role can access all transactions"
  ON transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 주석 추가
COMMENT ON TABLE transactions IS '거래 기록 테이블';
COMMENT ON COLUMN transactions.transaction_id IS 'Wizzpay 거래 ID';
COMMENT ON COLUMN transactions.amount IS '결제 금액';
COMMENT ON COLUMN transactions.brand IS '상품권 브랜드 (신세계, 롯데, 현대)';
COMMENT ON COLUMN transactions.status IS '거래 상태 (pending, completed, failed, cancelled)';
COMMENT ON COLUMN transactions.payment_result IS 'Wizzpay 결제 결과 JSON';
COMMENT ON COLUMN transactions.issue_req_sn IS 'Chlifes 발행 요청번호';
COMMENT ON COLUMN transactions.issue_aprv_sn IS 'Chlifes 발행 승인번호';
COMMENT ON COLUMN transactions.barcode IS '상품권 바코드';






