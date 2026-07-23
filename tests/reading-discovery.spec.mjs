import { test, expect } from '@playwright/test';

const READ_KEY='kyokai-yawa-read-stories-v1';
const HISTORY_KEY='kyokai-yawa-reading-history-v1';
const SAVED_KEY='kyokai-yawa-saved-stories-v1';
const POSITION_PREFIX='kyokai-yawa-reader-position:';
const positionKey=file=>`${POSITION_PREFIX}/kyokai-yawa/stories/${file}`;

async function seedStorage(page,entries={}){
  await page.addInitScript(({entries})=>{
    localStorage.clear();
    for(const [key,value] of Object.entries(entries))localStorage.setItem(key,value);
  },{entries});
}

async function visibleIds(page,selector,idAttribute){
  return page.locator(selector).evaluateAll((cards,idAttribute)=>cards.filter(card=>!card.hidden).map(card=>card.dataset[idAttribute]),idAttribute);
}

test('トップページで検索条件・読了・保存・並べ替えを組み合わせ、URLと表示件数を同期する',async({page})=>{
  const now=Date.now()-60_000;
  await seedStorage(page,{
    [READ_KEY]:JSON.stringify(['MKB-001']),
    [HISTORY_KEY]:JSON.stringify({visits:{'MKB-001':now},completions:{'MKB-001':now+1000}}),
    [SAVED_KEY]:JSON.stringify({ids:['MKB-007'],savedAt:{'MKB-007':now+2000}}),
  });

  await page.goto('?pick=quick&read=unread&saved=saved&sort=short#works');
  await expect(page.getByLabel('作品検索')).toBeVisible();
  await expect(page.getByLabel('読み方で絞り込み')).toHaveValue('quick');
  await expect(page.getByLabel('読了状態で絞り込み')).toHaveValue('unread');
  await expect(page.getByLabel('あとで読むの保存状態で絞り込み')).toHaveValue('saved');
  await expect(page.getByLabel('作品の並べ替え')).toHaveValue('short');
  await expect(page.locator('.archive-result')).toContainText('1話を表示中（全48話）');
  expect(await visibleIds(page,'.work-card','workId')).toEqual(['MKB-007']);

  const url=new URL(page.url());
  expect(url.searchParams.get('pick')).toBe('quick');
  expect(url.searchParams.get('read')).toBe('unread');
  expect(url.searchParams.get('saved')).toBe('saved');
  expect(url.searchParams.get('sort')).toBe('short');

  await page.getByRole('button',{name:'条件をリセット'}).click();
  await expect(page.locator('.archive-result')).toContainText('48話を表示中（全48話）');
  await expect(page.locator('.work-card:not([hidden])')).toHaveCount(48);
  const resetUrl=new URL(page.url());
  for(const key of ['pick','read','saved','sort','q','series'])expect(resetUrl.searchParams.has(key)).toBe(false);
});

test('シリーズページで検索・保存絞り込みを適用し、条件内の次の未読作品へ移動する',async({page})=>{
  const now=Date.now()-90_000;
  await seedStorage(page,{
    [READ_KEY]:JSON.stringify(['MKB-001']),
    [HISTORY_KEY]:JSON.stringify({visits:{'MKB-001':now},completions:{'MKB-001':now+1000}}),
    [SAVED_KEY]:JSON.stringify({ids:['MKB-007'],savedAt:{'MKB-007':now+2000}}),
  });

  await page.goto('series/makabe.html?q=音声案内&read=unread&saved=saved&sort=short');
  await expect.poll(()=>page.evaluate(()=>Boolean(window.KYOKAI_WORKS?.length&&window.KYOKAI_READING_STATUS&&window.KYOKAI_SAVED_STORIES))).toBe(true);
  const tools=page.locator('[data-series-tools]');
  await expect(tools).toBeVisible();
  await expect(page.getByLabel('シリーズ内検索')).toHaveValue('音声案内');
  await expect(page.getByLabel('読了状態で絞り込み')).toHaveValue('unread');
  await expect(page.getByLabel('あとで読むの保存状態で絞り込み')).toHaveValue('saved');
  await expect(page.locator('[data-role="result"]')).toContainText('1話を表示中（全12話）');
  expect(await visibleIds(page,'.story-card','storyId')).toEqual(['MKB-007']);

  const next=page.getByRole('button',{name:/次の未読作品（1話）/});
  await expect(next).toBeEnabled();
  await next.click();
  await expect(page).toHaveURL(/\/stories\/mkb-007-onsei-annai-wa-nido-magaru\.html$/);
});

test('再訪履歴から続き・最近・保存・未読おすすめを重複なく表示する',async({page})=>{
  const now=Date.now();
  await seedStorage(page,{
    [READ_KEY]:JSON.stringify(['MKB-001']),
    [HISTORY_KEY]:JSON.stringify({
      visits:{'KKS-S1E01':now-10_000,'MKB-001':now-30_000},
      completions:{'MKB-001':now-20_000},
    }),
    [SAVED_KEY]:JSON.stringify({ids:['SKK-001'],savedAt:{'SKK-001':now-5_000}}),
    [positionKey('kks-s1e01-sakaime-no-heya.html')]:'0.4200',
  });

  await page.goto('');
  const library=page.locator('[data-personal-library]');
  await expect(library).toBeVisible();

  const continuing=page.locator('[data-personal-continue] [data-personal-story-id]');
  await expect(continuing).toHaveAttribute('data-personal-story-id','KKS-S1E01');
  await expect(continuing).toHaveAttribute('href',/\?resume=1#story$/);
  await expect(page.locator('[data-personal-continue]')).toContainText('42%');

  await expect(page.locator('[data-personal-recent] [data-personal-story-id="MKB-001"]')).toBeVisible();
  await expect(page.locator('[data-personal-saved] [data-personal-story-id="SKK-001"]')).toBeVisible();
  await expect(page.locator('[data-personal-recommend] [data-personal-story-id]')).toHaveCount(3);

  const ids=await page.locator('[data-personal-library] [data-personal-story-id]').evaluateAll(cards=>cards.map(card=>card.dataset.personalStoryId));
  expect(new Set(ids).size).toBe(ids.length);
  for(const excluded of ['KKS-S1E01','MKB-001','SKK-001'])expect(ids.filter(id=>id===excluded)).toHaveLength(1);
  await expect(page.locator('.nav-links [data-personal-nav]')).toHaveText('続き');
});

test('履歴がない初回訪問では個別化欄と続きナビを表示しない',async({page})=>{
  await seedStorage(page);
  await page.goto('');
  await expect(page.locator('#work-grid .work-card')).toHaveCount(48);
  await expect(page.locator('[data-personal-library]')).toBeHidden();
  await expect(page.locator('.nav-links [data-personal-nav]')).toHaveCount(0);
});
