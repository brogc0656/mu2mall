/**
 * 클라이프스 프로덕션 API 프록시 서버
 * 로컬 컴퓨터에서 실행하여 고정 IP로 클라이프스 API 호출
 */

const express = require('express');
const cors = require('cors');
const app = express();

// CORS 설정 (Vercel에서 호출 허용)
app.use(cors({
  origin: [
    'https://muyi-giftcard.vercel.app',
    'https://*.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json());

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    publicIp: process.env.PUBLIC_IP || '확인 필요'
  });
});

// 클라이프스 API 프록시 (모든 경로 지원)
app.use('/proxy/chlifes', async (req, res) => {
  const path = req.path.replace('/proxy/chlifes', '') || req.url.replace('/proxy/chlifes', '');
  const url = `https://api.chlifes.co.kr${path}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
  
  console.log(`[${new Date().toISOString()}] Proxy ${req.method}: ${path}`);
  if (req.method === 'POST') {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  
  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    };
    
    if (req.method === 'POST' || req.method === 'PUT') {
      fetchOptions.body = JSON.stringify(req.body);
    }
    
    const response = await fetch(url, fetchOptions);
    const data = await response.json();
    
    console.log(`[${new Date().toISOString()}] Response:`, response.status, JSON.stringify(data, null, 2));
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Proxy error:`, error);
    res.status(500).json({ 
      error: error.message,
      retCode: '999999',
      retMesg: '프록시 서버 오류'
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('🚀 클라이프스 프록시 서버 시작');
  console.log('='.repeat(60));
  console.log(`포트: ${PORT}`);
  console.log(`로컬 접속: http://localhost:${PORT}`);
  console.log(`헬스 체크: http://localhost:${PORT}/health`);
  console.log(`프록시 엔드포인트: http://localhost:${PORT}/proxy/chlifes/*`);
  console.log('='.repeat(60));
  console.log('⚠️  Cloudflare Tunnel 또는 ngrok으로 외부 노출 필요');
  console.log('='.repeat(60));
});

