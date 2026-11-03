//@ The Deep Cave's objective guide: which method place to go to next on a floor (the one in progress first, else the nearest that still teaches a skill), the HUD line with its distance and direction, and the method letters on the cave maps
/* Agent map. Doc: docs/WAYPOINT.md (the cave section), docs/CAVE.md section 6 (the methods). Client only: reads the server's cm message (CAVE_M.s, cave/methods.js), the floor's anchors (CAVE_RUN.B.anchors,
   floor-local metres + R.ox / R.oz) and GEAR.cave.own; nothing is sent or saved.
   exports: CVW.track / cvwSetTrack('n:M') (the board's Track buttons: that method is the one the guide points at on its floor), cvwPick() -> {T:{x,z,name}, m (method letter), line} or null (off the floors), cvwTarget() (ui/waypoint.js: the marker), cvwHud() (writes #cvMethod: the server's line, else "Next: ..."; plus the distance),
            cvwFrame(dt) (cave/methods.js caveMethodsFrame: the line again twice a second, as you walk), cvwMapMarks(x, at, inside, dpr, labels) (cave/minimap.js caveMapMarks: a letter on each method's place).
   The order: a method you are in the middle of (any in progress first), then the tracked one, (lantern carried, silent chamber, open vault, mole running, mural pieces, geodes, crafting) points at its next spot; otherwise the nearest method that is not
   resting and teaches a skill you do not own (one that pays only Echo Shards counts three times as far). The gem mole (G) has no fixed place: it shows only while a mole runs.
   Test: tools/client-smoke.js (the cave case). */
const CVW={t:0,last:null,track:null};   // track: 'n:M' (floor and method letter) the hiker chose on the board, kept in this browser
try{ const v=localStorage.getItem('wildwood-cavetrack'); if(/^[1-9]:[A-H]$/.test(v||'')) CVW.track=v; }catch(_){}
function cvwSetTrack(v){ CVW.track=CVW.track===v?null:v; try{ if(CVW.track) localStorage.setItem('wildwood-cavetrack',CVW.track); else localStorage.removeItem('wildwood-cavetrack'); }catch(_){}
  document.querySelectorAll('[data-cvtrack]').forEach(b=>{ const on=b.dataset.cvtrack===CVW.track; b.classList.toggle('on',on); b.textContent=on?'Tracked':'Track'; }); cvwHud(); }
