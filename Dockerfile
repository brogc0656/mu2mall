# 클라이프스 프록시 서버 Docker 이미지
FROM node:18-alpine

WORKDIR /app

# 의존성 설치
COPY package.json package-lock.json* ./
RUN npm install express cors

# 프록시 서버 코드 복사
COPY proxy-server.js .

# 포트 노출
EXPOSE 3001

# 헬스 체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 서버 실행
CMD ["node", "proxy-server.js"]

