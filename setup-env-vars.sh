#!/bin/bash

# Vercel 환경 변수 설정 (개발 연동 테스트)

echo "1️⃣ NEXT_PUBLIC_WIZZPAY_URL 설정 중..."
echo "https://pgadmin.wizzpay.co.kr" | vercel env add NEXT_PUBLIC_WIZZPAY_URL production preview development

echo ""
echo "2️⃣ WIZZPAY_MID 설정 중..."
echo "isptest03m" | vercel env add WIZZPAY_MID production preview development

echo ""
echo "3️⃣ WIZZPAY_IV_KEY 설정 중..."
echo "7e74bfa70c4a79d827b500ab9a287d63" | vercel env add WIZZPAY_IV_KEY production preview development

echo ""
echo "4️⃣ WIZZPAY_SALT 설정 중..."
echo "f8eb4a8a6873ba15e86668f1a17c0642" | vercel env add WIZZPAY_SALT production preview development

echo ""
echo "5️⃣ WIZZPAY_PASSWORD 설정 중..."
echo "1733" | vercel env add WIZZPAY_PASSWORD production preview development

echo ""
echo "6️⃣ NEXT_PUBLIC_APP_URL 설정 중..."
echo "https://muyi-giftcard.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production preview development

echo ""
echo "7️⃣ NEXT_PUBLIC_BASE_URL 설정 중..."
echo "https://muyi-giftcard.vercel.app" | vercel env add NEXT_PUBLIC_BASE_URL production preview development

echo ""
echo "✅ 환경 변수 설정 완료!"
