#!/bin/bash

# Vercel 환경 변수 설정 스크립트 (개발 환경)
# 실행: bash setup-vercel-env.sh

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Vercel 개발 환경 변수 설정"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Vercel CLI 설치 확인
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI가 설치되어 있지 않습니다."
    echo "설치: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI 확인됨"
echo ""

# 로그인 확인
echo "🔐 Vercel 로그인 확인 중..."
vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "로그인이 필요합니다."
    vercel login
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 개발 환경 변수 설정 시작"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 위즈페이 테스트 설정
echo "1️⃣ 위즈페이 테스트 서버 URL..."
vercel env add NEXT_PUBLIC_WIZZPAY_URL production preview development <<< "https://pgadmin.wizzpay.co.kr"

echo "2️⃣ 위즈페이 테스트 MID..."
vercel env add WIZZPAY_MID production preview development <<< "isptest03m"

echo "3️⃣ 위즈페이 IV_KEY..."
vercel env add WIZZPAY_IV_KEY production preview development <<< "7e74bfa70c4a79d827b500ab9a287d63"

echo "4️⃣ 위즈페이 SALT..."
vercel env add WIZZPAY_SALT production preview development <<< "f8eb4a8a6873ba15e86668f1a17c0642"

echo "5️⃣ 위즈페이 PASSWORD..."
vercel env add WIZZPAY_PASSWORD production preview development <<< "1733"

# 앱 설정
echo "6️⃣ 앱 URL..."
vercel env add NEXT_PUBLIC_APP_URL production preview development <<< "https://muyi-giftcard.vercel.app"

echo "7️⃣ Base URL..."
vercel env add NEXT_PUBLIC_BASE_URL production preview development <<< "https://muyi-giftcard.vercel.app"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 개발 환경 변수 설정 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 설정된 환경 변수 목록:"
vercel env ls
echo ""
echo "💡 다음 단계:"
echo "1. git push하여 Vercel 자동 배포"
echo "2. 또는 'vercel --prod'로 수동 배포"
echo "3. 배포 완료 후 https://muyi-giftcard.vercel.app 테스트"
echo ""
echo "⚠️  주의: 이것은 테스트 환경입니다. 실제 결제는 발생하지 않습니다."
echo ""
