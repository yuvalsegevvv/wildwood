//@ A run's HUD: the mission's title, lines and bar (dgHudText of the dg tuple) with the run's clock, the objectives' labels and compass arrows, the boss hall's arrow, the use / revive / relight / portal prompt and key, the leave button, the downed screen, the results panel, and the Testing tools' Dungeons row
/* agent map
   exports: dgHudEnter(R) / dgHudLeave() (run.js), dgHudTick(dt) (run.js dgFrame), dgObjLabel(o, remove) (run.js, dgo), dgResultShow(e) (run.js, dge), dgDownText(R), dgUseNear() -> {k, ...} | null,
            dgUsePrompt(promptEl, bTalk), dgUseKey() (village/talking.js: the prompt and the talk key, through two marked lines), DG_HUD_EL, DG_USE_KINDS / DG_PCT_KINDS
   users: run.js; village/talking.js; reads DG_RUN, DG_VIEW, dgPartyState, DG_OBJ_KINDS / dgHudText (shared/dungeon-hud.js: all mission text comes from there, none is written here)
   messages out: dg{a:'use',id} (an objective within its reach), dg{a:'use'} (a dark lamp in Haugbui's hall: the boss kit's use), dg{a:'revive',id} (a downed teammate within 2.5 m), dg{a:'leave'}
            (the portal, pressed twice; the Leave button, tapped twice; the results' Leave now); dev{cmd:'dg',v:'<theme>:<mission>'} (the testing row)
   markup: #dgHud, #dgArrows, #dgResult in index.html, the row #tDgTheme / #tDgMission / #tDgGo in #tSec; styles/24-dungeon.css
   test: tools/client-smoke.js (the HUD text from a dg snapshot, the results panel), tools/dungeon-client-smoke.js (labels, arrows, prompts, downed screen, results)
   Reach: an objective its kind's r (DG_OBJ_KINDS, else DG_OBJ_R 3) + 1.2 m from its middle (the server: ob.r + 1.5, dgUseP), a teammate 2.5 m (DG_REVIVE_R), a lamp 2.8 m (DG_LAMP_REACH 3), the portal 2.5 m. */
/* which objective kinds the talk key uses, and whose v is a share (a bar under the label): read from DG_OBJ_KINDS[kind].use / .pct when the kinds carry them, else these (the kits' onUse:
   Defense's and Survival's chests, Survival's flasks, Sabotage's heartroots, Escort's captive; v is a health or fill % for the stone, the captive and the altar: shared/dungeon-hud.js) */