// the board's Track buttons (cave/methods.js caveBoardHtml draws them in the lift window and the skills panel): one listener for every board
document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('[data-cvtrack]'); if(!b) return; e.preventDefault(); cvwSetTrack(b.dataset.cvtrack); if(typeof UI_SFX!=='undefined') UI_SFX.click(); });
const cvwBit=(v,i)=>((v||0)>>i)&1;
function cvwNear(list,skip){ let best=null,bd=1e9; (list||[]).forEach((a,i)=>{ if(!a||(skip&&skip(i))) return; const d=Math.hypot(a.wx-P.x,a.wz-P.z); if(d<bd){ bd=d; best=a; } }); return best; }
function cvwPick(){
  const R=typeof CAVE_RUN!=='undefined'?CAVE_RUN:null, s=typeof caveMState==='function'?caveMState():null; if(!R||!R.B||!R.B.anchors) return null;
  const A=R.B.anchors, W=(a,name)=>a?{x:R.ox+a.x,z:R.oz+a.z,name}:null, L=list=>(list||[]).map(a=>a&&Object.assign({wx:R.ox+a.x,wz:R.oz+a.z},a));
  const S=s||{}, rest=m=>!!(S.cd&&S.cd[m]>0), own=(GEAR&&GEAR.cave&&GEAR.cave.own)||{}, H=caveMethodDef('H'), HP=H&&H.p||{ore:3,herb:2};
  const go=(m,T,line)=>T?{T,m,line}:null;
  // a method in progress: its next spot
  if(S.d&&S.d.s) return go('D',W(A.D&&A.D.altar,'The altar'),null);
  if(S.e&&S.e.s) return go('E',W(A.E&&A.E.shrine,'The shrine'),null);
  if(S.fv&&S.fv.o>0&&!rest('F')) return go('F',W(A.F&&A.F.vault,'The vault'),null);
  if(S.g&&!rest('G')){ const mo=MONS.find(x=>x.id===S.g&&!x.dead); if(mo) return go('G',{x:mo.x,z:mo.z,name:'The gem mole'},null); }
  if(S.a&&!rest('A')){ if(S.a===31) return go('A',W(A.A&&A.A.wall,'The mural wall'),null); const p=cvwNear(L(A.A&&A.A.pieces),i=>cvwBit(S.a,i)); if(p) return go('A',{x:p.wx,z:p.wz,name:'A mural piece'},null); }
  if(S.b&&S.b.some(v=>v===1)&&!rest('B')){ const p=cvwNear(L(A.B&&A.B.geodes),i=>S.b[i]===1); if(p) return go('B',{x:p.wx,z:p.wz,name:'A geode'},null); }
  if(S.h&&(S.h.o||S.h.b)&&!rest('H')){
    if(S.h.o>=HP.ore&&S.h.b>=HP.herb) return go('H',W(A.H&&A.H.anvil,'The stone anvil'),null);
    const p=S.h.o<HP.ore?cvwNear(L(A.H&&A.H.veins),i=>cvwBit(S.h.vm,i)):cvwNear(L(A.H&&A.H.herbs),i=>cvwBit(S.h.hm,i)); if(p) return go('H',{x:p.wx,z:p.wz,name:S.h.o<HP.ore?'A glow vein':'A cave herb'},null);
  }
  // the method you chose to track on the board, while it is not resting (its in-progress spot above wins only for that method; the others wait)
  const tm=CVW.track&&+CVW.track[0]===R.n?CVW.track[2]:null;
  if(tm&&!rest(tm)){ const pl=cvwPlace(A,tm,L,W), M=caveMethodDef(tm), sk=caveSkillAt(R.n,tm); if(pl) return {T:pl,m:tm,line:'Tracked: '+(M?M.name:tm)+(sk?' ('+sk.name+')':'')+'. '+(M?M.short:''),tracked:true}; }
  // nothing under way: the nearest place that still teaches something
  let best=null, bs=1e9;
  for(const m of 'ABCDEFH'){
    if(rest(m)) continue;
    const pl=cvwPlace(A,m,L,W); if(!pl) continue;
    const sk=caveSkillAt(R.n,m), mine=!sk||Object.prototype.hasOwnProperty.call(own,sk.id), d=Math.hypot(pl.x-P.x,pl.z-P.z)*(mine?3:1);
    if(d<bs){ bs=d; const M=caveMethodDef(m); best={T:pl,m,line:'Next: '+(M?M.name:m)+(sk&&!mine?' (teaches '+sk.name+')':' (Echo Shards)')+'. '+(M?M.short:'')}; }
  }
  return best;
}
// where a method starts: the place a hiker walks to first
function cvwPlace(A,m,L,W){
  if(m==='A'){ const p=cvwNear(L(A.A&&A.A.pieces)); return p?{x:p.wx,z:p.wz,name:'Mural pieces'}:null; }
  if(m==='B'){ const p=cvwNear(L(A.B&&A.B.geodes)); return p?{x:p.wx,z:p.wz,name:'A geode'}:null; }
  if(m==='C') return W(A.C&&A.C.plinth,'The echo plinth');
  if(m==='D') return W(A.D&&A.D.crystal,'The glow crystal');
  if(m==='E') return W(A.E&&A.E.entry,'The silent chamber');
  if(m==='F') return W(A.F&&A.F.seal,'The sealed vault (opens with a tremor)');
  if(m==='H'){ const p=cvwNear(L(A.H&&A.H.veins)); return p?{x:p.wx,z:p.wz,name:'Glow veins'}:null; }
  return null;
}
const cvwTarget=()=>{ const r=cvwPick(); return r?r.T:null; };
function cvwHud(){
  const el=$('#cvMethod'); if(!el) return;
  const s=typeof caveMState==='function'?caveMState():null, r=s?cvwPick():null; CVW.last=r;
  let txt=(s&&s.hud)||(r&&r.line)||'';
  if(txt&&r&&r.T){ const d=Math.hypot(r.T.x-P.x,r.T.z-P.z); if(d>=6) txt+=' · '+Math.round(d)+' m '+dirWord(r.T.x-P.x,r.T.z-P.z); }
  el.textContent=txt; el.hidden=!txt;
}
function cvwFrame(dt){ CVW.t-=dt; if(CVW.t>0) return; CVW.t=0.5; cvwHud(); }
// the maps: a letter on the place of each method that is not resting (gold: teaches a skill you do not own; grey: Echo Shards only) and a ring round the one the guide points at
function cvwMapMarks(x,at,inside,dpr,labels){
  const R=CAVE_RUN; if(!R||!R.B||!R.B.anchors) return;
  const A=R.B.anchors, s=caveMState()||{}, own=(GEAR&&GEAR.cave&&GEAR.cave.own)||{}, L=list=>(list||[]).map(a=>a&&Object.assign({wx:R.ox+a.x,wz:R.oz+a.z},a)), W=(a,name)=>a?{x:R.ox+a.x,z:R.oz+a.z,name}:null, cur=CVW.last;
  x.font=`700 ${9*dpr}px "Alegreya Sans", system-ui, sans-serif`; x.textAlign='center'; x.textBaseline='middle';
  for(const m of 'ABCDEFH'){
    if(s.cd&&s.cd[m]>0) continue;
    const pl=cvwPlace(A,m,L,W); if(!pl||!inside(pl.x,pl.z)) continue;
    const sk=caveSkillAt(R.n,m), fresh=sk&&!Object.prototype.hasOwnProperty.call(own,sk.id), [a,b]=at(pl.x,pl.z), r=6*dpr;
    x.beginPath(); x.arc(a,b,r,0,TAU); x.fillStyle=fresh?'rgba(70,50,10,.85)':'rgba(30,30,30,.8)'; x.fill(); x.lineWidth=1.5*dpr; x.strokeStyle=fresh?'#ffd27a':'#9a9a9a'; x.stroke();
    x.fillStyle=fresh?'#ffe9b0':'#cfcfcf'; x.fillText(m,a,b+0.5*dpr);
    if(labels&&fresh) labels(sk.name,a,b+13*dpr,'#ffe9b0');
  }
  if(cur&&cur.T&&inside(cur.T.x,cur.T.z)){ const [a,b]=at(cur.T.x,cur.T.z); x.beginPath(); x.arc(a,b,10*dpr,0,TAU); x.lineWidth=2*dpr; x.strokeStyle='#fff4d0'; x.stroke(); }
}
