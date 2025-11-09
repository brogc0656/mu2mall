// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '무이상품권 - 모바일 상품권 간편 구매',
  description: '신세계, GS25, 스타벅스 등 다양한 상품권을 간편하게 구매하세요',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
