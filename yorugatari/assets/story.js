
const progress=document.querySelector('.progress');
addEventListener('scroll',()=>{const d=document.documentElement;const max=d.scrollHeight-d.clientHeight;progress.style.width=(max?d.scrollTop/max*100:0)+'%'});
const expBtn=document.querySelector('#explainBtn');
const exp=document.querySelector('#explanation');
expBtn?.addEventListener('click',()=>{exp.classList.toggle('open');expBtn.textContent=exp.classList.contains('open')?'解説を閉じる':'解説を見る'});
const fav=document.querySelector('#favoriteBtn');
const slug=document.body.dataset.slug;
const key='yorugatari-favorites';
let f=JSON.parse(localStorage.getItem(key)||'[]');
function draw(){fav?.classList.toggle('active',f.includes(slug));if(fav)fav.textContent=f.includes(slug)?'★ お気に入り済み':'☆ お気に入り'}
fav?.addEventListener('click',()=>{f=f.includes(slug)?f.filter(x=>x!==slug):[...f,slug];localStorage.setItem(key,JSON.stringify(f));draw()});draw();
document.querySelector('#shareBtn')?.addEventListener('click',async()=>{const data={title:document.title,text:document.querySelector('meta[name="description"]')?.content,url:location.href};if(navigator.share){await navigator.share(data)}else{await navigator.clipboard.writeText(location.href);alert('URLをコピーしました')}});
