# AWS 프록시 서버 구성 방안

**일시**: 2025-11-09  
**목적**: 클라이프스 프로덕션 API IP 화이트리스트 문제 해결  
**방안**: AWS EC2 프록시 서버 구축

---

## 💰 비용 분석

### AWS EC2 (프리티어 가능)

#### 옵션 1: t2.micro (프리티어)
- **비용**: 무료 (12개월 프리티어)
- **사양**: 1 vCPU, 1GB RAM
- **대역폭**: 낮음-보통
- **적합성**: ✅ 테스트/소규모 트래픽에 적합

#### 옵션 2: t3.micro (프리티어 후)
- **비용**: 약 $7-10/월
- **사양**: 2 vCPU, 1GB RAM
- **대역폭**: 보통
- **적합성**: ✅ 소규모 프로덕션에 적합

#### 옵션 3: t3.small
- **비용**: 약 $15-20/월
- **사양**: 2 vCPU, 2GB RAM
- **대역폭**: 높음
- **적합성**: ⚠️ 중규모 트래픽

**추가 비용**:
- Elastic IP: 무료 (인스턴스에 연결된 경우)
- 데이터 전송: 첫 1GB 무료, 이후 $0.09/GB
- 스토리지: EBS 30GB 무료 (프리티어)

**예상 월 비용**:
- 프리티어 기간: **$0/월**
- 프리티어 후: **$7-15/월** (소규모)

---

## 🏗️ 아키텍처

```
[사용자]
    ↓
[Vercel (muyi-giftcard.vercel.app)]
    ↓
[AWS EC2 프록시 서버 (고정 IP)]
    ↓
[클라이프스 프로덕션 API (api.chlifes.co.kr)]
```

---

## 📋 구현 단계

### 1. AWS EC2 인스턴스 생성

```bash
# 1. EC2 인스턴스 생성
# - AMI: Amazon Linux 2023
# - 인스턴스 타입: t2.micro (프리티어)
# - 스토리지: 20GB
# - 보안 그룹: HTTP(80), HTTPS(443) 허용

# 2. Elastic IP 할당
# - EC2 콘솔 → Elastic IPs → Allocate
# - 인스턴스에 연결
```

### 2. Node.js 프록시 서버 구축

```javascript
// proxy-server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// 클라이프스 API 프록시
app.post('/proxy/chlifes/*', async (req, res) => {
  const path = req.path.replace('/proxy/chlifes', '');
  const url = `https://api.chlifes.co.kr${path}`;
  
  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...req.headers,
      },
      body: JSON.stringify(req.body),
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
```

### 3. PM2로 프로세스 관리

```bash
# PM2 설치
npm install -g pm2

# 서버 시작
pm2 start proxy-server.js --name chlifes-proxy

