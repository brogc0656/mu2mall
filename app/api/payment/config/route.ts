import { NextRequest, NextResponse } from 'next/server';

/**
 * Wizzpay 설정 정보 제공 API
 * 클라이언트에서 WizzpayISP SDK를 사용하기 위한 설정값 반환
 */
export async function GET(request: NextRequest) {
  try {
    const config = {
      wizzUrl: process.env.NEXT_PUBLIC_WIZZPAY_URL,
      mid: process.env.WIZZPAY_MID,
      iv: process.env.WIZZPAY_IV_KEY,
      salt: process.env.WIZZPAY_SALT,
      password: process.env.WIZZPAY_PASSWORD,
    };

    // 모든 필수 값이 있는지 확인
    if (!config.wizzUrl || !config.mid || !config.iv || !config.salt || !config.password) {
      return NextResponse.json(
        { error: 'Wizzpay 설정이 올바르지 않습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      config: config,
    });
  } catch (error) {
    console.error('Config API 오류:', error);
    return NextResponse.json(
      { error: '설정 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
