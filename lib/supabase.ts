// lib/supabase.ts - Supabase 클라이언트 (서버사이드)
import { createClient } from '@supabase/supabase-js';

// ✅ 환경 변수에서만 읽음
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // 서버 전용

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * 거래 기록 저장
 */
export interface Transaction {
  order_id: string;
  goods_name: string;
  amount: number;
  buyer_name: string;
  buyer_tel: string;
  buyer_email: string;
  payment_method?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_result?: any;
  giftcard_result?: any;
  created_at?: string;
}

export async function saveTransaction(transaction: Transaction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .insert([transaction])
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('거래 기록 저장 실패:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 거래 조회
 */
export async function getTransaction(orderId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('거래 조회 실패:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 거래 상태 업데이트
 */
export async function updateTransactionStatus(
  orderId: string,
  status: Transaction['status'],
  result?: any
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .update({ 
        status,
        payment_result: result,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId)
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('거래 상태 업데이트 실패:', error);
    return { success: false, error: error.message };
  }
}
