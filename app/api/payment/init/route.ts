import { NextRequest, NextResponse } from 'next/server';
import { encryptWizzpay, createPaymentData, validateWizzpayConfig, WIZZ_CONFIG } from '@/lib/wizzpay';
import { generateOrderId } from '@/lib/utils';
import { logger } from '@/lib/logger';

/**
 * POST /api/payment/init
 * 결제 초기화 - 암호화된 결제 데이터 생성
 *
 * 보안: API 키는 서버에서만 사용, 암호화된 데이터만 클라이언트로 전송
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 환경 변수 검증
    if (!validateWizzpayConfig()) {
      logger.error('Wizzpay 설정 검증 실패');
      return NextResponse.json(
        { error: 'Wizzpay 설정이 올바르지 않습니다' },
        { status: 500 }
      );
    }

    // 2. 요청 데이터 파싱
    const body = await request.json();
    const { goodsname, amt, buyername, bypassValue } = body;

    // 3. 입력 검증
    if (!goodsname || !amt || !buyername || !bypassValue) {
      return NextResponse.json(
        { error: '필수 입력값이 누락되었습니다' },
        { status: 400 }
      );
    }

    // 상품명 길이 검증 (XSS 방어)
    if (typeof goodsname !== 'string' || goodsname.length > 100) {
      return NextResponse.json(
        { error: '상품명이 올바르지 않습니다' },
        { status: 400 }
      );
    }

    // 금액 검증
    const amountNum = Number(amt);
    if (isNaN(amountNum) || amountNum < 1000 || amountNum > 1000000) {
      return NextResponse.json(
        { error: '금액은 1,000원 ~ 1,000,000원 사이여야 합니다' },
        { status: 400 }
      );
    }

    // 구매자명 검증
    if (typeof buyername !== 'string' || buyername.length > 50) {
      return NextResponse.json(
        { error: '구매자명이 올바르지 않습니다' },
        { status: 400 }
      );
    }

    // 4. 주문 ID 생성
    const orderId = generateOrderId();

    // 4. Wizzpay 결제 데이터 생성
    const paymentData = createPaymentData({
      orderid: orderId,
      goodsname: goodsname,
      amt: amt.toString(),
      buyername: buyername,
      buyertel: '', // 클라이언트에서 입력받은 값은 BYPASSVALUE로 전달
      buyeremail: '',
      bypassvalue: bypassValue,
    });

    // 5. 데이터 암호화
    const dataString = JSON.stringify(paymentData);
    const encryptedData = encryptWizzpay(dataString);

    logger.info('결제 초기화 성공', { orderId, amount: amt });

    // 6. 암호화된 데이터와 MID만 클라이언트로 전송
    return NextResponse.json({
      success: true,
      transactionId: orderId,
      wizzUrl: WIZZ_CONFIG.WIZZ_URL,
      mid: WIZZ_CONFIG.MID,
      data: encryptedData,
    });
  } catch (error: any) {
    logger.error('결제 초기화 오류', error);
    return NextResponse.json(
      { error: error.message || '결제 초기화 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
