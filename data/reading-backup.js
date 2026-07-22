(()=>{
  const root=document.querySelector('[data-reading-backup]');
  if(!root)return;

  const works=Array.isArray(window.KYOKAI_WORKS)?window.KYOKAI_WORKS:[];
  const reading=window.KYOKAI_READING_STATUS;
  const saved=window.KYOKAI_SAVED_STORIES;
  if(!works.length||!reading||!saved)return;

  const SCHEMA='kyokai-yawa-reading-backup';
  const VERSION=1;
  const SITE='https://allsunday1122.github.io/kyokai-yawa/';
  const READ_KEY=reading.key||'kyokai-yawa-read-stories-v1';
  const HISTORY_KEY=reading.historyKey||'kyokai-yawa-reading-history-v1';
  const SAVED_KEY=saved.key||'kyokai-yawa-saved-stories-v1';
  const SIZE_KEY='kyokai-yawa-reader-size';
  const POSITION_PREFIX='kyokai-yawa-reader-position:';
  const allowedSizes=new Set(['small','standard','large']);
  const byId=new Map(works.map(work=>[work.id,work]));
  const knownIds=new Set(byId.keys());

  const exportButton=root.querySelector('[data-backup-export]');
  const shareButton=root.querySelector('[data-backup-share]');
  const fileInput=root.querySelector('[data-backup-file]');
  const preview=root.querySelector('[data-backup-preview]');
  const confirmButton=root.querySelector('[data-backup-confirm]');
  const cancelButton=root.querySelector('[data-backup-cancel]');
  const message=root.querySelector('[data-backup-message]');
  const modeInputs=[...root.querySelectorAll('[name="backup-mode"]')];
  let pending=null;

  const safeStorage={
    get(key){try{return localStorage.getItem(key);}catch{return null;}},
    set(key,value){try{localStorage.setItem(key,value);return true;}catch{return false;}},
    remove(key){try{localStorage.removeItem(key);return true;}catch{return false;}},
  };
  const positionKey=work=>`${POSITION_PREFIX}/kyokai-yawa/stories/${work.file}`;
  const validTimestamp=value=>Number.isFinite(Number(value))&&Number(value)>0&&Number(value)<4102444800000;
  const validRatio=value=>Number.isFinite(Number(value))&&Number(value)>=0.03&&Number(value)<0.97;
  const plainObject=value=>value&&typeof value==='object'&&!Array.isArray(value);
  const setMessage=(text,type='')=>{message.textContent=text;message.dataset.type=type;};

  const collectHistory=()=>{
    const source=reading.getHistory?.()||{visits:{},completions:{}};
    const history={visits:{},completions:{}};
    for(const type of ['visits','completions']){
      for(const [id,value] of Object.entries(source[type]||{}))if(knownIds.has(id)&&validTimestamp(value))history[type][id]=Number(value);
    }
    return history;
  };

  const collectSaved=()=>{
    const ids=saved.getSavedIds?.().filter(id=>knownIds.has(id))||[];
    const savedAt={};
    for(const id of ids){const timestamp=Number(saved.getSavedAt?.(id)||0);savedAt[id]=validTimestamp(timestamp)?timestamp:0;}
    return {ids,savedAt};
  };

  const collectPositions=()=>{
    const positions={};
    for(const work of works){const ratio=Number.parseFloat(safeStorage.get(positionKey(work))||'');if(validRatio(ratio))positions[work.id]=Number(ratio.toFixed(4));}
    return positions;
  };

  const collectBackup=()=>({
    schema:SCHEMA,
    version:VERSION,
    site:SITE,
    app:'境界夜話',
    exportedAt:new Date().toISOString(),
    data:{
      readStories:reading.getReadIds().filter(id=>knownIds.has(id)),
      history:collectHistory(),
      savedStories:collectSaved(),
      positions:collectPositions(),
      preferences:{readerSize:allowedSizes.has(safeStorage.get(SIZE_KEY))?safeStorage.get(SIZE_KEY):'standard'},
    },
  });

  const backupFile=()=>{
    const payload=collectBackup();
    const text=JSON.stringify(payload,null,2)+'\n';
    const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z').replace('T','-');
    return new File([text],`kyokai-yawa-reading-backup-${stamp}.json`,{type:'application/json'});
  };

  const downloadFile=file=>{
    const url=URL.createObjectURL(file);
    const link=document.createElement('a');
    link.href=url;link.download=file.name;link.hidden=true;
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };

  exportButton.addEventListener('click',()=>{
    downloadFile(backupFile());
    setMessage('現在の読書記録をJSONファイルへ書き出しました。','success');
  });

  const canShareFiles=()=>{
    try{const file=backupFile();return Boolean(navigator.share&&navigator.canShare?.({files:[file]}));}catch{return false;}
  };
  if(canShareFiles()){
    shareButton.hidden=false;
    shareButton.addEventListener('click',async()=>{
      try{
        const file=backupFile();
        await navigator.share({files:[file],title:'境界夜話 読書記録バックアップ',text:'境界夜話の端末内読書記録です。'});
        setMessage('バックアップファイルを共有しました。','success');
      }catch(error){if(error?.name!=='AbortError')setMessage('共有できませんでした。JSON保存を使用してください。','error');}
    });
  }

  const sanitizeIds=(value,label)=>{
    if(!Array.isArray(value))throw new Error(`${label}が配列ではありません。`);
    if(value.length>works.length)throw new Error(`${label}の件数が不正です。`);
    const ids=[...new Set(value.map(String))];
    for(const id of ids)if(!knownIds.has(id))throw new Error(`${label}に未知の作品IDがあります。`);
    return ids;
  };

  const sanitizeHistory=value=>{
    if(!plainObject(value))throw new Error('閲覧履歴が不正です。');
    const history={visits:{},completions:{}};
    for(const type of ['visits','completions']){
      const source=value[type]??{};
      if(!plainObject(source))throw new Error(`${type}履歴が不正です。`);
      for(const [id,timestamp] of Object.entries(source)){
        if(!knownIds.has(id)||!validTimestamp(timestamp))throw new Error(`${type}履歴に不正な値があります。`);
        history[type][id]=Number(timestamp);
      }
    }
    return history;
  };

  const sanitizeSaved=value=>{
    if(!plainObject(value))throw new Error('あとで読むデータが不正です。');
    const ids=sanitizeIds(value.ids??[],'あとで読む');
    const source=value.savedAt??{};
    if(!plainObject(source))throw new Error('保存日時が不正です。');
    const savedAt={};
    for(const id of ids){
      const timestamp=source[id]??0;
      if(timestamp!==0&&!validTimestamp(timestamp))throw new Error('保存日時に不正な値があります。');
      savedAt[id]=Number(timestamp)||0;
    }
    for(const id of Object.keys(source))if(!ids.includes(id))throw new Error('保存日時に対応しない作品IDがあります。');
    return {ids,savedAt};
  };

  const sanitizePositions=value=>{
    if(!plainObject(value))throw new Error('途中位置データが不正です。');
    const positions={};
    for(const [id,ratio] of Object.entries(value)){
      if(!knownIds.has(id)||!validRatio(ratio))throw new Error('途中位置に不正な作品IDまたは値があります。');
      positions[id]=Number(Number(ratio).toFixed(4));
    }
    return positions;
  };

  const validateBackup=raw=>{
    if(!plainObject(raw)||raw.schema!==SCHEMA||raw.site!==SITE)throw new Error('境界夜話の読書記録バックアップではありません。');
    if(raw.version!==VERSION)throw new Error(`対応していないバックアップ形式です（version ${String(raw.version)}）。`);
    if(!plainObject(raw.data))throw new Error('バックアップ本体がありません。');
    const exportedAt=Date.parse(raw.exportedAt||'');
    if(!Number.isFinite(exportedAt))throw new Error('書き出し日時が不正です。');
    const preferences=plainObject(raw.data.preferences)?raw.data.preferences:{};
    const readerSize=String(preferences.readerSize||'standard');
    if(!allowedSizes.has(readerSize))throw new Error('文字サイズ設定が不正です。');
    return {
      exportedAt:new Date(exportedAt).toISOString(),
      readStories:sanitizeIds(raw.data.readStories??[],'読了作品'),
      history:sanitizeHistory(raw.data.history??{}),
      savedStories:sanitizeSaved(raw.data.savedStories??{}),
      positions:sanitizePositions(raw.data.positions??{}),
      readerSize,
    };
  };

  const updatePreview=data=>{
    root.querySelector('[data-preview-exported]').textContent=new Date(data.exportedAt).toLocaleString('ja-JP');
    root.querySelector('[data-preview-read]').textContent=`${data.readStories.length}話`;
    root.querySelector('[data-preview-saved]').textContent=`${data.savedStories.ids.length}話`;
    root.querySelector('[data-preview-progress]').textContent=`${Object.keys(data.positions).length}話`;
    root.querySelector('[data-preview-history]').textContent=`${Object.keys(data.history.visits).length}閲覧・${Object.keys(data.history.completions).length}読了`;
    root.querySelector('[data-preview-size]').textContent=({small:'小',standard:'標準',large:'大'})[data.readerSize];
    preview.hidden=false;confirmButton.disabled=false;
  };

  const resetImport=()=>{
    pending=null;fileInput.value='';preview.hidden=true;confirmButton.disabled=true;setMessage('');
  };

  fileInput.addEventListener('change',async()=>{
    const file=fileInput.files?.[0];
    pending=null;preview.hidden=true;confirmButton.disabled=true;
    if(!file)return;
    if(file.size>256*1024){setMessage('ファイルが大きすぎます。256KB以下のJSONを選択してください。','error');return;}
    try{
      const raw=JSON.parse(await file.text());
      pending=validateBackup(raw);
      updatePreview(pending);
      setMessage('内容を確認し、復元方法を選んでください。','success');
    }catch(error){setMessage(error instanceof Error?error.message:'JSONを読み取れませんでした。','error');}
  });

  const currentRead=()=>new Set(reading.getReadIds().filter(id=>knownIds.has(id)));
  const currentHistory=()=>collectHistory();
  const currentSaved=()=>collectSaved();
  const currentPosition=work=>{const value=Number.parseFloat(safeStorage.get(positionKey(work))||'');return validRatio(value)?value:null;};
  const maxHistory=(local,incoming)=>{
    const result={visits:{},completions:{}};
    for(const type of ['visits','completions'])for(const id of knownIds){const timestamp=Math.max(Number(local[type]?.[id]||0),Number(incoming[type]?.[id]||0));if(timestamp)result[type][id]=timestamp;}
    return result;
  };

  const applyBackup=(data,mode)=>{
    const replace=mode==='replace';
    const readSet=replace?new Set(data.readStories):new Set([...currentRead(),...data.readStories]);
    const history=replace?data.history:maxHistory(currentHistory(),data.history);
    const localSaved=currentSaved();
    const savedIds=replace?new Set(data.savedStories.ids):new Set([...localSaved.ids,...data.savedStories.ids]);
    const savedAt={};
    for(const id of savedIds)savedAt[id]=replace?Number(data.savedStories.savedAt[id]||0):Math.max(Number(localSaved.savedAt[id]||0),Number(data.savedStories.savedAt[id]||0));

    if(!safeStorage.set(READ_KEY,JSON.stringify([...readSet].sort())))throw new Error('読了記録を保存できませんでした。');
    if(!safeStorage.set(HISTORY_KEY,JSON.stringify(history)))throw new Error('閲覧履歴を保存できませんでした。');
    if(!safeStorage.set(SAVED_KEY,JSON.stringify({ids:[...savedIds].sort((a,b)=>(savedAt[b]||0)-(savedAt[a]||0)||a.localeCompare(b)),savedAt})))throw new Error('あとで読むを保存できませんでした。');

    for(const work of works){
      const imported=data.positions[work.id];
      if(replace){safeStorage.remove(positionKey(work));if(imported!==undefined)safeStorage.set(positionKey(work),String(imported));}
      else if(imported!==undefined){const local=currentPosition(work);safeStorage.set(positionKey(work),String(local===null?imported:Math.max(local,imported).toFixed(4)));}
    }
    safeStorage.set(SIZE_KEY,data.readerSize);
  };

  confirmButton.addEventListener('click',()=>{
    if(!pending)return;
    const mode=modeInputs.find(input=>input.checked)?.value||'merge';
    if(mode==='replace'&&!confirm('現在の読書記録、途中位置、あとで読む、文字サイズをバックアップ内容で置き換えます。続けますか？'))return;
    try{
      applyBackup(pending,mode);
      setMessage(mode==='replace'?'バックアップ内容で置き換えました。画面を更新します。':'現在の記録へバックアップを追加しました。画面を更新します。','success');
      confirmButton.disabled=true;
      setTimeout(()=>location.reload(),500);
    }catch(error){setMessage(error instanceof Error?error.message:'復元できませんでした。','error');}
  });
  cancelButton.addEventListener('click',resetImport);
})();
