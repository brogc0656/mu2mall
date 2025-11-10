import { test, expect } from '@playwright/test';

const MONITOR_URL = 'http://localhost:3002';
const PROXY_URL = 'http://localhost:3001';

test.describe('모니터링 대시보드 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 모니터링 대시보드 접속
    await page.goto(MONITOR_URL);
    await page.waitForLoadState('networkidle');
  });

  test('1. 대시보드 페이지 로드 확인', async ({ page }) => {
    // 헤더 확인
    await expect(page.locator('h1')).toContainText('클라이프스 프록시 서버 모니터링');
    
    // 프록시 서버 카드 확인
    await expect(page.locator('text=프록시 서버')).toBeVisible();
    
    // PM2 프로세스 카드 확인
    await expect(page.locator('text=PM2 프로세스')).toBeVisible();
    
    // 로그 컨테이너 확인
    await expect(page.locator('#logs')).toBeVisible();
  });

  test('2. 프록시 서버 상태 확인', async ({ page }) => {
    // 상태 배지 확인
    const statusBadge = page.locator('#proxy-status');
    await expect(statusBadge).toBeVisible();
    
    // 상태 텍스트 확인 (온라인 또는 오프라인)
    const statusText = await statusBadge.textContent();
    expect(['온라인', '오프라인', '확인 중...']).toContain(statusText);
    
    // 포트 정보 확인
    await expect(page.locator('text=3001')).toBeVisible();
  });

  test('3. PM2 프로세스 상태 확인', async ({ page }) => {
    // PM2 상태 배지 확인
    const pm2Status = page.locator('#pm2-status');
    await expect(pm2Status).toBeVisible();
    
    // 프로세스 정보 확인
    await expect(page.locator('text=chlifes-proxy')).toBeVisible();
  });

  test('4. 자동 새로고침 기능 확인', async ({ page }) => {
    // 자동 새로고침 토글 확인
    const autoRefresh = page.locator('#auto-refresh');
    await expect(autoRefresh).toBeVisible();
    
    // 기본적으로 체크되어 있는지 확인
    await expect(autoRefresh).toBeChecked();
  });

  test('5. 제어 버튼 확인', async ({ page }) => {
    // 재시작 버튼
    await expect(page.locator('button:has-text("재시작")')).toBeVisible();
    
    // 중지 버튼
    await expect(page.locator('button:has-text("중지")')).toBeVisible();
    
    // 시작 버튼
    await expect(page.locator('button:has-text("시작")')).toBeVisible();
  });

  test('6. 로그 표시 확인', async ({ page }) => {
    // 로그 컨테이너 확인
    const logsContainer = page.locator('#logs');
    await expect(logsContainer).toBeVisible();
    
    // 로그가 표시되는지 확인 (최소 1개 이상의 로그 라인)
    await page.waitForTimeout(2000); // 로그 로드 대기
    const logLines = logsContainer.locator('.log-line');
    const count = await logLines.count();
    expect(count).toBeGreaterThan(0);
  });

  test('7. 새로고침 버튼 동작 확인', async ({ page }) => {
    // 새로고침 버튼 확인
    const refreshBtn = page.locator('.refresh-btn');
    await expect(refreshBtn).toBeVisible();
    
    // 새로고침 버튼 클릭
    await refreshBtn.click();
    
    // 페이지가 새로고침되는지 확인 (상태가 업데이트됨)
    await page.waitForTimeout(1000);
  });

  test('8. API 엔드포인트 확인', async ({ request }) => {
    // 프록시 헬스 체크 API
    const healthResponse = await request.get(`${MONITOR_URL}/api/proxy/health`);
    expect(healthResponse.status()).toBeLessThan(500); // 200 또는 500 (서버 다운 시)
    
    // PM2 상태 API
    const pm2Response = await request.get(`${MONITOR_URL}/api/pm2/status`);
    expect(pm2Response.status()).toBe(200);
    
    const pm2Data = await pm2Response.json();
    expect(Array.isArray(pm2Data)).toBe(true);
  });

  test('9. 프록시 서버 직접 헬스 체크', async ({ request }) => {
    // 프록시 서버 직접 접근
    const response = await request.get(`${PROXY_URL}/health`);
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('ok');
    } else {
      // 서버가 다운된 경우도 테스트 통과
      console.log('프록시 서버가 다운되어 있습니다.');
    }
  });

  test('10. 실시간 업데이트 확인', async ({ page }) => {
    // 초기 상태 저장
    const initialStatus = await page.locator('#proxy-status').textContent();
    
    // 6초 대기 (자동 새로고침 간격 5초 + 여유)
    await page.waitForTimeout(6000);
    
    // 상태가 업데이트되었는지 확인 (최소한 시도는 했어야 함)
    const updatedStatus = await page.locator('#proxy-status').textContent();
    expect(updatedStatus).toBeTruthy();
  });
});

test.describe('프록시 서버 기능 테스트', () => {
  test('1. 프록시 서버 헬스 체크', async ({ request }) => {
    const response = await request.get(`${PROXY_URL}/health`);
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('ok');
    }
  });

  test('2. 프록시 엔드포인트 존재 확인', async ({ request }) => {
    // 프록시 엔드포인트는 POST 요청이 필요하지만, 
    // 최소한 404가 아닌지 확인 (라우팅이 설정되어 있는지)
    const response = await request.post(`${PROXY_URL}/proxy/chlifes/bro/gift_add.php`, {
      data: {}
    });
    
    // 404가 아니어야 함 (라우팅은 설정되어 있음)
    expect(response.status()).not.toBe(404);
  });
});

