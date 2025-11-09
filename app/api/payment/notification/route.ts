// app/api/payment/notification/route.ts - Wizzpay 결제 결과 통보 (NOTIURL)
import { NextRequest, NextResponse } from 'next/server';
import { saveTransaction, updateTransactionStatus } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    logger.info('Wizzpay 결제 통보 수신', body);

    const {
      RETURNCODE,
      RETURNMSG,
      TID,
      ORDERID,
      GOODSNAME,
      AMT,
      TRANDATE,
      CARDNAME,
      BYPASSVALUE,
    } = body;

    // BYPASSVALUE 파싱 (클라이언트에서 전달한 추가 정보)
    let bypassData: any = {};
    try {
      if (BYPASSVALUE) {
        bypassData = JSON.parse(BYPASSVALUE);
      }
    } catch (e) {
      logger.warn('BYPASSVALUE 파싱 실패', e);
    }

    // 결제 성공 (0000)
    if (RETURNCODE === '0000') {
      logger.info('결제 성공', { orderId: ORDERID, amount: AMT });

      // 1️⃣ 거래 기록 저장 (Supabase)
      await saveTransaction({
        order_id: ORDERID,
        goods_name: GOODSNAME,
        amount: parseInt(AMT),
        buyer_name: bypassData.buyerName || '',
        buyer_tel: bypassData.phone || '',
        buyer_email: bypassData.email || '',
        payment_method: CARDNAME,
        status: 'completed',
        payment_result: {
          tid: TID,
          trandate: TRANDATE,
          returncode: RETURNCODE,
          returnmsg: RETURNMSG,
        },
      });

      // 2️⃣ 상품권 자동 발급 (중요!)
      logger.info('상품권 자동 발급 시작', { orderId: ORDERID });

      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        const giftcardResponse = await fetch(`${baseUrl}/api/giftcard`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: ORDERID,
            goodsCode: bypassData.goodsCode || '',
            count: bypassData.count || 1,
            price: parseInt(AMT),
            phone: bypassData.phone || '',
          }),
        });

        const giftcardResult = await giftcardResponse.json();

        if (giftcardResult.success) {
          logger.info('상품권 발급 성공', { orderId: ORDERID });

          // 상품권 발급 결과를 거래에 저장
          await updateTransactionStatus(ORDERID, 'completed', {
            tid: TID,
            trandate: TRANDATE,
            returncode: RETURNCODE,
            returnmsg: RETURNMSG,
            giftcard: giftcardResult.data,
          });
        } else {
          logger.error('상품권 발급 실패', { orderId: ORDERID, error: giftcardResult.error });

          // 상품권 발급 실패 기록
          await updateTransactionStatus(ORDERID, 'completed', {
            tid: TID,
            trandate: TRANDATE,
            returncode: RETURNCODE,
            returnmsg: RETURNMSG,
            giftcard_error: giftcardResult.error,
            needs_manual_processing: true,
          });
        }
      } catch (giftcardError: any) {
        logger.error('상품권 발급 오류', { orderId: ORDERID, error: giftcardError });

        // 상품권 발급 실패 기록
        await updateTransactionStatus(ORDERID, 'completed', {
          tid: TID,
          trandate: TRANDATE,
          returncode: RETURNCODE,
          returnmsg: RETURNMSG,
          giftcard_error: giftcardError.message,
          needs_manual_processing: true,
        });
      }

      return NextResponse.json({
        result: 'success',
        message: '결제 성공',
      });
    } else {
      // 결제 실패
      logger.error('결제 실패', { orderId: ORDERID, message: RETURNMSG });

      await saveTransaction({
        order_id: ORDERID,
        goods_name: GOODSNAME,
        amount: parseInt(AMT),
        buyer_name: bypassData.buyerName || '',
        buyer_tel: bypassData.phone || '',
        buyer_email: bypassData.email || '',
        payment_method: CARDNAME,
        status: 'failed',
        payment_result: {
          returncode: RETURNCODE,
          returnmsg: RETURNMSG,
        },
      });

      return NextResponse.json({
        result: 'fail',
        message: RETURNMSG,
      });
    }
  } catch (error: any) {
    logger.error('결제 통보 처리 오류', error);
    return NextResponse.json(
      { result: 'error', message: '서버 오류' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
