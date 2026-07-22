import { defineConfig } from '@playwright/test';

const publicBaseURL=process.env.PLAYWRIGHT_BASE_URL?.trim();
const baseURL=publicBaseURL||'http://127.0.0.1:4173/kyokai-yawa/';
const webServer=publicBaseURL?undefined:{
  command:'node scripts/serve-playwright.mjs',
  url:baseURL,
  reuseExistingServer:!process.env.CI,
  timeout:120_000,
};
const siteHealthMode=Boolean(process.env.SITE_HEALTH_REPORT?.trim());
const reporter=siteHealthMode?[
  ['line'],
  ['html',{open:'never',outputFolder:'playwright-report'}],
  ['./scripts/site-health-reporter.mjs'],
]:[
  ['line'],
  ['html',{open:'never',outputFolder:'playwright-report'}],
  ['./scripts/reading-browser-reporter.mjs'],
];

export default defineConfig({
  testDir:'./tests',
  timeout:30_000,
  expect:{timeout:7_000},
  fullyParallel:false,
  forbidOnly:Boolean(process.env.CI),
  retries:process.env.CI?1:0,
  workers:process.env.CI?1:undefined,
  outputDir:'test-results',
  reporter,
  use:{
    baseURL,
    serviceWorkers:'block',
    trace:'retain-on-failure',
    screenshot:'only-on-failure',
    video:'retain-on-failure',
  },
  webServer,
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
