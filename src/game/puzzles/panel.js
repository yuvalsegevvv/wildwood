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
// tier 1-5; first = the first-time design. Palettes are the wood / iron / carved / bronze-stone / reliquary of the plan's section 3d.
function pzChestSvg(d,first){
  const P=[null,['#8a5a2e','#5e3b1c','#c9b27a'],['#7a5a3a','#5a5f66','#aeb6bf'],['#6b3f24','#8a6a2e','#d8b04a'],['#7d8288','#a5733a','#e6b45a'],['#d9c58a','#b08a3a','#fff1b0']][d];
  const [body,trim,hi]=P, gold=first?'#ffd35a':hi; let s='<svg viewBox="0 0 160 130" class="pz-chest" aria-hidden="true">';
  if(first) s+=`<defs><radialGradient id="pzh${d}"><stop offset="0" stop-color="#fff2b0" stop-opacity=".85"/><stop offset="1" stop-color="#fff2b0" stop-opacity="0"/></radialGradient></defs><ellipse cx="80" cy="78" rx="${52+d*4}" ry="${38+d*3}" fill="url(#pzh${d})"/>`;
  if(d===5&&first) s+='<path d="M80 0 L58 70 L102 70 Z" fill="#fff6c8" opacity=".35"/>';
  if(d>=4) s+=`<rect x="26" y="98" width="108" height="14" rx="3" fill="${d===5?'#b9a36a':'#6c7075'}"/>`;
  const y=d>=4?12:0;
  s+=`<rect x="34" y="${62-y}" width="92" height="${40}" rx="5" fill="${body}" stroke="#241a10" stroke-width="2"/>`;
  s+=`<path d="M34 ${62-y} Q34 ${34-y} 80 ${34-y} Q126 ${34-y} 126 ${62-y} Z" fill="${body}" stroke="#241a10" stroke-width="2"/>`;
  if(d>=2) for(const x of [48,112]) s+=`<rect x="${x-4}" y="${36-y}" width="8" height="${66}" fill="${trim}" opacity=".9"/>`;
  if(d>=3) s+=`<path d="M34 ${62-y} H126" stroke="${gold}" stroke-width="3"/>`;
  if(d===1) s+=`<path d="M34 ${62-y} H126" stroke="#3a2812" stroke-width="2"/><path d="M76 ${60-y} q4 10 8 0" stroke="#d8c9a0" stroke-width="2" fill="none"/>`;
  if(first||d>=3) for(const [x,yy] of [[38,66],[122,66],[38,98],[122,98]]) s+=`<circle cx="${x}" cy="${yy-y+(yy>90?0:0)}" r="3.5" fill="${first?'#ffd35a':hi}"/>`;
  s+=`<rect x="73" y="${55-y}" width="14" height="16" rx="3" fill="${first?'#ffd35a':hi}" stroke="#241a10" stroke-width="1.5"/><circle cx="80" cy="${63-y}" r="2.2" fill="#241a10"/>`;
  if(d===5) s+=`<circle cx="80" cy="${22-y/2}" r="9" fill="${first?'#fff2b0':'#e0d4a0'}" stroke="#241a10" stroke-width="1.5"/>`;
  if(first&&d===3) for(const [x,yy] of [[44,26],[116,22],[80,12]]) s+=`<path d="M${x} ${yy-5} l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#fff2b0"/>`;
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
  clearInterval(PZ_TIMER); try{ if(PZ_CUR) localStorage.removeItem(pzKey(PZ_CUR.m)); }catch(_){} PZ_CUR=null;
  openPanel('puzzle'); const host=$('#pzHost'); $('#pzBar').hidden=true; $('#pzClock').textContent=''; $('#pzTitle').textContent='Solved · '+PZ_DIFF[m.diff].name;
  const c=m.chest, lines=c?pzLootLines(c):[], extra=[]; if(m.gems) extra.push('+'+m.gems+' gems'); if(m.sig) extra.push('+'+m.sig+' Sigils'); if(m.track&&m.track.length) extra.push('Sigil track level '+m.track.join(', '));
  host.innerHTML='<div class="pz-reveal">'+pzChestSvg(m.diff,!!m.first)+'</div>'+(c&&c.lucky?'<p class="pz-lucky">A lucky chest: double potions!</p>':'')
    +(lines.length||extra.length?'<ul class="pz-loot">'+extra.map(t=>'<li class="pz-bonus">'+t+'</li>').join('')+lines.map(t=>'<li>'+t+'</li>').join('')+'</ul>':'<p class="muted">Well solved. (A testing board pays nothing.)</p>')
    +'<div class="chips"><button class="chip buy" id="pzOk">Close</button></div>';
  $('#pzOk').addEventListener('click',()=>closePanels()); UI_SFX.success();
}
// ---- the admin Puzzles section (devP 'pz'): any kind, difficulty and seed; a chest of any tier; Sigils; light every stone ----
(function(){
  const k=$('#tPzKind'); if(!k) return;
  k.innerHTML=PZ_KIND_IDS.map(id=>`<option value="${id}">${PZ_KINDS[id].name} (${PZ_KINDS[id].land})</option>`).join('');
  $('#tPzDiff').innerHTML=PZ_DIFF.slice(1).map((d,i)=>`<option value="${i+1}">${i+1} ${d.name}</option>`).join('');
  const send=v=>netSend({t:'dev',cmd:'pz',v});
  $('#tPzOpen').addEventListener('click',()=>send({kind:k.value,diff:+$('#tPzDiff').value,seed:$('#tPzSeed').value.trim()}));
  $('#tPzChest').addEventListener('click',()=>send({chest:+$('#tPzDiff').value,first:true}));
  $('#tPzSig').addEventListener('click',()=>send({sig:50}));
  $('#tPzReset').addEventListener('click',()=>send({reset:1}));
})();
