/**
 * Supabase 데이터베이스 연결 및 타입 정의
 */

import { createClient } from '@supabase/supabase-js';

export interface Transaction {
  id?: string;
  transaction_id: string; // Wizzpay 거래 ID
  amount: number;
  brand: string; // 신세계, 롯데, 현대
  buyer_name?: string;
  buyer_phone?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_result?: any; // Wizzpay 결제 결과
  issue_req_sn?: string; // Chlifes 발행 요청번호
  issue_aprv_sn?: string; // Chlifes 발행 승인번호
  barcode?: string; // 상품권 바코드
  created_at?: string;
  updated_at?: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 거래 기록 저장
 */
export async function createTransaction(
  transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transaction)
    .select()
    .single();

  if (error) {
    throw new Error(`거래 기록 저장 실패: ${error.message}`);
  }

  return data;
}

/**
 * 거래 기록 조회
 */
export async function getTransaction(
  transactionId: string
): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('transaction_id', transactionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // 레코드 없음
    }
    throw new Error(`거래 기록 조회 실패: ${error.message}`);
  }

  return data;
}

/**
 * 거래 기록 업데이트
 */
export async function updateTransaction(
  transactionId: string,
  updates: Partial<Transaction>
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('transaction_id', transactionId)
    .select()
    .single();

  if (error) {
    throw new Error(`거래 기록 업데이트 실패: ${error.message}`);
  }

  return data;
}






