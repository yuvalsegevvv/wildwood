//@ The Materials panel's search box: type any material's name (or what you want to do — "rift", "Glasswell", "pickaxe") and it lists what it is and exactly where it comes from, with a Track button
/* Agent map. The index is EVERY findable material — the key resources (echo shards, the forge's stones, Sigils, orbs), the gathered resources, every monster drop, boss trophies, Essence and the raid
   materials — and its haystack is its own awtHow text (awakening/mat-info.js: ONE rule, the same words the Awakening panel's box shows), so the search never disagrees with the game.
   Exports: matFindRender() (called by renderMats, economy/inventory.js, and on every keystroke in #matFind). Track toggles through awtTrack(id,0): a count with no goal, in the quest log.
   Styles: 15-inventory.css (.mat-out, .mat-r). Test: client-smoke. */
let MF_IDX=null, MF_Q='';
const MF_KEYS=['echo','temper','rsw','rsa','rsr','sig','bdorb','bdstone'];   // the inventory's Key resources block (inv-keys.js IK_ROWS), the order players look for them
// the searchable world, built once on the first search: {id, name, hay} with hay = the material's own description
function matFindIndex(){
  if(MF_IDX) return MF_IDX;
  const out=[], put=id=>{ if(!id||out.some(e=>e.id===id)) return;
    const h=awtHow({id}); if(!h||/no source is known/i.test(h.what)) return;
    out.push({id,name:h.name,hay:(h.name+' '+h.what+' '+h.where).toLowerCase()}); };
  MF_KEYS.forEach(put);
  for(const id of Object.keys(RES)) put(id);
  MAT_IDS.forEach(put);   // every monster's material, held or not: search before you have it
  BT_ORDER.forEach(put); ESS_ORDER.forEach(put);
  for(const r of RD_ORDER){ if(RDS[r]&&RDS[r].land) put('rd_'+RDS[r].land); }
  return MF_IDX=out;
}
// rank: the name starting with it beats a word of its description starting with it, beats a buried match
const mfRank=(e,q)=>{ const n=e.name.toLowerCase();
  if(n.startsWith(q)) return 0;
  const i=e.hay.indexOf(q); if(i<0) return 99;
  return i===0||/\W/.test(e.hay.charAt(i-1))?1:2; };
function matFindRender(){
  const box=$('#matOut'), inp=$('#matFind'); if(!box||!inp) return;
  MF_Q=String(inp.value||'').trim().toLowerCase();
  if(MF_Q.length<2){ box.hidden=true; box.innerHTML=''; return; }
  const hits=matFindIndex().map(e=>({e,r:mfRank(e,MF_Q)})).filter(x=>x.r<99).sort((a,b)=>a.r-b.r).slice(0,30).map(x=>x.e);
  let h='';
  if(hits.length){
    const T=awtLoad();
    for(const e of hits){
      const d=awtHow({id:e.id}), tr=T.some(t=>t.id===e.id), can=awtTrackable(e.id), have=awtHave(e.id);
      h+='<div class="mat-r" style="--c:'+awtColOf(e.id)+'">'+awtIcon(e.id,awtColOf(e.id))+'<div class="mat-tx"><b>'+awtEsc(d.name)+'</b>'+(have>0?' <span class="mat-hv">you hold '+awcNum(have)+'</span>':'')+'<p>'+awtEsc(d.what)+'</p><p class="awt-wh"><u>How to get it</u> '+awtEsc(d.where)+'</p></div>'
        +(can?'<button class="chip'+(tr?' on':'')+'" data-matf="'+awtEsc(e.id)+'">'+(tr?'Untrack':'Track')+'</button>':'')+'</div>';
    }
  }else h='<p class="muted">Nothing matches "'+awtEsc(MF_Q)+'". Try an ore or herb name, a monster\'s, a stone, "rift", "raid", "boss"...</p>';
  box.innerHTML=h; box.hidden=false;
}
(function matFindBind(){
  const inp=$('#matFind'), box=$('#matOut'); if(!inp||!inp.addEventListener) return;
  let tm=null;
  inp.addEventListener('input',()=>{ clearTimeout(tm); tm=setTimeout(matFindRender,120); });   // (a small debounce: typing a long name does not rebuild every letter)
  if(box&&box.addEventListener) box.addEventListener('click',e=>{
    const t=e.target&&e.target.closest?e.target.closest('[data-matf]'):null; if(!t) return;
    if(awtTrack(t.dataset.matf,0)) matFindRender();   // need 0: track the count, no goal
  });
})();
