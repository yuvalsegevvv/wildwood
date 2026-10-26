//@ The set burst's popup: a short card over the centre-top while it is cast, the set's emblem large behind the character's gem-shop picture, in the set's colours
/* Agent map. Called by EVH.ult (game/ult/slot.js) for the caster only; others see the cast's fx. The picture is the gem shop's outfit portrait (cthGet kind 'outfit', game/ui/character-thumbs.js), asked for in ultWarm()
   when the burst is worn (and on join) so the first cast never waits; until it exists, or in a build without GL, the card shows the emblem alone. No images in the page; the card never takes a click.
   Styles: styles/32-ult.css (reduced motion = a fade). Exports: ultPopup(setId), ultWarm(). */
const ULT_POPMS=1150;
function ultWarm(){   // ask for the portrait of the worn burst's set now
  const a=GEAR&&GEAR.skills&&ultDef(GEAR.skills.ult), S=a&&SS_SETS[a.set]; if(S&&S.outfit&&typeof cthGet==='function') cthGet({kind:'outfit',id:S.outfit},()=>{});
}
function ultPopup(setId){
  const root=$('#ultPopup'), S=SS_SETS[setId], ab=ultDef(setId); if(!root||!S||!ab) return;
  const hex=n=>'#'+n.toString(16).padStart(6,'0');
  root.textContent=''; root.style.setProperty('--main',hex(S.pal.main)); root.style.setProperty('--accent',hex(S.pal.accent)); root.style.setProperty('--glow',hex(S.pal.glow));
  const card=document.createElement('div'); card.className='ult-card';
  if(S.emblem){ const em=document.createElement('div'); em.className='ult-emblem'; em.style.color=hex(S.emblem.col);   // (the glyph is the registry's own markup, validated by defineSkillSet)
    em.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">'+S.emblem.glyph+'</svg>'; card.append(em); }
  const pic=document.createElement('img'); pic.className='ult-pic'; pic.alt=''; pic.hidden=true; card.append(pic);
  if(S.outfit&&typeof cthGet==='function') cthGet({kind:'outfit',id:S.outfit},url=>{ if(url&&pic.isConnected){ pic.src=url; pic.hidden=false; } });
  const nm=document.createElement('b'); nm.className='ult-name'; nm.textContent=ab.name; const who=document.createElement('span'); who.className='ult-who'; who.textContent=S.char.name;
  const sw=document.createElement('i'); sw.className='ult-sweep';
  card.append(nm,who,sw); root.append(card); root.hidden=false;
  clearTimeout(ultPopup.t); ultPopup.t=setTimeout(()=>{ root.hidden=true; root.textContent=''; },ULT_POPMS);
}
