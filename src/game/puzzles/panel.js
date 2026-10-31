//@ The puzzle panel: opens a board the server announced (kind, difficulty, seed), builds it from the shared generator, keeps the clock and an unfinished board on the device, sends the answer, shows the chest
/* Agent map (docs/PUZZLES.md). NETH.pz handles {t:'pz', a:'open'|'no'|'done'} from server/puzzles.js. PZV.<kind> = {mount(host,B,api,saved)} registers a kind's view (puzzles/rootlines.js, puzzles/ice.js);
   api = {solved(ans), save(state), undo/reset buttons call view.undo() / view.reset()}. An unfinished board is kept in localStorage 'wwpz:<kind>:<diff>:<seed>' (the seed is the board, so it resumes until the stone renews).
   The chest window draws the chest of the difficulty (pzChestSvg: five tiers, a first-time look and a renewable look). Markup #puzzle in index.html, styles 33-puzzles.css. Test: tools/puzzles-smoke.js (server), client-smoke (loads). */
const PZV=Object.create(null);
let PZ_CUR=null, PZ_TIMER=0;
const pzKey=m=>'wwpz:'+m.kind+':'+m.diff+':'+m.seed;
const pzFmt=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
NETH.pz=m=>{
  if(m.a==='open') pzStart(m);
  else if(m.a==='no') toast(String(m.why||'Not now'),'bad');
  else if(m.a==='done') pzDone(m);
};
function pzStart(m){
  openPanel('puzzle'); const host=$('#pzHost'); host.innerHTML='<p class="muted pz-wait">Weaving the board…</p>'; $('#pzMsg').textContent='';
  $('#pzTitle').textContent=(PZ_KINDS[m.kind]?PZ_KINDS[m.kind].name:m.kind)+' · '+PZ_DIFF[m.diff].name;
  PZ_CUR=null; clearInterval(PZ_TIMER);
  setTimeout(()=>{   // a hard board takes a moment to generate: let the panel paint first
    const B=pzBoard(m.kind,m.diff,m.seed), V=PZV[m.kind];
    if(!B||!V){ host.innerHTML='<p class="muted">This puzzle could not be made. Try another.</p>'; return; }
    let saved=null; try{ saved=JSON.parse(localStorage.getItem(pzKey(m))||'null'); }catch(_){}
    const api={ solved:ans=>{ if(!PZ_CUR||PZ_CUR.done) return; PZ_CUR.done=1; netSend({t:'pz',a:'solve',ans}); },
      save:st=>{ try{ localStorage.setItem(pzKey(m),JSON.stringify({st:st.st,secs:Math.round((Date.now()-PZ_CUR.t0)/1000)})); }catch(_){} } };
    host.innerHTML=''; PZ_CUR={m,B,api,view:null,t0:Date.now()-((saved&&saved.secs)||0)*1000,done:0};
    PZ_CUR.view=V.mount(host,B,api,saved&&saved.st||null);
    { const sk=$('#pzSkip'), need=PZ_SOLVER_NEED[m.diff]||1; sk.hidden=!(m.first&&m.src==='site'); sk.textContent='Use Puzzle solver (needs '+need+', you have '+((GEAR&&GEAR.psv)||0)+')'; }   // first solves of stones only
    $('#pzUndo').hidden=!PZ_CUR.view.undo; $('#pzBar').hidden=false;
    PZ_TIMER=setInterval(pzTick,500); pzTick();
  },30);
}
function pzTick(){
  const c=PZ_CUR; if(!c||$('#puzzle').hidden){ if($('#puzzle').hidden) clearInterval(PZ_TIMER); return; }
  const secs=(Date.now()-c.t0)/1000, tgt=PZ_DIFF[c.m.diff].target; $('#pzClock').textContent=pzFmt(secs)+' / '+pzFmt(tgt);
  try{ localStorage.setItem(pzKey(c.m),JSON.stringify({st:c.view.state?c.view.state():null,secs:Math.round(secs)})); }catch(_){}
}
$('#pzUndo').addEventListener('click',()=>{ if(PZ_CUR&&PZ_CUR.view.undo) PZ_CUR.view.undo(); UI_SFX.click(); });
$('#pzReset').addEventListener('click',()=>{ if(PZ_CUR&&PZ_CUR.view.reset) PZ_CUR.view.reset(); UI_SFX.click(); });
// ---- the chest ----
// tier 1-5; first = the first-time design (plan section 3d). tint: the land's trim colour (PZ_LAND_TINT); the lid is its own group so the reveal can lift it (.pz-reveal .pz-lid, 33-puzzles.css).
const PZ_LAND_TINT={home:'#5fae4a',vale:'#e68fb0',hoar:'#7fc8ef',grey:'#9aa6b2',sun:'#e0a24a',gloam:'#9a7fd0',amber:'#d8a038',cave:'#58d6c8'};
function pzChestSvg(d,first,land){
  const T=PZ_LAND_TINT[land]||'#c9b27a', K='#241a10', G=first?'#ffd35a':'#c9b27a';
  const W=[null,['#8a5a2e','#6d4522'],['#7a5a3a','#5f4429'],['#6b3f24','#512d18'],['#8c9097','#6c7075'],['#e3d29a','#c4ad6a']][d], [body,shade]=W;
  const id='pz'+d+(first?'f':'r');
  let s=`<svg viewBox="0 0 160 140" class="pz-chest" aria-hidden="true"><defs><radialGradient id="${id}h"><stop offset="0" stop-color="#fff2b0" stop-opacity=".9"/><stop offset="1" stop-color="#fff2b0" stop-opacity="0"/></radialGradient><linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c8" stop-opacity=".55"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></linearGradient></defs>`;
  if(first) s+=`<ellipse cx="80" cy="92" rx="${50+d*5}" ry="${34+d*4}" fill="url(#${id}h)"/>`;
  if(d===5&&first) s+=`<path d="M80 0 L52 96 L108 96 Z" fill="url(#${id}b)"/>`;
  if(d===4&&first) s+=`<path d="M40 40 L24 100 L136 100 L120 40 Z" fill="url(#${id}b)" opacity=".6"/>`;
  const y=d>=4?14:0;   // tiers 4 and 5 stand on a plinth
  if(d>=4){ s+=`<rect x="22" y="108" width="116" height="16" rx="3" fill="${d===5?'#b9a36a':'#5f6469'}" stroke="${K}" stroke-width="2"/>`; if(first) s+=`<rect x="34" y="104" width="92" height="6" rx="2" fill="${T}"/>`; }
  const w=d===1?72:d===2?84:96, x0=80-w/2, bh=d===1?32:40, top=108-y-bh;   // the body
  s+=`<rect x="${x0}" y="${top}" width="${w}" height="${bh}" rx="4" fill="${body}" stroke="${K}" stroke-width="2"/><rect x="${x0}" y="${top+bh-8}" width="${w}" height="8" rx="3" fill="${shade}" opacity=".7"/>`;
  if(d===1){ for(let i=1;i<4;i++) s+=`<path d="M${x0} ${top+i*8} H${x0+w}" stroke="${shade}" stroke-width="1.2" opacity=".7"/>`; s+=`<path d="M${x0+10} ${top} v${bh} M${x0+w-10} ${top} v${bh}" stroke="#d8c9a0" stroke-width="2.2" opacity=".85"/>`; }
  if(d>=2) for(const f of [0.18,0.82]) s+=`<rect x="${x0+w*f-4}" y="${top}" width="8" height="${bh}" fill="${d===4?'#a5733a':'#5a5f66'}" stroke="${K}" stroke-width="1"/>`;
  if(d>=3){ s+=`<path d="M${x0+8} ${top+bh*0.55} h${w-16}" stroke="${first?G:T}" stroke-width="2.4"/>`; s+=`<path d="M80 ${top+bh*0.3} l7 6 -7 6 -7 -6z" fill="${T}" stroke="${K}" stroke-width="1.2"/>`; }   // the land's emblem
  const lh=d===1?20:d===2?24:d===3?28:30, ly=top;   // the lid: a domed top that lifts on the reveal
  s+=`<g class="pz-lid" style="transform-origin:${x0+w*0.85}px ${ly}px"><path d="M${x0-2} ${ly} Q${x0-2} ${ly-lh} 80 ${ly-lh} Q${x0+w+2} ${ly-lh} ${x0+w+2} ${ly} Z" fill="${body}" stroke="${K}" stroke-width="2"/>`;
  if(d>=2) for(const f of [0.18,0.82]) s+=`<path d="M${x0+w*f-4} ${ly} Q${x0+w*f-4} ${ly-lh+3} ${x0+w*f} ${ly-lh+1} Q${x0+w*f+4} ${ly-lh+3} ${x0+w*f+4} ${ly} Z" fill="${d===4?'#a5733a':'#5a5f66'}" opacity=".9"/>`;
  if(d===1) s+=`<path d="M70 ${ly-2} q10 -8 20 0" stroke="#d8c9a0" stroke-width="2.4" fill="none"/><circle cx="80" cy="${ly+2}" r="3" fill="${first?G:'#d8c9a0'}" stroke="${K}" stroke-width="1"/>`;
  if(d===3) s+=`<path d="M${x0+10} ${ly-4} Q80 ${ly-lh+6} ${x0+w-10} ${ly-4}" stroke="${first?G:T}" stroke-width="2" fill="none"/>`;
  if(d===5) s+=`<circle cx="80" cy="${ly-lh-6}" r="9" fill="${first?'#fff2b0':'#e0d4a0'}" stroke="${K}" stroke-width="1.6"/><path d="M80 ${ly-lh-15} v-6 M72 ${ly-lh-12} l-4 -4 M88 ${ly-lh-12} l4 -4" stroke="${first?'#ffd35a':'#b9a36a'}" stroke-width="2"/>`;   // the lamp (the first-time reliquary is crowned with one)
  s+='</g>';
  s+=`<rect x="72" y="${top-4}" width="16" height="16" rx="3" fill="${first?G:'#c9b27a'}" stroke="${K}" stroke-width="1.5"/><circle cx="80" cy="${top+4}" r="2.4" fill="${K}"/>`;   // the lock
  if(first) for(const [cx,cy] of [[x0+4,top+4],[x0+w-4,top+4],[x0+4,top+bh-4],[x0+w-4,top+bh-4]]) s+=`<circle cx="${cx}" cy="${cy}" r="3.4" fill="${G}" stroke="${K}" stroke-width=".8"/>`;
  if(first) for(const [sx,sy] of [[34,40],[126,34],[80,18],[50,70],[112,66]]) s+=`<path d="M${sx} ${sy-5} l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#fff2b0" class="pz-spark"/>`;
  return s+'</svg>';
}
function pzLootLines(c){
  const L=[]; if(c.coins) L.push(c.coins.toLocaleString('en-US')+' coins');
  for(const id in (c.pot||{})) L.push(c.pot[id]+' × '+(POTS[id]?POTS[id].name:id));
  for(const [id,n] of (c.mats||[])) L.push(n+' × '+(MATS[id]?MATS[id].name:id));
  if(c.stones) L.push(c.stones+' × Tempering Stone'); if(c.amber) L.push(c.amber+' amber');
  if(c.scroll) L.push('1 × Epic upgrade scroll'); if(c.gear&&ITEM[c.gear]) L.push(ITEM[c.gear].name);
  return L;
}
function pzDone(m){
  if((m.src==='site'||m.src==='raid')&&m.chest&&pzChestDrop(m)){ clearInterval(PZ_TIMER); try{ if(PZ_CUR) localStorage.removeItem(pzKey(PZ_CUR.m)); }catch(_){} PZ_CUR=null; closePanels(); UI_SFX.success(); return; }   // the chest stands beside the stone: walk up and open it (pzOpenNear)
  pzSheet(m);
}
function pzSheet(m){
  clearInterval(PZ_TIMER); try{ if(PZ_CUR) localStorage.removeItem(pzKey(PZ_CUR.m)); }catch(_){} PZ_CUR=null;
  openPanel('puzzle'); const host=$('#pzHost'); $('#pzBar').hidden=true; $('#pzClock').textContent=''; $('#pzTitle').textContent='Solved · '+PZ_DIFF[m.diff].name;
  const c=m.chest, lines=c?pzLootLines(c):[], extra=[]; if(m.gems) extra.push('+'+m.gems+' gems'); if(m.sig) extra.push('+'+m.sig+' Sigils'); if(m.track&&m.track.length) extra.push('Sigil track level '+m.track.join(', '));
  host.innerHTML='<div class="pz-reveal">'+pzChestSvg(m.diff,!!m.first,String(m.site||'').split('-')[0])+'</div>'+(c&&c.lucky?'<p class="pz-lucky">A lucky chest: double potions!</p>':'')
    +(lines.length||extra.length?'<ul class="pz-loot">'+extra.map(t=>'<li class="pz-bonus">'+t+'</li>').join('')+lines.map(t=>'<li>'+t+'</li>').join('')+'</ul>':'<p class="muted">Well solved. (A testing board pays nothing.)</p>')
    +'<div class="chips"><button class="chip buy" id="pzOk">Close</button></div>';
  $('#pzOk').addEventListener('click',()=>closePanels()); UI_SFX.success();
}
// ---- the admin Puzzles section (devP 'pz'): any kind, difficulty and seed; a chest of any tier; Sigils; light every stone ----
(function(){
  const k=$('#tPzKind'); if(!k) return;
  k.innerHTML=PZ_KIND_IDS.map(id=>`<option value="${id}">${PZ_KINDS[id].name} (${PZ_KINDS[id].land})</option>`).join('');
  $('#tPzDiff').innerHTML=PZ_DIFF.slice(1).map((d,i)=>`<option value="${i+1}">${i+1} ${d.name}</option>`).join('');
  const send=v=>netSend(NET.test?{t:'pztest',v}:{t:'dev',cmd:'pz',v});   // the /test world has the public copy: pztest
  $('#tPzOpen').addEventListener('click',()=>send({kind:k.value,diff:+$('#tPzDiff').value,seed:$('#tPzSeed').value.trim()}));
  $('#tPzChest').addEventListener('click',()=>send({chest:+$('#tPzDiff').value,first:true}));
  $('#tPzSig').addEventListener('click',()=>send({sig:50}));
  $('#tPzReset').addEventListener('click',()=>send({reset:1}));
})();
$('#pzSkip').addEventListener('click',()=>{ if(PZ_CUR&&!PZ_CUR.done) netSend({t:'pz',a:'skip'}); });
