//@ Skill-set procs on the client: a set bonus that fires shows its name as a badge, a rune ring at the wearer and a streak of motes to its target; a refunded cooldown flashes its slot
/* Agent map. The server sends proc [pid, rowId, monId] when a triggered bonus row with a chance, a cooldown or a streak fires (ssTriggerS, server/skillsets.js); applyEvent (net/client.js) calls ssOnProc.
   The badge (a pill over the action bar) is for your own procs; everyone's procs draw the ring and the streak in their set's colours. A look may draw its own with L.proc(L,o,row,mon).
   ssOnCdr (economy/skillsets.js) calls sspFlashSlot. Test: client-smoke. */
const SSP={box:null, last:new Map(), shown:0};
function sspHex(n){ return '#'+(n>>>0).toString(16).padStart(6,'0'); }
function sspRow(rowId){   // the set and the bonus row a proc names (a bonus row "<set>_b<tier>" or a triggered passive "<set>_p<n>")
  if(typeof rowId!=='string') return null;
  const S=SS_SETS[rowId.split('_')[0]]; if(!S) return null;
  for(const t of Object.keys(S.bonus)) if(S.bonus[t].id===rowId) return {set:S,row:S.bonus[t]};
  const P=Object.prototype.hasOwnProperty.call(PASSIVES,rowId)?PASSIVES[rowId]:null;   // (a set's triggered passive: its id is "<set>_p<n>")
  return P&&P.set===S.id&&P.on?{set:S,row:P}:null;
}
function sspBadge(set,row){
  if(!SSP.box){ SSP.box=document.createElement('div'); SSP.box.id='sspBox'; document.body.appendChild(SSP.box); }
  if(SSP.shown>=3) return;
  const b=document.createElement('div'); b.className='ssp-b'; b.style.setProperty('--c',sspHex(set.pal.accent));
  const dot=document.createElement('i'), nm=document.createElement('b'); nm.textContent=row.name; b.appendChild(dot); b.appendChild(nm); SSP.box.appendChild(b); SSP.shown++;
  setTimeout(()=>{ b.remove(); SSP.shown--; },1500);
}
function sspStreak(L,o,mon){   // motes fly from the wearer's chest to the monster, one after the other, and flash where they land
  const y0=(o.y||getH(o.x,o.z))+1.2, y1=mon.y+mon.T.height*mon.s*0.6, N=7, col=L.hot;
  for(let i=0;i<N;i++) fxpLater(i*0.03,()=>{ const q=(i+1)/N, a=1-q; fxpAdd(o.x*a+mon.x*q,y0*a+y1*q+Math.sin(q*Math.PI)*0.5,o.z*a+mon.z*q,0,0.2,0,i%2?L.hot2:col,0.3,0.35); });
  fxpLater(N*0.03,()=>{ fxpFlare(mon.x,y1,mon.z,col,1.0,0.3); fxpSparks(mon.x,y1,mon.z,L.hot2,6,2.6,{up:0.8,size:0.15,life:0.4}); });
}
function ssOnProc(pid,rowId,monId){
  const info=sspRow(rowId), o=info&&sslWho(pid); if(!o) return;
  const key=pid+'|'+rowId, now=performance.now(); if(now-(SSP.last.get(key)||0)<180) return; SSP.last.set(key,now);   // (a row that fires on every hit of a swing shows once)
  const L=SSL.looks[info.set.id], mon=monId?MON_BY_ID.get(monId):null, y=o.y||getH(o.x,o.z);
  if(pid===NET.pid) sspBadge(info.set,info.row);
  if(L&&L.proc){ L.proc(L,o,info.row,mon); return; }
  const col=info.set.pal.accent; spawnRingAt(o.x,y+0.15,o.z,1.3,L?L.hot:col);
  if(L){ fxpSparks(o.x,y+1.2,o.z,L.hot2,5,1.8,{up:1.2,size:0.14,life:0.45}); if(mon&&!mon.dead) sspStreak(L,o,mon); }
}
function sspFlashSlot(slot){   // a cooldown refund: the slot's tile flashes
  const el=slot==='basic'?abBasic:slot==='skill'?abSkill:slot==='burst'?abBurst:null; if(!el) return;
  el.classList.remove('proc-flash'); void el.offsetWidth; el.classList.add('proc-flash'); setTimeout(()=>el.classList.remove('proc-flash'),650);
}
