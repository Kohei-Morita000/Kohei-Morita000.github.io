import { test, expect } from '@playwright/test';

const STORY_ID='MKB-001';
const STORY_FILE='mkb-001-taikin-kiroku-2514.html';
const STORY_PATH=`stories/${STORY_FILE}`;
const READ_KEY='kyokai-yawa-read-stories-v1';
const HISTORY_KEY='kyokai-yawa-reading-history-v1';
const SAVED_KEY='kyokai-yawa-saved-stories-v1';
const POSITION_KEY=`kyokai-yawa-reader-position:/kyokai-yawa/stories/${STORY_FILE}`;

async function seedStorage(page,entries={}){
  await page.addInitScript(({entries})=>{
    if(sessionStorage.getItem('__kyokai_reading_state_seeded'))return;
    localStorage.clear();
    for(const [key,value] of Object.entries(entries))localStorage.setItem(key,value);
    sessionStorage.setItem('__kyokai_reading_state_seeded','1');
  },{entries});
}

async function openStory(page,path=STORY_PATH){
  await page.goto(path);
  await expect(page.locator('article#story')).toBeVisible();
  await expect(page.locator('[data-reading-completion]')).toBeVisible();
  await expect(page.locator('[data-reader-tools]')).toBeVisible();
}

async function storageValue(page,key){
  return page.evaluate(key=>localStorage.getItem(key),key);
}

async function scrollArticleTo(page,ratio){
  await page.evaluate(ratio=>{
    const article=document.querySelector('article#story');
    if(!article)throw new Error('article#story not found');
    const top=article.getBoundingClientRect().top+scrollY;
    const start=Math.max(0,top-innerHeight*0.18);
    const end=Math.max(start+1,top+article.offsetHeight-innerHeight*0.62);
    scrollTo({top:start+(end-start)*ratio,behavior:'auto'});
    dispatchEvent(new Event('scroll'));
  },ratio);
}

test('作品ページの読了とあとで読むを切り替え、読書記録へ即時反映する',async({page})=>{
  await seedStorage(page);
  await openStory(page);

  const readButton=page.locator('[data-toggle-read]');
  const saveButton=page.locator('[data-toggle-saved]');
  await readButton.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);

  // モバイルでは操作欄を表示するスクロールだけで自動読了するため、
  // 手動切替試験の開始状態をボタン操作で未読へ統一する。
  if((await readButton.textContent())?.trim()==='未読に戻す'){
    await readButton.click();
    await expect(readButton).toHaveText('読了済みにする');
  }
  await expect(readButton).toHaveText('読了済みにする');
  await expect(saveButton).toHaveText('あとで読むに保存');

  await readButton.click();
  await expect(readButton).toHaveText('未読に戻す');
  await expect(page.locator('[data-reading-story-state]')).toContainText('読了済み');
  const readIds=JSON.parse(await storageValue(page,READ_KEY));
  expect(readIds).toContain(STORY_ID);
  const history=JSON.parse(await storageValue(page,HISTORY_KEY));
  expect(Number(history.visits[STORY_ID])).toBeGreaterThan(0);
  expect(Number(history.completions[STORY_ID])).toBeGreaterThan(0);

  await saveButton.click();
  await expect(saveButton).toHaveText('あとで読むから外す');
  const saved=JSON.parse(await storageValue(page,SAVED_KEY));
  expect(saved.ids).toContain(STORY_ID);
  expect(Number(saved.savedAt[STORY_ID])).toBeGreaterThan(0);

  await page.goto('reading-log.html');
  await expect(page.locator('[data-reading-log-grid] .log-card')).toHaveCount(48);
  await expect(page.locator('[data-count-read]')).toHaveText('1話');
  await expect(page.locator('[data-count-saved]')).toHaveText('1話');
  const card=page.locator(`[data-log-id="${STORY_ID}"]`);
  await expect(card.locator('.log-card__state')).toHaveText('読了済み');

  await card.locator(`[data-log-read="${STORY_ID}"]`).click();
  await expect(page.locator('[data-count-read]')).toHaveText('0話');
  await card.locator(`[data-log-save="${STORY_ID}"]`).click();
  await expect(page.locator('[data-count-saved]')).toHaveText('0話');
  expect(JSON.parse(await storageValue(page,READ_KEY))).not.toContain(STORY_ID);
  expect(JSON.parse(await storageValue(page,SAVED_KEY)).ids).not.toContain(STORY_ID);
});

test('途中位置を保存し、ボタンとresume=1の両方から再開する',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await seedStorage(page);
  await openStory(page);
  await scrollArticleTo(page,0.52);

  await expect.poll(async()=>Number.parseFloat(await storageValue(page,POSITION_KEY)||'0')).toBeGreaterThan(0.08);
  const savedRatio=Number.parseFloat(await storageValue(page,POSITION_KEY));
  expect(savedRatio).toBeLessThan(0.93);

  await page.reload();
  const resumeButton=page.locator('.reader-resume-button');
  await expect(resumeButton).toBeVisible();
  await expect(resumeButton).toContainText(`${Math.round(savedRatio*100)}%`);
  await resumeButton.click();
  await expect(resumeButton).toBeHidden();
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(100);
  await expect(page.locator('.reader-progress-text')).not.toHaveText('本文 0%');

  await page.goto(`${STORY_PATH}?resume=1`);
  await expect.poll(()=>new URL(page.url()).searchParams.has('resume')).toBe(false);
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(100);
  await expect(page.locator('.reader-progress-text')).not.toHaveText('本文 0%');

  await page.goto('reading-log.html');
  await expect(page.locator('[data-count-progress]')).toHaveText('1話');
  const card=page.locator(`[data-log-id="${STORY_ID}"]`);
  await expect(card.locator('.log-card__state')).toContainText('途中');
  await expect(card.locator('a.primary')).toHaveText('続きから読む');
  await expect(card.locator('a.primary')).toHaveAttribute('href',new RegExp(`/${STORY_FILE.replaceAll('.','\\.')}\\?resume=1#story$`));
});

test('本文末尾で自動読了し、途中位置を削除して次の未読作品へ進める',async({page})=>{
  await seedStorage(page);
  await openStory(page);
  await scrollArticleTo(page,1);

  await expect(page.locator('[data-toggle-read]')).toHaveText('未読に戻す');
  expect(JSON.parse(await storageValue(page,READ_KEY))).toContain(STORY_ID);
  expect(await storageValue(page,POSITION_KEY)).toBeNull();

  const next=page.locator('[data-story-next-unread]');
  await expect(next).toBeVisible();
  await expect(next).toContainText('宅配ボックス13');
  await expect(next).toHaveAttribute('href','/kyokai-yawa/stories/mkb-002-takuhai-box-13.html');
  await next.click();
  await expect(page).toHaveURL(/\/kyokai-yawa\/stories\/mkb-002-takuhai-box-13\.html$/);
  await expect(page.locator('body')).toHaveAttribute('data-story-id','MKB-002');
});
