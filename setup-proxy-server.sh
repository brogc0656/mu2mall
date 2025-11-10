#!/bin/bash
# 클라이프스 프록시 서버 자동 설정 스크립트

set -e

echo "=========================================="
echo "🚀 클라이프스 프록시 서버 설정 시작"
echo "=========================================="

cd /Users/hasanghyeon/brother_site/muyi-giftcard

# 1. 의존성 확인 및 설치
echo ""
echo "📦 의존성 확인 중..."
if [ ! -d "node_modules/express" ]; then
  echo "   express, cors 설치 중..."
  npm install express cors
else
  echo "   ✅ 의존성 이미 설치됨"
fi

# 2. PM2 설치 확인
echo ""
echo "🔧 PM2 확인 중..."
if ! command -v pm2 &> /dev/null; then
  echo "   PM2 설치 중..."
  npm install -g pm2
else
  echo "   ✅ PM2 이미 설치됨"
fi

# 3. 로그 디렉토리 생성
echo ""
echo "📁 로그 디렉토리 생성 중..."
mkdir -p logs

# 4. 기존 프로세스 중지 (있는 경우)
echo ""
echo "🛑 기존 프로세스 확인 중..."
pm2 delete chlifes-proxy 2>/dev/null || echo "   기존 프로세스 없음"
pm2 delete chlifes-tunnel 2>/dev/null || echo "   기존 터널 없음"

# 5. 프록시 서버 시작
echo ""
echo "🚀 프록시 서버 시작 중..."
pm2 start proxy-server.js --name chlifes-proxy --log logs/proxy-server.log --error logs/proxy-server-error.log

# 6. Cloudflare Tunnel 확인
echo ""
echo "🌐 Cloudflare Tunnel 확인 중..."
if command -v cloudflared &> /dev/null; then
  echo "   Cloudflare Tunnel 시작 중..."
  echo "   ⚠️  최초 실행 시 로그인 및 터널 생성 필요:"
  echo "      cloudflared tunnel login"
  echo "      cloudflared tunnel create chlifes-proxy"
  echo ""
  
  # 터널이 이미 생성되어 있는지 확인
  if [ -d "$HOME/.cloudflared" ]; then
    pm2 start --name chlifes-tunnel --log logs/tunnel.log --error logs/tunnel-error.log -- \
      cloudflared tunnel run chlifes-proxy --url http://localhost:3001
    echo "   ✅ Cloudflare Tunnel 시작됨"
  else
    echo "   ⚠️  Cloudflare Tunnel 설정 필요"
    echo "      다음 명령어 실행:"
    echo "      cloudflared tunnel login"
    echo "      cloudflared tunnel create chlifes-proxy"
  fi
else
  echo "   ⚠️  Cloudflare Tunnel 미설치"
  echo "      설치: brew install cloudflared"
fi

# 7. 자동 시작 설정
echo ""
echo "⚙️  자동 시작 설정 중..."
STARTUP_CMD=$(pm2 startup | grep -v "PM2" | grep -v "command" | tail -1)
if [ ! -z "$STARTUP_CMD" ]; then
  echo "   다음 명령어를 실행하세요:"
  echo "   $STARTUP_CMD"
else
  echo "   ✅ 자동 시작 이미 설정됨"
fi

# 8. 현재 설정 저장
pm2 save

# 9. 상태 확인
echo ""
echo "=========================================="
echo "✅ 설정 완료!"
echo "=========================================="
echo ""
echo "📊 현재 상태:"
pm2 status
echo ""
echo "📍 프록시 서버: http://localhost:3001"
echo "🔍 헬스 체크: http://localhost:3001/health"
echo ""
echo "📝 유용한 명령어:"
echo "   pm2 status          - 상태 확인"
echo "   pm2 logs            - 로그 확인"
echo "   pm2 restart all     - 모두 재시작"
echo "   pm2 monit           - 모니터링"
echo ""
echo "🌐 Cloudflare Tunnel URL 확인:"
echo "   pm2 logs chlifes-tunnel | grep -i 'trycloudflare'"
echo ""

