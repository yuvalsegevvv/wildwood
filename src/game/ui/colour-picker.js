//@ The colour picker of the character editor (version 3.3, laid out like Warframe's): a block per colour channel ("Colour 1", "Colour 2"...) to select, then one shared palette and a 64-slot favourites grid that apply to the selected channel
/* edColourBlock(wrap, o) draws one channel into `wrap`: its title, hint, the colour it wears now, and (o.designed) a Designed button. o = {title:'Colour 1', hint:'cloth', get(): the current value, set(v): store it,
   opts: the row's free colours, premium: false for the skin and the fur, designed: {on, label, hex, click} for a colour that may be left as designed (-1)}. Tapping a block selects that channel (edColSel).
   After the row loop, character-editor.js calls edColourPanel(): ONE panel at the end of the page with the palette (the selected channel's free colours, then the 48 premium ones), and, for channels that take
   premium colours, the favourites: 64 slots in an 8 x 8 grid saved on the account (gear.fav, a list of colour numbers where -1 is an empty slot; a new account starts with the 16 free colours of TINTC in the first slots).
   Tap a palette colour or a filled slot to wear it; tap an empty slot to save the colour you wear into it; drag a palette colour or a slot onto any slot to put or swap it; right-click, or "Clear mode" and a tap, empties a slot.
   Premium colours (shared/colours.js, PREM_PRICE gems each, owned for the whole account in GEAR.pc) can be tried on freely; wearing an unowned one makes the look a try-on (character-editor.js edLocks) with a Buy button.
   owns: edColourBlock, edColourPanel, edFavSlots, edFavSave, edFavEdit, edColSel, edColTargets.   used by: ui/character-editor.js (the colour, dcolor and palette rows).   test: tools/colours-smoke.js, client-smoke */
