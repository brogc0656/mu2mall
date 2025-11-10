/**
 * 클라이프스 프록시 서버 모니터링 대시보드
 * 웹 브라우저에서 시각적으로 모니터링 가능
 */

const express = require('express');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
const PORT = 3002;

app.use(express.static('public'));

// PM2 상태 API
app.get('/api/pm2/status', async (req, res) => {
  try {
    const { stdout } = await execPromise('pm2 jlist');
    const processes = JSON.parse(stdout);
    res.json(processes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 프록시 서버 헬스 체크
app.get('/api/proxy/health', async (req, res) => {
  try {
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: '프록시 서버 연결 실패' });
  }
});

// PM2 로그 API
app.get('/api/pm2/logs/:name', async (req, res) => {
  try {
    const { stdout } = await execPromise(`pm2 logs ${req.params.name} --lines 50 --nostream`);
    res.json({ logs: stdout });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PM2 재시작
app.post('/api/pm2/restart/:name', async (req, res) => {
  try {
    await execPromise(`pm2 restart ${req.params.name}`);
    res.json({ success: true, message: `${req.params.name} 재시작됨` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PM2 중지
app.post('/api/pm2/stop/:name', async (req, res) => {
  try {
    await execPromise(`pm2 stop ${req.params.name}`);
    res.json({ success: true, message: `${req.params.name} 중지됨` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PM2 시작
app.post('/api/pm2/start/:name', async (req, res) => {
  try {
    await execPromise(`pm2 start ${req.params.name}`);
    res.json({ success: true, message: `${req.params.name} 시작됨` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('📊 모니터링 대시보드 시작');
  console.log('='.repeat(60));
  console.log(`📍 주소: http://localhost:${PORT}`);
  console.log('='.repeat(60));
  console.log('💡 브라우저에서 위 주소로 접속하세요!');
  console.log('='.repeat(60));
});

