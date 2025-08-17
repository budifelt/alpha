/***** Theme helpers *****/
const root = document.documentElement;
const getTheme = () => root.getAttribute('data-theme') || 'light';
const setTheme = (t) => { root.setAttribute('data-theme', t); localStorage.setItem('theme', t); };
const savedTheme = localStorage.getItem('theme'); if (savedTheme) root.setAttribute('data-theme', savedTheme);

/***** Tahun footer *****/
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/***** Copy email *****/
const EMAIL = 'emailmu@domain.com';
const copyBtn = document.getElementById('copyEmail');
if (copyBtn) {
  copyBtn.addEventListener('click', async (e) => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      const el = e.currentTarget; const txt = el.textContent;
      el.textContent = '✅ Email copied';
      setTimeout(()=> el.textContent = txt, 1400);
    } catch(err){ alert('Failed to copy email'); }
  });
}

/***** Form: kirim via email *****/
const sendBtn = document.getElementById('kirimBtn');
const resetBtn = document.getElementById('resetBtn');
if (sendBtn) {
  sendBtn.addEventListener('click', () => {
    const nama = (document.getElementById('nama')?.value || '').trim();
    const email = (document.getElementById('email')?.value || '').trim();
    const pesan = (document.getElementById('pesan')?.value || '').trim();
    const body = encodeURIComponent(`Hello,\n\nName: ${nama}\nEmail: ${email}\n\n${pesan}`);
    window.location.href = `mailto:${EMAIL}?subject=Contact%20from%20Website&body=${body}`;
  });
}
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    ['nama','email','pesan'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  });
}

/***** Slider (arrows) + Filter *****/
const filters = document.querySelectorAll('.filter');
const allCards = Array.from(document.querySelectorAll('.project'));
const prevBtn = document.getElementById('arrowLeft');
const nextBtn = document.getElementById('arrowRight');
const wrapper = document.querySelector('.projects-wrapper');
const emptyState = document.getElementById('emptyState');

let activeTag = 'all';
let startIndex = 0;
const getPerPage = () => window.innerWidth>=1000 ? 3 : (window.innerWidth>=640 ? 2 : 1);
const getFilteredList = () => allCards.filter(c => activeTag==='all' || c.dataset.tags.includes(activeTag));

function renderSlider(){
  const perPage=getPerPage(), list=getFilteredList();
  allCards.forEach(c=> c.style.display='none');
  const maxStart=Math.max(0, list.length - perPage);
  if(startIndex>maxStart) startIndex=maxStart;
  list.slice(startIndex, startIndex+perPage).forEach(c=> c.style.display='block');
  const needsNav=list.length>perPage;
  if (prevBtn && nextBtn) {
    prevBtn.style.display=needsNav?'inline-flex':'none';
    nextBtn.style.display=needsNav?'inline-flex':'none';
  }
  if (emptyState) emptyState.style.display=list.length?'none':'block';
}
filters.forEach(btn => btn.addEventListener('click', () => {
  filters.forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  activeTag=btn.dataset.filter;
  startIndex=0;
  renderSlider();
}));
if (prevBtn) prevBtn.addEventListener('click', ()=>{
  const perPage=getPerPage(), len=getFilteredList().length, maxStart=Math.max(0, len-perPage);
  if(maxStart<=0) return;
  startIndex=(startIndex - 1 + (maxStart + 1)) % (maxStart + 1);
  renderSlider();
});
if (nextBtn) nextBtn.addEventListener('click', ()=>{
  const perPage=getPerPage(), len=getFilteredList().length, maxStart=Math.max(0, len-perPage);
  if(maxStart<=0) return;
  startIndex=(startIndex + 1) % (maxStart + 1);
  renderSlider();
});
document.addEventListener('keydown', e=>{ if(e.key==='ArrowLeft') prevBtn?.click(); if(e.key==='ArrowRight') nextBtn?.click(); });
let touchX=null;
if (wrapper) {
  wrapper.addEventListener('touchstart', e=>{ touchX=e.touches[0].clientX; }, {passive:true});
  wrapper.addEventListener('touchend', e=>{
    if(touchX===null) return;
    const dx=e.changedTouches[0].clientX - touchX; touchX=null;
    if(Math.abs(dx)<25) return;
    dx>0? prevBtn?.click() : nextBtn?.click();
  }, {passive:true});
}
window.addEventListener('resize', renderSlider);
renderSlider();