const DG_USE_KINDS={chest:'open',flask:'take',heartroot:'break',captive:'free'}, DG_PCT_KINDS={stone:1,captive:1,altar:1};
const dgObjUse=kind=>{ const K=DG_OBJ_KINDS[kind]; return K&&K.use!==undefined?K.use:DG_USE_KINDS[kind]||''; };
const dgObjPct=kind=>{ const K=DG_OBJ_KINDS[kind]; return K&&K.pct!==undefined?!!K.pct:!!DG_PCT_KINDS[kind]; };
const DG_OBJ_R=3, DG_HUD_EL={on:false,lbls:new Set(),arrows:[],last:'',portalT:0,leaveT:0,down0:null,downTxt:'',endAt:0};
const dgClockText=s=>{ s=Math.max(0,Math.floor(s)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
function dgHudEnter(R){
  const H=DG_HUD_EL; H.on=true; H.last=''; H.portalT=0; H.leaveT=0;
  $('#dgHud').hidden=false; $('#dgResult').hidden=true; $('#dgLeave').textContent='Leave';
  if(!H.down0){ const d=$('#down'); H.down0=[d.querySelector('b').textContent,d.querySelector('span').textContent]; }
  dgHudTick(0);
}
function dgHudLeave(){
  const H=DG_HUD_EL; H.on=false; $('#dgHud').hidden=true; $('#dgArrows').innerHTML=''; H.arrows=[];
  for(const e of H.lbls) e.remove(); H.lbls.clear();
  if(H.down0){ const d=$('#down'); d.querySelector('b').textContent=H.down0[0]; d.querySelector('span').textContent=H.down0[1]; }
  if(!$('#dgResult').hidden){ $('#dgResultGo').textContent='Close'; setTimeout(()=>{ if(!DG_RUN) $('#dgResult').hidden=true; },12000); }   // (the results stay a while in the world, to be read)
}
// an objective's floating label (name, and its number as a bar when it is a share): a DOM tag like the name tags, placed every frame
function dgObjLabel(o,remove){
  if(remove){ if(o.lbl){ o.lbl.remove(); DG_HUD_EL.lbls.delete(o.lbl); o.lbl=null; } return; }
  if(!o.lbl){ const e=document.createElement('div'), b=document.createElement('b'), bar=document.createElement('i'), fill=document.createElement('i'); e.className='dg-olbl'; bar.append(fill); e.append(b,bar);
    e.dgName=b; e.dgBar=bar; e.dgFill=fill; document.body.append(e); o.lbl=e; DG_HUD_EL.lbls.add(e); }
  const K=DG_OBJ_KINDS[o.kind]||{}, e=o.lbl; e.dgName.textContent=dgObjName(o.kind,DG_RUN&&DG_RUN.th)+(o.st===2?' (done)':''); e.style.color=o.st===2?'#9fe08a':K.col||'#ffd27a';
  e.dgBar.hidden=!(o.st===1&&dgObjPct(o.kind)); if(!e.dgBar.hidden) e.dgFill.style.width=Math.round(clamp(o.v/100)*100)+'%';
}
// what the talk key would do here: revive a downed teammate, use an objective, relight a dark lamp, leave by the portal (the nearest wins, in that order)
function dgUseNear(){
  const R=DG_RUN; if(!R||PL.dead) return null;
  let best=null;
  for(const r of REMOTES.values()){ if(!r.dead||r.tx===null) continue; const d=Math.hypot(r.x-P.x,r.z-P.z); if(d<=2.4&&(!best||d<best.d)) best={k:'revive',id:r.id,name:r.name,d}; }
  if(!best) for(const o of R.objs.values()){ const verb=dgObjUse(o.kind); if(o.st!==1||!verb) continue; const d=Math.hypot(o.x-P.x,o.z-P.z), K=DG_OBJ_KINDS[o.kind]||{}; if(d<=(K.r||DG_OBJ_R)+1.2&&(!best||d<best.d)) best={k:'obj',id:o.id,name:dgObjName(o.kind,R.th),verb:typeof verb==='string'?verb:'use',d}; }
  if(!best) for(const m of MONS){ if(m.dead||m.def.id!==DG_BOSS_DEFS.haugbui.prop.id||m.mat.userData.glow.getHex()) continue; const d=Math.hypot(m.x-P.x,m.z-P.z); if(d<=2.8&&(!best||d<best.d)) best={k:'lamp',d}; }
  if(!best&&R.B&&R.B.start){ const d=Math.hypot(R.ox+R.B.start.x-P.x,R.oz+R.B.start.z-P.z); if(d<=2.5) best={k:'portal',d}; }
  return best;
}
function dgUsePrompt(el,btn){
  const u=dgUseNear(); if(!u) return; const tk=kbName('talk')||'the talk key', again=t-DG_HUD_EL.portalT<3;
  const txt=u.k==='revive'?'revive '+u.name:u.k==='obj'?u.verb+' '+u.name:u.k==='lamp'?'relight the lamp':again?'leave the dungeon (press again)':'leave the dungeon';
  el.textContent=isTouch?'':'Press '+tk+' to '+txt; el.hidden=isTouch; btn.textContent=u.k==='revive'?'Revive':u.k==='lamp'?'Relight':u.k==='portal'?'Leave':u.verb[0].toUpperCase()+u.verb.slice(1);
}
function dgUseKey(){
  const u=dgUseNear(); if(!u) return;
  if(u.k==='revive') netSend({t:'dg',a:'revive',id:u.id});
  else if(u.k==='obj') netSend({t:'dg',a:'use',id:u.id});
  else if(u.k==='lamp') netSend({t:'dg',a:'use'});
  else if(t-DG_HUD_EL.portalT<3){ netSend({t:'dg',a:'leave'}); DG_HUD_EL.portalT=0; }
  else { DG_HUD_EL.portalT=t; toast('Press '+(kbName('talk')||'the talk key')+' again to leave the dungeon (what you found stays yours).',''); }
  UI_SFX.click();
}
$('#dgLeave').addEventListener('click',e=>{
  const b=e.currentTarget; if(t-DG_HUD_EL.leaveT>4){ DG_HUD_EL.leaveT=t; b.textContent='Tap again to leave'; return; }
  DG_HUD_EL.leaveT=0; b.textContent='Leave'; netSend({t:'dg',a:'leave'}); UI_SFX.click();
});
// the downed screen's line: the bleed-out clock (DG_DOWN_SHOW from your down event) and the respawns left (counted here: the server does not send them)
function dgDownText(R){
  const left=Math.ceil(DG_DOWN_SHOW-(t-(R.downAt||t))), n=R.respawns;
  if(left>0) return 'A teammate can revive you · '+(n?'back at the entrance in '+left+' s ('+n+(n>1?' respawns':' respawn')+' left)':'no respawns left: out in '+left+' s');
  return n?'Waking at the entrance…':'You are out of this run: wait for the others, or leave (the Leave button).';
}
// the results: dge [pid, 1 won | 0 lost, seconds, xp, coins, [item ids], materials, why]
function dgResultShow(e){
  const won=!!e[2], items=Array.isArray(e[6])?e[6]:[], box=$('#dgResultItems');
  $('#dgResultTitle').textContent=won?'Cleared!':'The run is lost'; $('#dgResult').classList.toggle('lost',!won);
  $('#dgResultWhy').textContent=won?'':String(e[8]||''); $('#dgResultWhy').hidden=won||!e[8];
  $('#dgResultStats').textContent='Time '+dgClockText(+e[3]||0)+' · '+Math.round(+e[4]||0)+' XP · '+(e[5]|0)+' coins · '+(e[7]|0)+' materials';
  box.innerHTML=''; if(!items.length) box.append(Object.assign(document.createElement('span'),{className:'dgr-none',textContent:'No items this time.'}));
  for(const id of items){ const it=ITEM[id], s=document.createElement('span'); s.className='dgr-it'; s.textContent=it?it.name:String(id); if(it) s.style.color=RAR_COL[it.rar]||''; box.append(s); }
  DG_HUD_EL.endAt=performance.now(); $('#dgResultGo').textContent='Leave now'; $('#dgResult').hidden=false; won?UI_SFX.success():UI_SFX.notify();
}
$('#dgResultGo').addEventListener('click',()=>{ if(DG_RUN) netSend({t:'dg',a:'leave'}); $('#dgResult').hidden=true; UI_SFX.click(); });
function dgHudTick(dt){
  const R=DG_RUN, H=DG_HUD_EL; if(!R||!H.on) return;
  // the mission's words and bar (shared/dungeon-hud.js) and the clock
  const tx=dgHudText(R.m,R.dg,R.th), key=JSON.stringify(tx);
  if(key!==H.last){ H.last=key;
    $('#dgHudTitle').textContent=tx.title; const ls=$('#dgHudLines'); ls.innerHTML=''; for(const l of tx.lines||[]){ const d=document.createElement('div'); d.textContent=l; ls.append(d); }
    $('#dgHudBarBox').hidden=!tx.bar; if(tx.bar){ $('#dgHudBar').style.width=Math.round(100*clamp(tx.bar.v/Math.max(1e-6,tx.bar.max)))+'%'; $('#dgHudBar').style.background=tx.bar.col||''; $('#dgHudBarLbl').textContent=tx.bar.label||''; }
    $('#dgHud').classList.toggle('warn',!!tx.warn); }
  const clk=dgClockText(R.end?0:dgRunClock()); if(!R.end&&$('#dgHudTime').textContent!==clk) $('#dgHudTime').textContent=clk;
  $('#dgHud').classList.toggle('dg-boss',!$('#bossbar').hidden);
  const zn=R.T?R.T.name:'A dungeon'; if($('#zone').textContent!==zn) $('#zone').textContent=zn;
  // labels over the objectives, arrows round the middle of the screen toward the active ones and the boss's hall
  for(const o of R.objs.values()){ if(!o.lbl) continue; const s=toScreen(o.x,R.y+3.2,o.z), d=Math.hypot(o.x-P.x,o.z-P.z); o.lbl.hidden=!s||d>45; if(s&&!o.lbl.hidden) o.lbl.style.transform=`translate(${s[0]}px,${s[1]}px) translate(-50%,-100%)`; }
  const targets=[]; for(const o of R.objs.values()) if(o.st===1&&!dgObjUse(o.kind)) targets.push({x:o.x,z:o.z,col:(DG_OBJ_KINDS[o.kind]||{}).col||'#ffd27a'});   // (what you seek; not what you pick up on the way: chests, flasks)
  if(R.boss&&R.dg[0]===1&&Math.hypot(R.boss.x-P.x,R.boss.z-P.z)>R.boss.r) targets.push({x:R.boss.x,z:R.boss.z,col:'#c86bff'});
  const box=$('#dgArrows'); while(H.arrows.length<targets.length){ const a=document.createElement('div'), tip=document.createElement('i'), txt=document.createElement('span'); a.className='dg-arrow'; a.append(tip,txt); a.dgTip=tip; a.dgTxt=txt; box.append(a); H.arrows.push(a); }
  const f=Math.atan2(-Math.sin(P.yaw),-Math.cos(P.yaw)), cx=innerWidth/2, cy=innerHeight/2, rx=Math.min(innerWidth*0.4,360), ry=Math.min(innerHeight*0.36,260);
  H.arrows.forEach((a,i)=>{ const T=targets[i]; a.hidden=!T||PL.dead; if(a.hidden) return;
    const dx=T.x-P.x, dz=T.z-P.z, d=Math.hypot(dx,dz), rel=f-Math.atan2(dx,dz);
    a.style.transform=`translate(${cx+Math.sin(rel)*rx}px,${cy-Math.cos(rel)*ry}px) translate(-50%,-50%)`; a.dgTip.style.transform=`rotate(${rel}rad)`; a.dgTip.style.borderBottomColor=T.col;
    const dt2=Math.round(d)+' m'; if(a.dgTxt.textContent!==dt2) a.dgTxt.textContent=dt2; a.style.opacity=d<6?'0.35':'1'; });
  // down: the bleed-out clock and the respawns left
  if(PL.dead){ if(!R.downAt) R.downAt=t; const d=$('#down'), s=dgDownText(R); if(H.downTxt!==s){ H.downTxt=s; d.querySelector('b').textContent='You are down'; d.querySelector('span').textContent=s; } }
  else { R.downAt=0; H.downTxt=''; }
  if(!$('#dgResult').hidden&&H.endAt){ const left=Math.max(0,Math.ceil(DG_END_SHOW-(performance.now()-H.endAt)/1000)), s='Back at the door in '+left+' s'; if($('#dgResultLeft').textContent!==s) $('#dgResultLeft').textContent=s; }
}
// the Testing tools' row: any theme (the bare test set too) and any of the seven missions; the server answers a mission without a kit with a toast
{ const th=$('#tDgTheme'), mi=$('#tDgMission'), opt=(v,txt)=>`<option value="${v}">${txt}</option>`;
  th.innerHTML=Object.keys(DG_THEMES).map(k=>opt(k,DG_THEMES[k].name)).join(''); mi.innerHTML=Object.keys(DG_MISSIONS).map(k=>opt(k,DG_MISSIONS[k].name)).join('');
  th.value=Object.keys(DG_THEMES).find(k=>!DG_THEMES[k].dev)||'bare'; mi.value='purge';
  $('#tDgGo').addEventListener('click',()=>netSend({t:'dev',cmd:'dg',v:(th.value||'bare')+':'+(mi.value||'purge')})); }
