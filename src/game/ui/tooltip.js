//@ The in-game hover note: any element with a title (or data-tip) shows a bark-and-brass note beside the pointer instead of the browser's grey popup
/* Agent map. One #gtip div is made on first use. On a mouse pointer over an element with title, the title moves to data-tip (so the browser shows nothing) and the note appears: the first part (before " · ") is the
   heading, the rest are lines; a title with a colon splits into heading and text. Touch pointers have no hover: a press-and-hold
   shows the same note as a toast and swallows the tap that follows it. Hidden on leave, scroll, a click and when the panel closes.
   Styles: 40-tooltip.css. Test: client-smoke (the markup the panels give is checked there; this file is DOM-only). */
var GTIP={el:null,cur:null};
function gtipEl(){
  if(!GTIP.el){ const d=document.createElement('div'); d.id='gtip'; d.setAttribute('role','tooltip'); d.hidden=true; document.body.appendChild(d); GTIP.el=d; }
  return GTIP.el;
}
function gtipShow(t,text,x,y){
  const d=gtipEl(), parts=String(text).split(' · ');
  let head=parts.shift(), rest=parts;
  if(!rest.length){ const m=/^([^:]{2,40}): (.+)$/.exec(head); if(m){ head=m[1]; rest=[m[2]]; } }
  d.textContent=''; const h=document.createElement('b'); h.textContent=head; d.appendChild(h);
  for(const r of rest){ const p=document.createElement('span'); p.textContent=r; d.appendChild(p); }
  d.hidden=false; GTIP.cur=t; gtipPlace(x,y);
}
function gtipPlace(x,y){
  const d=gtipEl(); if(d.hidden) return; const w=d.offsetWidth, h=d.offsetHeight, W=window.innerWidth, H=window.innerHeight;
  let l=x+14, tp=y+16; if(l+w>W-6) l=Math.max(6,x-w-12); if(tp+h>H-6) tp=Math.max(6,y-h-12);
  d.style.left=l+'px'; d.style.top=tp+'px';
}
function gtipHide(){ GTIP.cur=null; if(GTIP.el) GTIP.el.hidden=true; }
document.addEventListener('pointerover',e=>{
  if(e.pointerType==='touch') return;
  const t=e.target&&e.target.closest?e.target.closest('[title],[data-tip]'):null;
  if(!t){ if(GTIP.cur) gtipHide(); return; }
  if(t.hasAttribute('title')){ const v=t.getAttribute('title'); if(v) t.setAttribute('data-tip',v); t.removeAttribute('title'); }
  const v=t.getAttribute('data-tip'); if(!v){ gtipHide(); return; }
  if(t!==GTIP.cur) gtipShow(t,v,e.clientX,e.clientY);
});
document.addEventListener('pointermove',e=>{ if(GTIP.cur) gtipPlace(e.clientX,e.clientY); });
document.addEventListener('pointerout',e=>{ if(GTIP.cur&&(!e.relatedTarget||!GTIP.cur.contains(e.relatedTarget))) gtipHide(); });
document.addEventListener('pointerdown',gtipHide); document.addEventListener('scroll',gtipHide,true);
/* touch has no hover: a press-and-hold shows the same note as a toast, and the tap that follows it is swallowed so the
   long press never triggers the element's own click. A drag past 12 px cancels it (the finger was scrolling, not asking). */
let gtipHold=null, gtipNoMenu=0;   // gtipNoMenu: until when a native long-press menu is suppressed (a touch is asking for a note, not the browser's menu)
document.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch') return;
  const t=e.target&&e.target.closest?e.target.closest('[title],[data-tip]'):null; if(!t) return;
  const x=e.clientX, y=e.clientY; gtipNoMenu=performance.now()+1200;
  gtipHold={x,y,timer:setTimeout(()=>{ gtipHold=null; GTIP.block=true; gtipNoMenu=performance.now()+1200;
    const v=t.getAttribute('data-tip')||t.getAttribute('title'); if(v) toast(v.replace(/ · /g,' — ')); },550)};
});
document.addEventListener('pointermove',e=>{ if(gtipHold&&Math.hypot(e.clientX-gtipHold.x,e.clientY-gtipHold.y)>12){ clearTimeout(gtipHold.timer); gtipHold=null; } },{passive:true});
for(const ev of ['pointerup','pointercancel']) document.addEventListener(ev,()=>{ if(gtipHold){ clearTimeout(gtipHold.timer); gtipHold=null; } });
document.addEventListener('contextmenu',e=>{ if(performance.now()<gtipNoMenu) e.preventDefault(); },true);
document.addEventListener('click',e=>{ if(!GTIP.block) return; GTIP.block=false; e.stopPropagation(); e.preventDefault(); },true);
