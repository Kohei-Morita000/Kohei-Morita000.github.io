import { defineConfig } from '@playwright/test';

const baseURL=process.env.OFFLINE_BASE_URL?.trim()||'https://allsunday1122.github.io/kyokai-yawa/';

export default defineConfig({
  testDir:'./tests',
  testMatch:'offline-pwa.spec.mjs',
  timeout:60_000,
  expect:{timeout:12_000},
  fullyParallel:false,
  forbidOnly:Boolean(process.env.CI),
  retries:process.env.CI?1:0,
  workers:1,
  outputDir:'test-results-offline',
  reporter:[
    ['line'],
    ['html',{open:'never',outputFolder:'playwright-report-offline'}],
    ['./scripts/offline-browser-reporter.mjs'],
  ],
  use:{
    baseURL,
    serviceWorkers:'allow',
    trace:'retain-on-failure',
    screenshot:'only-on-failure',
    video:'retain-on-failure',
    navigationTimeout:25_000,
    actionTimeout:12_000,
  },
  projects:[
    {
      name:'chromium-desktop',
      use:{browserName:'chromium',viewport:{width:1440,height:1000}},
    },
    {
      name:'webkit-mobile',
      use:{
        browserName:'webkit',
        viewport:{width:393,height:852},
        isMobile:true,
        hasTouch:true,
        userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
      },
    },
  ],
});
