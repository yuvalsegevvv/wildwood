//@ Awakening panel: one character's tree on a canvas (tap a node, drag to pan, pinch or wheel to zoom), the character picker, the tier strip, the detail box with its price and Buy button; the awk event; opened by the Awaken button or its key
/* Agent map (skills revamp step 15; PLAN section 4; protocol: docs/PROTOCOL.md `awk`; the rules half: costs.js; the drawing: tree.js; the server: server/awakening.js has the last word on every purchase).
   Open: awcOpen(set, limb) (the skills panel's Awaken buttons: a skill's own character and limb; none = the character you play), awcToggle() (the key `awaken`, T), awcClose is closePanels.
   Markup: #awc (a panel, in PANELS, ui/panels.js), #awcPick, #awcTier, #awcCv (the canvas), #awcLimbs, #awcDetail, #awcKey in index.html; styles/37-awakening.css (a bottom sheet on a phone).
   Sends: awk {a:'tier', set} | {a:'up', set, id} (an upgrade or a star node) | {a:'stat', set, id}. Hears: the awk event [pid, set, 't' | node id, tier] (applyEvent, net/client.js: a ring on the node, a redraw) and every
   you update (applyGear, economy/items.js: awcRender), so the panel always shows what the server last said.
   State: AWC = {set, sel (node id), V (the view: tree.js), hits (what the last draw put on screen), drawn (their count), ptr (the fingers down), pulse, wait, confirm, st (node states), M (the last draw's model)}.
   Taps: a tap is a pointer down and up that moved less than 7 px; the nearest node within a fingertip (16 px on a touch screen, 11 with a mouse, never less than its own radius) is picked. Test: client-smoke (awakening block). */
