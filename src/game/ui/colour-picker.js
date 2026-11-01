//@ The colour picker of the character editor (version 3.3): one block per colour ("Colour 1", "Colour 2"...), each with a Designed button, your 16 favourites and all colours (the row's free ones and the 48 premium)
/* edColourBlock(wrap, o) draws one block into `wrap`. o = {title:'Colour 1', hint:'cloth', get(): the current value, set(v): store it, opts: the row's free colours, premium: false for the skin and the fur,
   designed: {on, label, hex, click} for a colour that may be left as designed (-1)}. Every block shows the same favourites (GEAR.fav, saved on the account, starts as the 16 free colours of TINTC):
   tap one to wear it. "Edit favourites" turns the picker into an organiser: tap a colour under All colours to add or remove it, drag a favourite (or select it and use the arrows) to move it.
   Premium colours (shared/colours.js, PREM_PRICE gems each, owned for the whole account in GEAR.pc) can be tried on freely; wearing an unowned one makes the look a try-on (character-editor.js edLocks) with a Buy button.
   owns: edColourBlock, edFavList, edFavEdit.   used by: ui/character-editor.js (the colour, dcolor and palette rows).   test: tools/colours-smoke.js, client-smoke */
let edFavEdit=false, edFavSel=-1;
const edFavList=()=>{ const f=typeof GEAR!=='undefined'&&GEAR&&GEAR.fav; return Array.isArray(f)&&f.length?f:TINTC.slice(0,PREM_FAV_MAX); };
const edPcOwned=i=>creating?false:!!(typeof GEAR!=='undefined'&&GEAR&&Array.isArray(GEAR.pc)&&GEAR.pc.includes(i));
function edFavSave(list){ list=list.slice(0,PREM_FAV_MAX); if(typeof GEAR!=='undefined'&&GEAR) GEAR.fav=list; netSend({t:'colfav',l:list}); }
// one round swatch for a colour; a premium colour that is not owned gets a small lock, and its name and price are in the tooltip
function edSwatch(hex,cur,label){
  const b=document.createElement('button'); b.className='sw'; b.style.background=hex6(hex); const pi=premIndexOf(hex);
  b.setAttribute('aria-pressed',cur===hex); b.setAttribute('aria-label',label+(pi>=0?' '+PREM_COLOURS[pi][1]:''));
  if(pi>=0){ b.title=PREM_COLOURS[pi][1]+(edPcOwned(pi)?' (premium, yours)':' (premium, '+PREM_PRICE+' gems: try it on, buy it to keep it)'); if(!edPcOwned(pi)) b.classList.add('prem-lock'); b.classList.add('prem'); }
  return b;
}
const hex6=v=>'#'+('000000'+(v>>>0).toString(16)).slice(-6);
function edColourBlock(wrap,o){
  const blk=document.createElement('div'); blk.className='cp-block';
  const head=document.createElement('div'); head.className='cp-head'; const t=document.createElement('b'); t.textContent=o.title; head.append(t);
  if(o.hint){ const h=document.createElement('span'); h.className='muted'; h.textContent=o.hint; head.append(h); }
  if(o.designed){ const d=document.createElement('button'); d.className='chip'; d.textContent=o.designed.label||'Designed'; if(o.designed.hex!==undefined) d.style.borderLeft='10px solid '+hex6(o.designed.hex); d.setAttribute('aria-pressed',!!o.designed.on); d.onclick=()=>{ o.designed.click(); renderEditor(); }; head.append(d); }
  if(o.premium!==false&&edBlockN++===0) edFavSwitch(head);
  blk.append(head);
  const cur=o.get(), pick=v=>()=>{ o.set(v); renderEditor(); };
  const prem=o.premium!==false&&!creating;   // (a new hiker has no gems: only the free colours)
  const favs=edFavList().filter(v=>prem||premIndexOf(v)<0);
  if(o.premium!==false){
    const fl=document.createElement('div'); fl.className='cp-sub'; fl.textContent=edFavEdit?'Favourites: drag to reorder, or tap one and use the arrows':'Favourites'; blk.append(fl);
    const box=document.createElement('div'); box.className='swatches cp-fav';
    favs.forEach((v,i)=>{ const b=edSwatch(v,cur,o.title+' favourite '+(i+1));
      if(edFavEdit){ b.classList.toggle('sel',edFavSel===i); b.draggable=true; b.onclick=()=>{ edFavSel=edFavSel===i?-1:i; renderEditor(); };
        b.ondragstart=e=>{ e.dataTransfer.setData('text/plain',String(i)); edFavSel=i; };
        b.ondragover=e=>e.preventDefault();
        b.ondrop=e=>{ e.preventDefault(); const from=+e.dataTransfer.getData('text/plain'); if(!(from>=0)||from===i) return; const l=edFavList().slice(); l.splice(i,0,l.splice(from,1)[0]); edFavSel=i; edFavSave(l); renderEditor(); }; }
      else b.onclick=pick(v);
      box.append(b); });
    blk.append(box);
    if(edFavEdit&&edFavSel>=0&&edFavSel<favs.length){
      const mv=document.createElement('div'); mv.className='chips';
      for(const [txt,fn] of [['◀',-1],['▶',1],['Remove',0]].map(a=>[a[0],a[1]])){ const c=document.createElement('button'); c.className='chip'; c.textContent=txt;
        c.onclick=()=>{ const l=edFavList().slice(), i=edFavSel; if(fn===0){ l.splice(i,1); edFavSel=-1; } else { const j=i+fn; if(j<0||j>=l.length) return; l.splice(j,0,l.splice(i,1)[0]); edFavSel=j; } edFavSave(l); renderEditor(); }; mv.append(c); }
      blk.append(mv); }
  }
  const all=document.createElement('details'); all.className='cp-all'; const sm=document.createElement('summary'); sm.textContent='All colours'; all.append(sm);
  all.open=!!(window.edColourOpen&&window.edColourOpen[o.title]); all.ontoggle=()=>{ window.edColourOpen=window.edColourOpen||{}; window.edColourOpen[o.title]=all.open; };
  const fav=edFavList(), star=(b,v)=>{ if(!edFavEdit) return b; const on=fav.includes(v); b.classList.toggle('fav',on); b.onclick=()=>{ const l=edFavList().slice(), i=l.indexOf(v); if(i>=0) l.splice(i,1); else if(l.length<PREM_FAV_MAX) l.push(v); else { toast('Favourites are full: remove one first','bad'); return; } edFavSave(l); renderEditor(); }; return b; };
  const free=document.createElement('div'); free.className='swatches';
  o.opts.forEach((v,i)=>{ const b=edSwatch(v,cur,o.title+' '+(i+1)); if(!edFavEdit) b.onclick=pick(v); free.append(star(b,v)); }); all.append(free);
  if(prem){
    const ph=document.createElement('div'); ph.className='cp-sub'; ph.textContent='Premium: '+PREM_PRICE+' gems each, yours on everything once bought'; all.append(ph);
    const pb=document.createElement('div'); pb.className='swatches';
    PREM_COLOURS.forEach((c,i)=>{ const b=edSwatch(c[0],cur,o.title+' premium'); if(!edFavEdit) b.onclick=pick(c[0]); pb.append(star(b,c[0])); }); all.append(pb);
  }
  blk.append(all);
  wrap.append(blk);
}
// the one switch for the favourites organiser, in the header of the first colour block of a tab (edBlockN counts the blocks drawn since renderEditor began)
let edBlockN=0;
function edFavSwitch(head){
  const c=document.createElement('button'); c.className='chip cp-edit'; c.textContent=edFavEdit?'Done organising':'Organise favourites'; c.setAttribute('aria-pressed',edFavEdit);
  c.onclick=()=>{ edFavEdit=!edFavEdit; edFavSel=-1; renderEditor(); }; head.append(c);
}
