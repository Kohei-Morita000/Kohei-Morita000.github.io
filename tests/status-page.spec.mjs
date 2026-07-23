import { test, expect } from '@playwright/test';

test('運用状況ページが最新4監査を正常表示する',async({page})=>{
  const historyResponse=page.waitForResponse(response=>response.url().includes('/reports/public-monitoring-history.json')&&response.request().method()==='GET');
  const response=await page.goto('status.html');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle('運用状況｜境界夜話');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex,follow');
  const history=await historyResponse;
  expect(history.status()).toBe(200);
  const data=await history.json();
  expect(data.version).toBe(1);
  expect(Array.isArray(data.entries)).toBeTruthy();
  const kinds=new Set(data.entries.map(entry=>entry.kind));
  expect([...kinds].sort()).toEqual(['incident-config','offline','reading','site-health']);
  await expect(page.locator('[data-status-grid] .status-card')).toHaveCount(4);
  await expect(page.locator('[data-status-overall]')).toHaveText('正常');
  await expect(page.locator('[data-status-message]')).toContainText('すべての公開監査が正常');
  await expect(page.locator('[data-status-updated]')).not.toHaveText('確認中');
  await expect(page.locator('[data-status-grid] .state-pill[data-state="passed"]')).toHaveCount(4);
  expect(await page.locator('[data-status-history] tr').count()).toBeGreaterThanOrEqual(4);
});

test('主要ページから運用状況へ移動できる',async({page})=>{
  for(const path of ['', 'reading-log.html', 'stories/mkb-001-taikin-kiroku-2514.html']){
    const response=await page.goto(path);
    expect(response?.status()).toBe(200);
    const link=page.locator('a[href="/kyokai-yawa/status.html"]');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveText('運用状況');
  }
});

test('モバイル幅で運用状況が横にはみ出さない',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='webkit-mobile','モバイルWebKit専用');
  await page.goto('status.html');
  await expect(page.locator('[data-status-grid] .status-card')).toHaveCount(4);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const overall=await page.locator('.overall-card').boundingBox();
  expect(overall?.width||0).toBeLessThanOrEqual(393);
});