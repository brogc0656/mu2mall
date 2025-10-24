// 상품권 타입
export interface GiftCard {
  id: string;
  name: string;
  brand: string;
  image: string;
  amounts: number[]; // 사용 가능한 금액 옵션
  description: string;
}

// 주문 정보
export interface Order {
  giftCardId: string;
  amount: number;
  phone: string;
  message?: string;
  issueReqSn?: string;
  issueAprvSn?: string;
  barcode?: string;
  status: 'pending' | 'issued' | 'sent' | 'cancelled';
  createdAt: Date;
}

// 클라이프스 API 응답
export interface ChlifesResponse {
  RET_CODE: string;
  ISSUE_STATUS?: string;
  ISSUE_APRV_SN?: string;
  BARCODE?: string;
  VALID_START_DATE?: string;
  VALID_END_DATE?: string;
  [key: string]: any;
}
