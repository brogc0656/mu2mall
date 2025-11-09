/**
 * app/api/giftcard/route.ts - 상품권 발급 API
 * 
 * 규격서 준수: 클라이프스 상품권 발송 연동 규격서 Ver1.0
 */
import { NextRequest, NextResponse } from 'next/server';
import { issueGiftCard, validateChlifesConfig } from '@/lib/chlifes';
import { saveTransaction, updateTransactionStatus } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { formatPhoneNumber } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // 환경 변수 검증
    if (!validateChlifesConfig()) {
      return NextResponse.json(
        { error: 'Chlifes API 설정이 올바르지 않습니다' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { orderId, phone, amount, message, validDay } = body;

    // 입력 검증
    if (!orderId || !phone || !amount) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다 (orderId, phone, amount)' },
        { status: 400 }
      );
    }

    // 전화번호 검증 및 포맷팅 (01012345678 또는 010-1234-5678)
    const phoneNumbers = phone.replace(/\D/g, '');
    if (!phoneNumbers.startsWith('010') || phoneNumbers.length !== 11) {
      return NextResponse.json(
        { error: '전화번호 형식이 올바르지 않습니다 (010으로 시작하는 11자리)' },
        { status: 400 }
      );
    }

    // 금액 검증 (1,000~1,000,000)
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum < 1000 || amountNum > 1000000) {
      return NextResponse.json(
        { error: '금액은 1,000원 ~ 1,000,000원 사이여야 합니다' },
        { status: 400 }
      );
    }

    logger.info('상품권 발급 시작', { orderId, amount: amountNum });

    // 클라이프스 API 호출 (규격서 준수)
    const result = await issueGiftCard({
      phone: phoneNumbers,  // 숫자만 전송
      amount: amountNum,
      message: message,
      validDay: validDay,
    });

    if (!result.success) {
      logger.error('상품권 발급 실패', { orderId, error: result.error, retCode: result.retCode });
      
      // 실패 기록 저장
      await updateTransactionStatus(orderId, 'failed', {
        error: result.error,
        retCode: result.retCode,
        retMesg: result.retMesg,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { 
          success: false,
          error: result.error,
          retCode: result.retCode,
        },
        { status: 500 }
      );
    }

    logger.info('상품권 발급 성공', { 
      orderId, 
      issueReqSn: result.issueReqSn,
      barcode: result.barcode ? '***' : undefined 
    });

    // 성공 기록 업데이트
    await updateTransactionStatus(orderId, 'completed', {
      issueReqSn: result.issueReqSn,
      issueAprvSn: result.issueAprvSn,
      barcode: result.barcode,
      phone: formatPhoneNumber(phoneNumbers),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: '상품권 발급 완료',
      data: {
        issueReqSn: result.issueReqSn,
        barcode: result.barcode,  // 바코드는 클라이언트에 전달 (SMS로도 발송됨)
      },
    });
  } catch (error: any) {
    logger.error('상품권 발급 API 오류', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
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
