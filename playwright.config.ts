import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* 테스트 타임아웃 (3분) */
  timeout: 180000,
  expect: {
    timeout: 5000,
  },
  /* 병렬 실행 비활성화 (순차 실행) */
  fullyParallel: false,
  /* 실패 시 재시도 */
  retries: process.env.CI ? 2 : 0,
  /* 워커 수 */
  workers: process.env.CI ? 1 : 1,
  /* 리포터 설정 */
  reporter: [
    ['html'],
    ['list'],
  ],
  /* 공유 설정 */
  use: {
    /* 기본 URL */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    /* 액션 타임아웃 */
    actionTimeout: 30000,
    /* 스크린샷 */
    screenshot: 'only-on-failure',
    /* 비디오 */
    video: 'retain-on-failure',
    /* 추적 */
    trace: 'on-first-retry',
  },

  /* 프로젝트 설정 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* 웹 서버 설정 (로컬 테스트용) */
  webServer: process.env.CI || process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});