const AWC={tab:'awk',set:null,sel:null,V:null,fit:null,key:'',W:0,H:0,hits:[],drawn:0,ptr:new Map(),pinch:null,moved:false,pulse:null,wait:0,confirm:0,scrollTo:null,st:{},M:null,html:{},img:{},lim:{min:1,max:90},bound:false};
const awcNum=n=>Math.floor(n||0).toLocaleString('en-US');
// the key (a listener of its own, like the inventory's in economy/init.js: the key also closes the panel, which combat-hud's keydown, shut while a panel is open, cannot do)
addEventListener('keydown',e=>{ if(started&&!customizing&&kbIs(e.code,'awaken')&&!e.repeat) awcToggle(); });
$('#skAwaken').addEventListener('click',()=>awcOpen());   // the skills panel's header button
function awcToggle(){ if(!started||customizing) return; if($('#awc').hidden) awcOpen(); else closePanels(); }
function awcOpen(set,limb){
  openPanel('awc');
  const cs=awcChars(true); AWC.set=cs.some(c=>c.k===set)?set:awcMain(); AWC.tab='awk'; AWC.sel=null; AWC.V=null; AWC.key=''; AWC.confirm=0; AWC.wait=0; AWC.pulse=null;
  awcBind(); awcRender(); if(limb) awcFocusLimb(limb);
}
function awcSetChar(k){ if(!awcChars(true).some(c=>c.k===k)) return; if(AWC.tab==='path'&&k!=='wanderer'||AWC.tab==='look'&&k==='wanderer') AWC.tab='sk'; AWC.set=k; AWC.sel=null; AWC.V=null; AWC.confirm=0; awcRender(); }
function awcSel(id){ const sh=awkShapeOf(AWC.set); if(!sh||!awkNode(sh,id)) return; AWC.sel=id; AWT.open=null; awcRender(); }
// ---- the pieces of markup ----
function awcPickHtml(cs){
  const main=awcMain();
  return cs.map(c=>'<button class="chip awc-ch'+(c.k===main?' main':'')+(c.locked?' locked':'')+'" data-awcset="'+c.k+'" aria-pressed="'+(c.k===AWC.set)+'" style="--c:'+c.col+'" title="'+(c.k===main?'The character you play now':c.name)+'"><i class="awc-dot"></i>'+c.name+'<small>A'+awcEntry(c.k).t+'</small></button>').join('');
}
function awcLinesHtml(lines,where){
  return lines.map(l=>'<button type="button" class="awc-c '+(l.ok?'ok':'bad')+'" data-awtmat="'+l.id+'" data-awtwhere="'+where+'" title="'+(l.note||'How to get it')+'">'+awtIcon(l.id,l.col)+l.name+' <b>'+awcNum(l.have)+' / '+awcNum(l.need)+'</b>'+(l.note?'<em>'+l.note+'</em>':'')+'</button>').join('')+awtInfoHtml(lines,where);
}
function awcTierHtml(k){
  const I=awcTierInfo(k), pips=AWK_TIERS.map(T=>'<span class="awc-pip'+(T.t<I.t?' done':T.t===I.t?' cur':'')+'" title="A'+T.t+': '+AWC_TIER_OPENS[T.t]+', skill level '+T.cap+(T.lv?', hiker level '+T.lv:'')+'">A'+T.t+'</span>').join('<i class="awc-pl"></i>');
  let nx='<span class="muted">Fully awakened: skills reach level '+I.cap+'.</span>';
  if(I.next){ const N=I.next, ask=AWC.confirm&&performance.now()<AWC.confirm, busy=AWC.wait&&performance.now()-AWC.wait<1500;
    nx='<div class="awc-nt"><b>Next: A'+N.t+'</b> opens '+N.opens+' and lifts skills to level '+N.cap+'. Needs hiker level '+N.lv+(N.lvOk?'':' <span class="bad">(you are '+PL.level+')</span>')+'.</div><div class="awc-cl">'+awcLinesHtml(N.lines,'tier')+'</div>'
      +'<button class="chip buy" data-awctier="1"'+(N.can&&!busy?'':' disabled')+'>'+(ask?'Spend '+awcNum(N.lines[0].need)+' coins? Tap again':'Awaken to A'+N.t)+'</button>'; }
  return '<div class="awc-pips" role="list">'+pips+'</div><div class="awc-next"><span class="muted">Now A'+I.t+': skills reach level '+I.cap+'.</span>'+nx+'</div>';
}
function awcLimbsHtml(k,sh){
  return sh.limbs.map(l=>{ const L=awcLimbLevel(k,l), first=AWK_LIMBS[l].first, shown=L>=first?'Lv '+L:first===1?'locked':'Lv 1';
    return '<button class="chip awc-lb" data-awclimb="'+l+'" style="--c:'+AWC_LIMB_COL[l]+'" title="Show this branch: '+awcSkillName(k,l)+'"><i></i>'+awcSkillName(k,l)+'<small>'+shown+'</small></button>'; }).join('');
}
function awcDetailHtml(k,sh){
  const n=AWC.sel&&awkNode(sh,AWC.sel);
  if(!n){ const e=awcEntry(k), have=Object.keys(e.n).length;
    return '<p class="awc-hint">'+(isTouch?'Tap':'Click')+' a node to see what it does and what it costs. '+(isTouch?'Drag to move and pinch to zoom.':'Drag to move, scroll to zoom.')+' '+have+' of '+sh.nodes.length+' nodes grown.</p>'
      +'<p class="awc-hint">A glowing gold ring is a node you can buy now. Every skill level, every stat and the burst\'s two buffs are nodes; the tier above opens the next part of the tree.</p>'; }
  const S=awcStatus(k,n), col=AWC_LIMB_COL[n.limb], title=n.kind==='stat'?awcStatText(k,n):n.kind==='star'?'Burst buff '+n.n:awcSkillName(k,n.limb)+(n.lv<=1?' (unlock)':' level '+n.lv);
  const sub=(n.kind==='star'?'Special node':n.kind==='stat'?'Stat node':'Skill level')+' &middot; '+AWC_LIMB_NAME[n.limb]+' branch'+(n.kind==='stat'?' ('+awcSkillName(k,n.limb)+')':'')+' &middot; A'+n.tier;
  const needs=n.req.map(r=>{ const q=sh.byId[r], ok=awcEntry(k).n[r]===1; return '<span class="awc-nd '+(ok?'ok':'bad')+'">'+(ok?'&#10003; ':'&#10007; ')+awcNodeName(k,q)+'</span>'; }).join('');
  let h='<div class="awc-d" style="--c:'+col+'"><div class="awc-dh"><i class="awc-dd"></i><div><b>'+title+'</b><small>'+sub+'</small></div></div><p class="awc-eff">'+awcEffect(k,n)+'</p>';
  if(S.st==='own') return h+'<p class="awc-own">&#10003; Grown</p></div>';
  h+='<div class="awc-cl">'+awcLinesHtml(S.lines||awcCostLines(awkNodeCost(k,n.id)),'node')+'</div>';
  if(needs) h+='<div class="awc-needs">Needs '+needs+'</div>';
  const busy=AWC.wait&&performance.now()-AWC.wait<1500;
  if(S.st==='tier'||S.st==='req') h+='<p class="awc-why">'+S.why+'</p>';
  else if(S.st==='open') h+='<p class="awc-why">You cannot pay for this yet.</p>';
  return h+'<button class="chip buy awc-buy" data-awcbuy="1"'+(S.st==='buy'&&!busy?'':' disabled')+'>'+(S.st==='buy'?'Buy':S.st==='open'?'Not enough yet':'Locked')+'</button></div>';
}
const awcKeyHtml=()=>'<span><i class="awc-k own"></i>grown</span><span><i class="awc-k buy"></i>you can buy</span><span><i class="awc-k open"></i>open</span><span><i class="awc-k tier"></i>needs a higher tier</span><span><i class="awc-k req"></i>needs an earlier node</span>';
// only touch the DOM when the markup changed (the server sends `you` often; a redraw must not drop a finger's tap)
function awcPut(id,html){ if(AWC.html[id]!==html){ AWC.html[id]=html; $('#'+id).innerHTML=html; } }
function awcRender(){
  if($('#awc').hidden) return;
  const cs=awcChars(true); if(!cs.some(c=>c.k===AWC.set)) AWC.set=awcMain();
  const k=AWC.set, sh=awkShapeOf(k); if(!sh||!GEAR) return;
  if(AWC.sel&&!awkNode(sh,AWC.sel)) AWC.sel=null;
  $('#awcCoins').textContent=fmtCoins(GEAR.coins)+' coins';
  AWC.st=awcStates(k);
  const pk0=AWC.html.awcPick; awcPut('awcPick',awcPickHtml(cs)); awcPut('awcTier',awcTierHtml(k)); awcPut('awcLimbs',awcLimbsHtml(k,sh)); awcPut('awcDetail',awcDetailHtml(k,sh)); awcPut('awcKey',awcKeyHtml());
  if(AWC.html.awcPick!==pk0||AWC.scrollTo!==k){ AWC.scrollTo=k; const pb=$('#awcPick'), on=pb.querySelector?pb.querySelector('[aria-pressed="true"]'):null; if(on&&on.offsetLeft!==undefined) pb.scrollLeft=Math.max(0,on.offsetLeft-(pb.clientWidth-on.offsetWidth)/2); }   // keep the chosen character's chip in view
  chrRender(); if(AWC.tab==='awk') awcCanvas(false);   // the Characters panel's other tabs (hub.js)
}
// ---- the canvas ----
function awcImg(k){   // the character's emblem as a picture (an SVG data URL; drawn once it has loaded), or null: the root then shows the initial
  if(typeof Image==='undefined') return null;
  if(!awcHas(AWC.img,k)){
    const S=awcHas(SS_SETS,k)?SS_SETS[k]:null; AWC.img[k]=null; if(!S||!S.emblem) return null;
    try{ const im=new Image(), svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#fff4dc" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+S.emblem.glyph.replace(/currentColor/g,'#fff4dc')+'</svg>';
      im.onload=()=>{ AWC.img[k]=im; if(!$('#awc').hidden) awcCanvas(false); }; im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg); }catch(_){}
  }
  return AWC.img[k]||null;
}
function awcCanvas(refit){
  const cv=$('#awcCv'), r=cv.getBoundingClientRect(), W=Math.max(120,Math.round(r.width)||600), H=Math.max(120,Math.round(r.height)||500), dpr=Math.min(2,window.devicePixelRatio||1), k=AWC.set, sh=awkShapeOf(k); if(!sh) return;
  const bw=Math.round(W*dpr), bh=Math.round(H*dpr), sized=AWC.W!==W||AWC.H!==H;
  if(cv.width!==bw||cv.height!==bh){ cv.width=bw; cv.height=bh; }
  AWC.W=W; AWC.H=H;
  if(!AWC.V||refit||sized||AWC.key!==k){ AWC.V=awcFit(sh,W,H); AWC.fit=AWC.V.s; AWC.key=k; }
  AWC.lim={min:AWC.fit*0.85,max:90};
  awcClamp(AWC.V,sh,W,H); awcPaint();
}
function awcPaint(){
  const cv=$('#awcCv'), sh=awkShapeOf(AWC.set); if(!sh||!AWC.V) return; const g=cv.getContext('2d'); if(!g) return;
  const cs=awcChars(true).find(c=>c.k===AWC.set)||{name:'',col:'#d9b26a',initial:'?'}, labels={}; for(const l of sh.limbs) labels[l]=awcSkillName(AWC.set,l);
  g.setTransform(Math.min(2,window.devicePixelRatio||1),0,0,Math.min(2,window.devicePixelRatio||1),0,0);
  AWC.M={shape:sh,V:AWC.V,st:AWC.st,sel:AWC.sel,name:cs.name,col:cs.col,initial:cs.initial,img:awcImg(AWC.set),labels,pulse:AWC.pulse,hits:AWC.hits,avoid:[[AWC.W-56,0,AWC.W,150]]};   // avoid: the zoom buttons' corner, where no limb label may go
  awcDraw(g,AWC.W,AWC.H,AWC.M); AWC.drawn=AWC.hits.length;
}
function awcZoom(k,px,py){ if(!AWC.V) return; const sh=awkShapeOf(AWC.set); awcZoomAt(AWC.V,px===undefined?AWC.W/2:px,py===undefined?AWC.H/2:py,k,AWC.lim); awcClamp(AWC.V,sh,AWC.W,AWC.H); awcPaint(); }
function awcFocusLimb(limb){
  const sh=awkShapeOf(AWC.set); if(!sh||!AWC.V) return;
  const V=awcFitBox(awcLimbBox(sh,limb),AWC.W,AWC.H,{l:8,r:8,t:8,b:8}); V.s=Math.min(60,Math.max(AWC.lim.min,V.s)); AWC.V=V; AWC.V.kx=Math.min(AWC.V.kx||1,1.15);
  const next=sh.nodes.find(n=>n.limb===limb&&n.kind!=='star'&&AWC.st[n.id]!=='own'); AWC.sel=next?next.id:AWC.sel;   // the next node to buy on that limb
  awcRender();
}
function awcTap(px,py){
  const h=awcPickHit(AWC.hits,px,py,isTouch?16:11); if(!h) return null;
  AWC.sel=h.id; AWT.open=null; awcRender(); return h.id;
}
// ---- buying ----
function awcBuy(){
  const k=AWC.set, sh=awkShapeOf(k), n=sh&&AWC.sel?awkNode(sh,AWC.sel):null; if(!n) return false;
  const S=awcStatus(k,n); if(S.st!=='buy'){ toast(S.why||'You cannot buy this yet','bad'); UI_SFX.error(); return false; }
  netSend({t:'awk',a:n.kind==='stat'?'stat':'up',set:k,id:n.id}); AWC.wait=performance.now(); setTimeout(awcRender,1600); awcRender(); return true;
}
function awcTierUp(){
  const k=AWC.set, I=awcTierInfo(k); if(!I.next||!I.next.can){ toast(I.next?(I.next.lvOk?'You cannot pay for A'+I.next.t+' yet':'Awakening A'+I.next.t+' needs hiker level '+I.next.lv):'Already fully awakened','bad'); UI_SFX.error(); return false; }
  if(!(AWC.confirm&&performance.now()<AWC.confirm)){ AWC.confirm=performance.now()+4000; setTimeout(awcRender,4100); awcRender(); return 'confirm'; }   // a tier costs a lot: the first tap asks, the second spends
  AWC.confirm=0; netSend({t:'awk',a:'tier',set:k}); AWC.wait=performance.now(); setTimeout(awcRender,1600); awcRender(); return true;
}
// the awk event (net/client.js): something of yours was bought; the you message that follows has the new gear
function awcOnAwk(set,what,tier){
  UI_SFX.success(); AWC.wait=0; AWC.confirm=0;
  if($('#awc').hidden) return;
  if(what!=='t'&&set===AWC.set) { AWC.pulse={id:what,t0:performance.now(),k:0}; awcPulseLoop(); }
  awcRender();
}
function awcPulseLoop(){
  const p=AWC.pulse; if(!p) return; p.k=Math.min(1,(performance.now()-p.t0)/900);
  if(!$('#awc').hidden) awcPaint();
  if(p.k>=1){ AWC.pulse=null; if(!$('#awc').hidden) awcPaint(); return; }
  requestAnimationFrame(awcPulseLoop);
}
// ---- the events of the page's own controls (set up once, when the panel first opens) ----
function awcBind(){
  if(AWC.bound) return; AWC.bound=true;
  const cv=$('#awcCv'), pos=e=>{ const r=cv.getBoundingClientRect(); return [e.clientX-(r.left||0),e.clientY-(r.top||0)]; };
  const pinchDist=()=>{ const p=[...AWC.ptr.values()]; return {d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)||1,mx:(p[0].x+p[1].x)/2,my:(p[0].y+p[1].y)/2}; };
  cv.addEventListener('pointerdown',e=>{
    const [x,y]=pos(e); try{ if(cv.setPointerCapture) cv.setPointerCapture(e.pointerId); }catch(_){}
    AWC.ptr.set(e.pointerId,{x,y,x0:x,y0:y,moved:false}); if(AWC.ptr.size===2){ AWC.pinch=pinchDist(); AWC.moved=true; } else if(AWC.ptr.size===1) AWC.moved=false;
  });
  cv.addEventListener('pointermove',e=>{
    const p=AWC.ptr.get(e.pointerId); if(!p||!AWC.V) return; const [x,y]=pos(e), sh=awkShapeOf(AWC.set);
    if(AWC.ptr.size>=2){ p.x=x; p.y=y; const q=pinchDist(), o=AWC.pinch||q; awcZoomAt(AWC.V,q.mx,q.my,q.d/o.d,AWC.lim); AWC.V.ox+=q.mx-o.mx; AWC.V.oy+=q.my-o.my; AWC.pinch=q; awcClamp(AWC.V,sh,AWC.W,AWC.H); awcPaint(); return; }
    if(!p.moved&&Math.hypot(x-p.x0,y-p.y0)<7) return; p.moved=true; AWC.moved=true;
    AWC.V.ox+=x-p.x; AWC.V.oy+=y-p.y; p.x=x; p.y=y; awcClamp(AWC.V,sh,AWC.W,AWC.H); awcPaint();
  });
  const up=e=>{ const p=AWC.ptr.get(e.pointerId); AWC.ptr.delete(e.pointerId); if(AWC.ptr.size<2) AWC.pinch=null; if(p&&!p.moved&&!AWC.moved&&e.type==='pointerup') awcTap(p.x0,p.y0); if(!AWC.ptr.size) AWC.moved=false; };
  cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{ e.preventDefault(); const [x,y]=pos(e); awcZoom(e.deltaY<0?1.18:1/1.18,x,y); },{passive:false});
  $('#awcZin').addEventListener('click',()=>awcZoom(1.4)); $('#awcZout').addEventListener('click',()=>awcZoom(1/1.4)); $('#awcFit').addEventListener('click',()=>{ AWC.V=null; awcCanvas(true); });
  $('#awc').addEventListener('click',e=>{   // the picker, the limb chips, Buy and the tier button (their markup is rebuilt, so one listener on the panel)
    const t=e.target&&e.target.closest?e.target.closest('[data-awcset],[data-awclimb],[data-awcbuy],[data-awctier]'):null; if(!t||t.disabled) return;
    if(t.dataset.awcset) awcSetChar(t.dataset.awcset); else if(t.dataset.awclimb) awcFocusLimb(t.dataset.awclimb); else if(t.dataset.awcbuy) awcBuy(); else if(t.dataset.awctier) awcTierUp();
  });
  addEventListener('resize',()=>{ if(!$('#awc').hidden&&AWC.tab==='awk') awcCanvas(true); });
}