/***** Modal Preview (klik card) *****/
const previewModal=document.getElementById('previewModal');
const previewFrame=document.getElementById('previewFrame');
const previewUrlEl=document.getElementById('previewUrl');
const openNewTab=document.getElementById('openNewTab');
const closePreview=()=>{ if (previewFrame) previewFrame.src='about:blank'; previewModal?.classList.remove('active'); };
document.getElementById('closePreview')?.addEventListener('click', closePreview);
previewModal?.addEventListener('click', (e)=>{ if(e.target===previewModal) closePreview(); });

document.querySelectorAll('.project').forEach(card=>{
  const url = card.querySelector('[data-preview-url]')?.dataset.previewUrl || card.dataset.url;
  if(!url) return;
  card.addEventListener('click', (e)=>{
    if(e.target.closest('a,button')) return;
    if (previewUrlEl) previewUrlEl.textContent=url;
    if (openNewTab) openNewTab.href=url;
    if (previewFrame) previewFrame.src=url;
    previewModal?.classList.add('active');
  });
});

/***** Autopreview thumbs: hide fallback + kill scrollbars if possible *****/
document.querySelectorAll('.thumb[data-autopreview="true"] .thumb-frame').forEach(frame=>{
  frame.setAttribute('scrolling','no');
  const fb = frame.parentElement.querySelector('.thumb-fallback');
  const hideScrollbars = () => {
    try {
      const d = frame.contentDocument || frame.contentWindow.document;
      if (d) { d.documentElement.style.overflow = 'hidden'; d.body.style.overflow = 'hidden'; }
    } catch (_) { /* cross-origin: ignore */ }
  };
  frame.addEventListener('load', () => {
    if (fb) { fb.style.transition='opacity .2s'; fb.style.opacity='0'; setTimeout(()=> fb.style.display='none', 220); }
    hideScrollbars();
  });
});

/***** Pull-cord: cycle Light → Dark → Cyberpunk *****/
(function(){
  const cord = document.getElementById('pullCord');
  const knob = document.getElementById('cordKnob');
  const inner = cord?.querySelector('.cord-inner');
  const header = document.querySelector('header.nav');
  if(!cord || !knob || !inner || !header) return;

  let dragging=false, startY=0, crossed=false;

  function maxDrop(){ const h = Math.max(0, cord.getBoundingClientRect().height - 60); return Math.min(100, h); }
  const triggerOffset = 40;

  const setDrop = (dy)=>{ const c = Math.max(0, Math.min(maxDrop(), dy)); inner.style.transform = `translateY(${c}px)`; return c; };
  const reset = ()=>{ inner.style.transition='transform .22s'; inner.style.transform='translateY(0)'; cord.classList.remove('dragging'); setTimeout(()=> inner.style.transition='', 220); };
  const cycleTheme = ()=>{ const cur=getTheme(); const next = cur==='light'?'dark':(cur==='dark'?'cyberpunk':'light'); setTheme(next); };

  const move = (y)=>{ const dy = y - startY; setDrop(dy); const headerBottom = header.getBoundingClientRect().bottom; const knobRect = knob.getBoundingClientRect(); crossed = (knobRect.top + 16) > (headerBottom + triggerOffset); };

  knob.addEventListener('pointerdown', (e)=>{ dragging=true; startY=e.clientY; cord.classList.add('dragging'); knob.setPointerCapture(e.pointerId); });
  knob.addEventListener('pointermove', (e)=>{ if(dragging) move(e.clientY); });
  knob.addEventListener('pointerup',   (e)=>{ dragging=false; knob.releasePointerCapture(e.pointerId); if(crossed) cycleTheme(); crossed=false; reset(); });
  knob.addEventListener('pointercancel', ()=>{ dragging=false; reset(); });

  knob.addEventListener('touchstart', (e)=>{ dragging=true; startY=e.touches[0].clientY; cord.classList.add('dragging'); }, {passive:true});
  knob.addEventListener('touchmove',  (e)=>{ if(dragging) move(e.touches[0].clientY); }, {passive:true});
  knob.addEventListener('touchend',   ()=>{ dragging=false; if(crossed) cycleTheme(); crossed=false; reset(); }, {passive:true});
})();