let edFavEdit=false, edColSel=0, edColKey='', edColTargets=[], edBlockN=0;
const edFavSlots=()=>{ const f=typeof GEAR!=='undefined'&&GEAR&&GEAR.fav, s=(Array.isArray(f)&&f.length?f:TINTC.slice(0,16)).slice(0,PREM_FAV_MAX); while(s.length<PREM_FAV_MAX) s.push(-1); return s; };
const edPcOwned=i=>creating?false:!!(typeof GEAR!=='undefined'&&GEAR&&Array.isArray(GEAR.pc)&&GEAR.pc.includes(i));
function edFavSave(slots){ const l=slots.slice(0,PREM_FAV_MAX); while(l.length&&!(l[l.length-1]>=0)) l.pop(); if(typeof GEAR!=='undefined'&&GEAR) GEAR.fav=l; netSend({t:'colfav',l}); }
const hex6=v=>'#'+('000000'+(v>>>0).toString(16)).slice(-6);
// one round swatch for a colour; a premium colour that is not owned gets a small lock, and its name and price are in the tooltip
function edSwatch(hex,cur,label){
  const b=document.createElement('button'); b.className='sw'; b.style.background=hex6(hex); const pi=premIndexOf(hex);
  b.setAttribute('aria-pressed',cur===hex); b.setAttribute('aria-label',label+(pi>=0?' '+PREM_COLOURS[pi][1]:''));
  if(pi>=0){ b.title=PREM_COLOURS[pi][1]+(edPcOwned(pi)?' (premium, yours)':' (premium, '+PREM_PRICE+' gems: try it on, buy it to keep it)'); if(!edPcOwned(pi)) b.classList.add('prem-lock'); b.classList.add('prem'); }
  return b;
}
function edColourBlock(wrap,o){
  const idx=edColTargets.length; if(idx===0&&edColKey!==edBody.dataset.at){ edColKey=edBody.dataset.at; edColSel=0; }
  edColTargets.push({o});
  const blk=document.createElement('div'); blk.className='cp-block'+(idx===edColSel?' on':''); blk.setAttribute('role','button'); blk.setAttribute('aria-pressed',idx===edColSel);
  const head=document.createElement('div'); head.className='cp-head'; const t=document.createElement('b'); t.textContent=o.title; head.append(t);
  if(o.hint){ const h=document.createElement('span'); h.className='muted'; h.textContent=o.hint; head.append(h); }
  const cur=o.get(), cs=document.createElement('span'); cs.className='cp-cur'; if(cur>=0){ cs.style.background=hex6(cur); const pi=premIndexOf(cur); cs.title=pi>=0?PREM_COLOURS[pi][1]:hex6(cur); } else cs.classList.add('none');
  head.append(cs);
  if(o.designed){ const d=document.createElement('button'); d.className='chip'; d.textContent=o.designed.label||'Designed'; if(o.designed.hex!==undefined) d.style.borderLeft='10px solid '+hex6(o.designed.hex); d.setAttribute('aria-pressed',!!o.designed.on); d.onclick=()=>{ o.designed.click(); renderEditor(); }; head.append(d); }
  blk.append(head); blk.onclick=()=>{ if(edColSel!==idx){ edColSel=idx; renderEditor(); } };
  wrap.append(blk);
}
// the shared panel, at the end of the page's rows: the palette and the favourites of the selected channel
function edColourPanel(){
  if(!edColTargets.length) return;
  if(edColSel>=edColTargets.length) edColSel=0;
  const o=edColTargets[edColSel].o, cur=o.get(), withPrem=o.premium!==false, prem=withPrem&&!creating;   // (a new hiker has no gems: only the free colours)
  const apply=v=>{ o.set(v); renderEditor(); }, dragC=(b,v)=>{ b.draggable=true; b.ondragstart=e=>{ e.dataTransfer.setData('text/plain','c'+v); }; return b; };
  const pan=document.createElement('div'); pan.className='cp-panel';
  const ph=document.createElement('div'); ph.className='cp-sub'; ph.textContent='Palette for '+o.title; pan.append(ph);
  const free=document.createElement('div'); free.className='swatches cp-pal';
  o.opts.forEach((v,i)=>{ const b=edSwatch(v,cur,o.title+' '+(i+1)); b.onclick=()=>apply(v); free.append(dragC(b,v)); }); pan.append(free);
  if(prem){
    const pr=document.createElement('div'); pr.className='cp-sub'; pr.textContent='Premium: '+PREM_PRICE+' gems each, yours on everything once bought'; pan.append(pr);
    const pb=document.createElement('div'); pb.className='swatches cp-pal';
    PREM_COLOURS.forEach(c=>{ const b=edSwatch(c[0],cur,o.title+' premium'); b.onclick=()=>apply(c[0]); pb.append(dragC(b,c[0])); }); pan.append(pb);
  }
  if(withPrem){
    const fh=document.createElement('div'); fh.className='cp-head cp-favhead'; const fl=document.createElement('div'); fl.className='cp-sub'; fl.textContent='Favourites'; fh.append(fl);
    const cm=document.createElement('button'); cm.className='chip'; cm.textContent='Clear mode'; cm.setAttribute('aria-pressed',edFavEdit); cm.title='Tap a favourite to empty its slot (right-click does it too)'; cm.onclick=()=>{ edFavEdit=!edFavEdit; renderEditor(); }; fh.append(cm); pan.append(fh);
    const hint=document.createElement('p'); hint.className='cp-hint'; hint.textContent=edFavEdit?'Clear mode: tap a favourite to remove it.':'Tap to wear. Tap an empty slot to save your current colour there. Drag to move or swap.'; pan.append(hint);
    const slots=edFavSlots(), grid=document.createElement('div'); grid.className='cp-favgrid';
    const put=(i,txt)=>{ const l=edFavSlots();
      if(txt&&txt[0]==='s'){ const from=+txt.slice(1); if(from>=0&&from<l.length&&from!==i){ const t=l[i]; l[i]=l[from]; l[from]=t; } }
      else if(txt&&txt[0]==='c'){ const v=+txt.slice(1); if(!(v>=0&&v<=0xffffff)) return; const j=l.indexOf(v); if(j>=0) l[j]=-1; l[i]=v; }
      else return; edFavSave(l); renderEditor(); };
    slots.forEach((v,i)=>{ const filled=v>=0, b=filled?edSwatch(v,cur,'Favourite '+(i+1)):document.createElement('button');
      b.classList.add('cp-slot'); if(!filled){ b.classList.add('sw','empty'); b.textContent='+'; b.title='Empty slot: tap to save the colour you wear'; b.setAttribute('aria-label','Empty favourite slot '+(i+1)); }
      if(filled){ const dis=!prem&&premIndexOf(v)>=0; if(dis) b.disabled=true; b.draggable=true; b.ondragstart=e=>{ e.dataTransfer.setData('text/plain','s'+i); };
        b.onclick=()=>{ if(edFavEdit){ const l=edFavSlots(); l[i]=-1; edFavSave(l); renderEditor(); } else apply(v); };
        b.oncontextmenu=e=>{ e.preventDefault(); const l=edFavSlots(); l[i]=-1; edFavSave(l); renderEditor(); }; }
      else b.onclick=()=>{ if(!(cur>=0)){ toast('Pick a colour first, then tap a slot to save it','bad'); return; } if(slots.includes(cur)){ toast('That colour is already in your favourites'); return; } put(i,'c'+cur); };
      b.ondragover=e=>e.preventDefault(); b.ondrop=e=>{ e.preventDefault(); put(i,e.dataTransfer.getData('text/plain')); };
      grid.append(b); });
    pan.append(grid);
  }
  edBody.append(pan);
}