# 자동 시작 설정
pm2 startup
pm2 save
```

### 4. Nginx 리버스 프록시 (선택사항)

```nginx
# /etc/nginx/conf.d/chlifes-proxy.conf
server {
    listen 80;
    server_name your-proxy-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 🔧 Vercel에서 프록시 사용

### lib/chlifes.ts 수정

```typescript
const CHLIFES_CONFIG = {
  // 프로덕션에서는 프록시 서버 사용
  API_URL: process.env.NODE_ENV === 'production' && process.env.CHLIFES_PROXY_URL
    ? process.env.CHLIFES_PROXY_URL  // 예: https://your-proxy-domain.com/proxy/chlifes
    : process.env.NEXT_PUBLIC_CHLIFES_URL,  // 개발 환경
  // ...
};
```

---

## ✅ 장점

1. **고정 IP 보장**: Elastic IP로 항상 동일한 IP 사용
2. **완전한 제어**: 서버 로그, 모니터링, 디버깅 가능
3. **비용 효율적**: 프리티어로 시작 가능
4. **확장 가능**: 트래픽 증가 시 인스턴스 업그레이드 가능

---

## ⚠️ 단점

1. **추가 인프라 관리**: 서버 유지보수 필요
2. **단일 장애점**: 프록시 서버 장애 시 전체 영향
3. **보안 관리**: 서버 보안 패치, 방화벽 설정 필요
4. **모니터링 필요**: 서버 상태, 로그 확인 필요

---

## 🆚 대안 비교

### AWS EC2 vs 다른 옵션

| 옵션 | 비용 | 복잡도 | 고정 IP | 추천도 |
|------|------|--------|---------|--------|
| **AWS EC2** | $0-15/월 | 중간 | ✅ | ⭐⭐⭐⭐ |
| **Google Cloud Run** | $0-10/월 | 낮음 | ❌ | ⭐⭐ |
| **Railway** | $5-20/월 | 낮음 | ❌ | ⭐⭐ |
| **Render** | $7-25/월 | 낮음 | ❌ | ⭐⭐ |
| **클라이프스 협의** | $0 | 낮음 | N/A | ⭐⭐⭐⭐⭐ |

---

## 🎯 권장 사항

### 단계별 접근

#### 1단계: 클라이프스 협의 (최우선) ⭐⭐⭐⭐⭐
- **비용**: $0
- **복잡도**: 낮음
- **시간**: 1-2일
- **방법**: Vercel IP 범위 등록 요청 또는 대체 인증 방식

#### 2단계: AWS EC2 프록시 (협의 불가 시) ⭐⭐⭐⭐
- **비용**: $0-15/월
- **복잡도**: 중간
- **시간**: 2-3일
- **조건**: 클라이프스 협의가 불가능한 경우

#### 3단계: 다른 클라우드 서비스 (대안)
- **비용**: $5-25/월
- **복잡도**: 낮음-중간
- **시간**: 1-2일

---

## 📋 AWS 구축 체크리스트

### 필수 작업
- [ ] AWS 계정 생성
- [ ] EC2 인스턴스 생성 (t2.micro)
- [ ] Elastic IP 할당 및 연결
- [ ] 보안 그룹 설정 (HTTP/HTTPS)
- [ ] Node.js 설치
- [ ] 프록시 서버 코드 배포
- [ ] PM2로 프로세스 관리
- [ ] 클라이프스에 Elastic IP 등록 요청
- [ ] Vercel 환경 변수 설정
- [ ] 테스트 및 모니터링

### 선택 작업
- [ ] 도메인 연결 (예: proxy.yourdomain.com)
- [ ] SSL 인증서 설정 (Let's Encrypt)
- [ ] Nginx 리버스 프록시
- [ ] CloudWatch 모니터링
- [ ] 자동 백업 설정

---

## 💡 최종 추천

### 우선순위 1: 클라이프스 협의
**이유**: 비용 없음, 복잡도 낮음, 가장 간단

### 우선순위 2: AWS EC2 프록시
**이유**: 
- ✅ 프리티어로 시작 가능
- ✅ 고정 IP 보장
- ✅ 확장 가능
- ✅ 완전한 제어

**조건**: 클라이프스 협의가 불가능한 경우

---

## 🚀 빠른 시작 가이드

### AWS EC2 프록시 서버 구축 (30분)

```bash
# 1. EC2 인스턴스 생성
# AWS 콘솔 → EC2 → Launch Instance
# - AMI: Amazon Linux 2023
# - Instance: t2.micro
# - Security Group: HTTP(80), HTTPS(443), SSH(22)

# 2. Elastic IP 할당
# EC2 → Elastic IPs → Allocate → Associate

# 3. SSH 접속
ssh -i your-key.pem ec2-user@your-elastic-ip

# 4. Node.js 설치
sudo yum update -y
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 5. 프록시 서버 배포
mkdir chlifes-proxy
cd chlifes-proxy
npm init -y
npm install express cors
# proxy-server.js 파일 생성
pm2 start proxy-server.js --name chlifes-proxy
pm2 startup
pm2 save

# 6. 클라이프스에 Elastic IP 등록 요청
```

---

**결론**: 클라이프스 협의를 먼저 시도하고, 불가능한 경우 AWS EC2 프록시 서버 구축을 권장합니다.

**마지막 업데이트**: 2025-11-09

