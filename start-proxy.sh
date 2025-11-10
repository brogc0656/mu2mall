#!/bin/bash

# 클라이프스 프록시 서버 시작 스크립트

echo "=========================================="
echo "🚀 클라이프스 프록시 서버 시작"
echo "=========================================="

cd /Users/hasanghyeon/brother_site/muyi-giftcard

# 의존성 확인
if [ ! -d "node_modules/express" ]; then
  echo "📦 의존성 설치 중..."
  npm install express cors
fi

# 프록시 서버 시작
echo "🔧 프록시 서버 시작 중..."
node proxy-server.js &
PROXY_PID=$!

echo "✅ 프록시 서버 시작됨 (PID: $PROXY_PID)"
echo "📍 로컬 주소: http://localhost:3001"
echo ""

# Cloudflare Tunnel 시작 (선택사항)
if command -v cloudflared &> /dev/null; then
  echo "🌐 Cloudflare Tunnel 시작 중..."
  echo "⚠️  URL이 표시되면 Vercel 환경 변수에 설정하세요"
  echo ""
  cloudflared tunnel run chlifes-proxy --url http://localhost:3001
else
  echo "⚠️  Cloudflare Tunnel이 설치되지 않았습니다."
  echo "   설치: brew install cloudflared"
  echo ""
  echo "또는 ngrok 사용:"
  echo "   ngrok http 3001"
  echo ""
  wait $PROXY_PID
fi

