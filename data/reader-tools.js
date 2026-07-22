(() => {
  const article = document.querySelector('article#story');
  const meta = document.querySelector('.meta');
  if (!article || !meta || document.querySelector('[data-reader-tools]')) return;

  const sizeKey = 'kyokai-yawa-reader-size';
  const positionKey = `kyokai-yawa-reader-position:${location.pathname}`;
  const allowedSizes = new Set(['small', 'standard', 'large']);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const safeStorage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch {} },
    remove(key) { try { localStorage.removeItem(key); } catch {} },
  };

  const savedSize = safeStorage.get(sizeKey);
  document.documentElement.dataset.readerSize = allowedSizes.has(savedSize) ? savedSize : 'standard';

  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('role', 'progressbar');
  progress.setAttribute('aria-label', '本文の読了進捗');
  progress.setAttribute('aria-valuemin', '0');
  progress.setAttribute('aria-valuemax', '100');
  progress.setAttribute('aria-valuenow', '0');
  progress.innerHTML = '<span class="reading-progress__bar"></span>';
  document.body.prepend(progress);
  const progressBar = progress.firstElementChild;

  const toolbar = document.createElement('section');
  toolbar.className = 'reader-toolbar';
  toolbar.dataset.readerTools = '';
  toolbar.setAttribute('aria-label', '読書設定');
  toolbar.innerHTML = `
    <div class="reader-toolbar__group" role="group" aria-label="本文の文字サイズ">
      <span class="reader-toolbar__label">文字サイズ</span>
      <button class="reader-size-button" type="button" data-reader-size="small" aria-label="文字を小さくする">小</button>
      <button class="reader-size-button" type="button" data-reader-size="standard" aria-label="標準の文字サイズにする">標準</button>
      <button class="reader-size-button" type="button" data-reader-size="large" aria-label="文字を大きくする">大</button>
    </div>
    <div class="reader-toolbar__status">
      <span class="reader-progress-text" aria-live="polite">本文 0%</span>
      <button class="reader-resume-button" type="button" hidden>前回の位置へ</button>
    </div>`;
  const overview = document.querySelector('.story-overview');
  (overview || meta).after(toolbar);

  const sizeButtons = [...toolbar.querySelectorAll('[data-reader-size]')];
  const progressText = toolbar.querySelector('.reader-progress-text');
  const resumeButton = toolbar.querySelector('.reader-resume-button');

  const applySize = size => {
    const next = allowedSizes.has(size) ? size : 'standard';
    document.documentElement.dataset.readerSize = next;
    safeStorage.set(sizeKey, next);
    for (const button of sizeButtons) button.setAttribute('aria-pressed', String(button.dataset.readerSize === next));
    requestAnimationFrame(updateProgress);
  };
  for (const button of sizeButtons) button.addEventListener('click', () => applySize(button.dataset.readerSize));
  applySize(document.documentElement.dataset.readerSize);

  const returnTop = document.createElement('a');
  returnTop.className = 'reader-return-top';
  returnTop.href = '#story';
  returnTop.textContent = '本文の先頭へ戻る';
  article.after(returnTop);

  const savedPosition = Number.parseFloat(safeStorage.get(positionKey) || '');
  if (Number.isFinite(savedPosition) && savedPosition >= 0.08 && savedPosition < 0.93) {
    resumeButton.hidden = false;
    resumeButton.textContent = `前回の${Math.round(savedPosition * 100)}%へ`;
    resumeButton.addEventListener('click', () => {
      const bounds = getBounds();
      scrollTo({ top: bounds.start + savedPosition * bounds.range, behavior: reducedMotion ? 'auto' : 'smooth' });
      resumeButton.hidden = true;
    }, { once: true });
  }

  function getBounds() {
    const top = article.getBoundingClientRect().top + scrollY;
    const start = Math.max(0, top - innerHeight * 0.18);
    const end = Math.max(start + 1, top + article.offsetHeight - innerHeight * 0.62);
    return { start, range: end - start };
  }

  let currentRatio = 0;
  let ticking = false;
  let lastSavedAt = 0;
  let completionSent = false;
  const clamp = value => Math.min(1, Math.max(0, value));

  function updateProgress() {
    ticking = false;
    const bounds = getBounds();
    currentRatio = clamp((scrollY - bounds.start) / bounds.range);
    const percent = Math.round(currentRatio * 100);
    progressBar.style.transform = `scaleX(${currentRatio})`;
    progress.setAttribute('aria-valuenow', String(percent));
    progressText.textContent = `本文 ${percent}%`;

    const now = Date.now();
    if (currentRatio >= 0.97) {
      safeStorage.remove(positionKey);
      if (!completionSent) {
        completionSent = true;
        document.dispatchEvent(new CustomEvent('kyokai-story-complete', { detail: { ratio: currentRatio } }));
      }
    } else if (currentRatio >= 0.03 && now - lastSavedAt >= 800) {
      safeStorage.set(positionKey, currentRatio.toFixed(4));
      lastSavedAt = now;
    }
  }

  const scheduleUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateProgress);
  };

  addEventListener('scroll', scheduleUpdate, { passive: true });
  addEventListener('resize', scheduleUpdate, { passive: true });
  addEventListener('pagehide', () => {
    if (currentRatio >= 0.03 && currentRatio < 0.97) safeStorage.set(positionKey, currentRatio.toFixed(4));
  });
  updateProgress();
})();