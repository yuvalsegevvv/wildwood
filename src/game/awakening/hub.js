//@ The Characters panel's frame (#awc): the hero card (the character's default look behind its name, element, class, role and the Play button) and the tabs Awakening / Skills / Bond, Path (the Wanderer) and Look (a bonded character's outfit, free and unmodified)
/* Agent map (the owner's layout: pick a character on the left, then its tabs; the tree itself stays in awakening/panel.js, the Bond cards and the path picker in bond/panel.js).
   Open: chrOpen(set, tab) (tab 'awk' | 'sk' | 'bd' | 'path' | 'look'; the skills panel's Bonds button, the Bonds overview's Awaken button); awcOpen(set, limb) opens it on the Awakening tab.
   Drawn by chrRender() from awcRender (every you update while the panel is open). State: AWC.tab. Markup: #chrHero, #chrTabs, #chrVAwk (the tree), #chrVSk, #chrVBd, #chrVPath, #chrVLook in index.html; styles/39-characters.css.
   Skills tab: every piece of the character for the class in hand (basic, skill, power, passive, charge, burst) with its text and level; worn, or a small swap button that opens the skills panel on that slot
   (mix and match is the off-Bond way). Play (bd {a:'play'}) wears the whole set. Look tab: look.model = the outfit, every tint -1 (server/amber.js ambCleanLook lets a bonded character's look through
   unmodified; anything else needs the bought set, gear.os). Test: client-smoke (the characters block). */
const CHR_ROLE={risk:'Risk DPS',safe:'Safe DPS',grind:'Grinder',support:'Support',heal:'Healer',tank:'Tank'}, CHR_CLS={warrior:'Warrior',archer:'Archer',mage:'Mage'};
const CHR_TABS=[['awk','Awakening'],['sk','Skills'],['bd','Bond'],['path','Path'],['look','Look']];
function chrOpen(set,tab){
  const X=GEAR&&GEAR.skills&&GEAR.skills.bdx; awcOpen(set||(X&&X.main)||null);
  if(tab&&CHR_TABS.some(t=>t[0]===tab)) chrTab(tab);
}
// the class a character fights as: its own basic attack's class (a set's position 1 is bound to one class); the Wanderer: any
function chrClsOf(k){ const S=SS_SETS[k], id=S&&S.pos&&S.pos[1]&&S.pos[1].ids[0], d=id&&SKILLS[id]; return d?d.cls:null; }
function chrTagLine(k){
  if(k==='wanderer'){ const P=WD_PATHS[bdcPath()]; return P?P.name+' path':'any class'; }
  const S=SS_SETS[k]; if(!S) return ''; const c=chrClsOf(k);
  return (CHR_CLS[c]||'')+(S.role&&CHR_ROLE[S.role.main]?' · '+CHR_ROLE[S.role.main]:'');
}
const chrOwn=k=>k==='wanderer'||bdcEntry(k).b>=0;
const chrTabsOf=k=>CHR_TABS.filter(t=>t[0]==='path'?k==='wanderer':t[0]==='look'?k!=='wanderer'&&!!SS_SETS[k]&&!!SS_SETS[k].outfit:true);
function chrTab(t){
  const k=AWC.set; if(!chrTabsOf(k).some(q=>q[0]===t)) t='sk';
  AWC.tab=t; AWC.html.chrTabs=null; awcRender(); if(t==='awk') awcCanvas(true);
}
// ---- the hero card: the default look behind the name ----
function chrHeroHtml(k){
  const X=GEAR.skills&&GEAR.skills.bdx, main=X&&X.main===k, own=chrOwn(k);
  if(k==='wanderer'){ const P=WD_PATHS[bdcPath()], r=((GEAR.bd||{}).wanderer||{}).r|0;
    return '<div class="chr-hd" style="--c:#d9b26a"><div class="chr-pic" data-chrpic="wanderer"></div><div class="chr-id"><b>The Wanderer</b><span>Your own hiker &middot; any class &middot; '+(P?'the path of '+P.name+' ('+(CHR_ROLE[P.role]||P.role)+')':'no path')+' &middot; Realization '+BD_ROMAN[r]+'</span>'
      +'<div class="chr-play">'+bdcPlayBtn('wanderer',true,main)+(main&&X.act>=0?'<em>Realization '+BD_ROMAN[Math.max(0,X.act)]+' active</em>':'')+'</div></div></div>'; }
  const S=SS_SETS[k], c=chrClsOf(k), col='#'+('000000'+S.pal.main.toString(16)).slice(-6), E=bdcEntry(k), el=S.el&&ELEMS[S.el]?S.el:'basic', also=S.role&&S.role.also?' + '+(CHR_ROLE[S.role.also.role]||S.role.also.role):'';
  return '<div class="chr-hd" style="--c:'+col+'"><div class="chr-pic" data-chrpic="'+k+'"></div><div class="chr-id"><b>'+S.char.name+'</b><span class="chr-tags">'+elChip(el)+'<i class="chr-t">'+(CHR_CLS[c]||'Any class')+'</i><i class="chr-t">'+(CHR_ROLE[S.role&&S.role.main]||'')+also+'</i><i class="chr-t">'+ZTIER_NAMES[S.land]+'</i></span>'
    +'<div class="chr-play">'+(own?bdcPlayBtn(k,true,main)+'<em>'+(main&&X.act>=0?'Bond '+BD_ROMAN[Math.max(0,X.act)]+' active':'Bond '+BD_ROMAN[E.b])+'</em>':'<em>Locked: unlock them on the Bond tab (Bond 0)</em>')+'</div></div></div>';
}
// the picture: the character's signature outfit, whole (ui/character-thumbs.js renders it once and caches it); the Wanderer shows your own look
function chrPic(k){
  const el=document.querySelector?document.querySelector('#chrHero [data-chrpic]'):null; if(!el||typeof cthGet!=='function') return;
  const S=SS_SETS[k], sp=S&&S.outfit&&CHAR_MODELS[S.outfit]?{kind:'outfit',id:S.outfit}:{kind:'slot',look:LOOK};
  try{ cthGet(sp,url=>{ if(url&&AWC.set===k) el.style.backgroundImage='url("'+url+'")'; }); }catch(_){}
}
// ---- the skills tab ----
function chrPieces(k){   // [{slot, label, id, kind: 'sk' | 'pass' | 'cave' | 'ult'}] for the class in hand
  const cls=clsOf(), out=[], sk=GEAR.skills||{};
  if(k==='wanderer'){ const P=WD_PATHS[bdcPath()]; if(!P) return out; const pc=P.pieces[cls]||{};
    out.push({slot:'basic',kind:'sk',id:pc.basic},{slot:'skill',kind:'sk',id:pc.skill},{slot:'burst',kind:'sk',id:pc.burst},{slot:'pass',kind:'pass',id:P.passive},{slot:'cave',kind:'cave',id:WD_CHARGE},{slot:'ult',kind:'ult',id:P.ult});
    return out; }
  const S=SS_SETS[k]; if(!S) return out;
  for(const q of [1,2,3]){ const P=S.pos[q]; const id=P.ids.find(i=>SKILLS[i].cls===cls||SKILLS[i].cls==='any')||P.ids[0]; out.push({slot:['','basic','skill','burst'][q],kind:'sk',id}); }
  if(S.keptPassive) out.push({slot:'pass',kind:'pass',id:S.keptPassive});
  const cid=CAVE_SKILL_IDS.find(i=>CAVE_SKILLS[i].set===k); if(cid) out.push({slot:'cave',kind:'cave',id:cid});
  if(ultDef(k)) out.push({slot:'ult',kind:'ult',id:k});
  return out;
}
function chrWorn(x){
  const sk=GEAR.skills||{}, cls=clsOf();
  if(x.kind==='sk') return !!(sk.eq&&sk.eq[cls]&&sk.eq[cls][x.slot]===x.id);
  if(x.kind==='pass') return Array.isArray(sk.pass)&&sk.pass.includes(x.id);
  if(x.kind==='cave') return sk.cave===x.id;
  return sk.ult===x.id;
}
function chrPieceRow(x){
  const sk=GEAR.skills||{}; let name='', desc='', lv=0, el='basic', ok=true;
  if(x.kind==='sk'){ const d=SKILLS[x.id]; if(!d) return ''; name=d.name; desc=d.desc||''; lv=skillLvOf(sk,x.id); el=d.el||'basic'; ok=sk.owned&&sk.owned.includes(x.id); }
  else if(x.kind==='pass'){ const d=PASSIVES[x.id]; if(!d) return ''; lv=Math.max(1,skillLvOf(sk,x.id)); name=d.name; desc=passiveText(x.id,lv); ok=sk.owned&&sk.owned.includes(x.id); }
  else if(x.kind==='cave'){ const d=CAVE_SKILLS[x.id]; if(!d) return ''; name=d.name; desc=d.desc||''; lv=caveLevelOf(x.id); el=d.el||'basic'; ok=lv>0; }
  else { const d=ultDef(x.id); if(!d) return ''; name=d.name; desc=d.desc||''; el=d.el||'basic'; ok=x.id===sk.wdu||(typeof ultOwned==='function'&&ultOwned(sk,GEAR.cave,x.id)); }
  const worn=chrWorn(x), d0=x.kind==='sk'?SKILLS[x.id]:null;
  return '<div class="chr-sk'+(worn?' on':'')+(ok?'':' off')+'"><span class="chr-ic">'+(d0?skIconOf(d0):elSvg(el))+'</span><div class="chr-skt"><b>'+name+(lv?' <small>Lv '+lv+'</small>':'')+'</b><em>'+KIND_TITLE[x.slot]+(el!=='basic'&&ELEMS[el]?' &middot; '+ELEMS[el].name:'')+'</em><p>'+desc+'</p></div>'
    +'<span class="chr-sw">'+(worn?'<i class="chr-worn">Worn</i>':'')+'<button class="chr-swap" data-chrswap="'+x.slot+'" title="Swap: wear something else in this slot (off the Bond)" aria-label="Swap '+KIND_TITLE[x.slot]+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg></button></span>'+(ok?'':'<i class="chr-lk">not yours yet</i>')+'</div>';
}
function chrSkillsHtml(k){
  const own=chrOwn(k), rows=chrPieces(k).map(chrPieceRow).join('');
  return '<p class="bdc-note">'+(own?'Play wears all of them. The small swap button opens the skills panel on that slot if you want something else there: a piece from elsewhere is off the '+(k==='wanderer'?'path':'Bond')+'.':'Unlock this character on the Bond tab to wear their skills.')+' As a '+(CHR_CLS[clsOf()]||clsOf())+' (the weapon in your hand).</p><div class="chr-sks">'+rows+'</div>';
}
// ---- the bond, path and look tabs (the cards are bond/panel.js's) ----
function chrBondHtml(k){
  const keep=BDC.sel; BDC.sel=k; const h=(k==='wanderer'?bdcWandererHtml():bdcCardHtml(k)); BDC.sel=keep;
  return '<div class="chr-bd">'+h+'</div><div class="chr-bdx"><button class="chip" data-chrall="1">Every character, the orb pouch and the Stirrings</button></div>';
}
function chrPathHtml(){ const cur=bdcPath(); return '<div class="chr-path">'+bdcPathsHtml(cur)+'</div>'; }
function chrLookHtml(k){
  const S=SS_SETS[k], E=bdcEntry(k), id=S&&S.outfit, bought=!!(GEAR.os&&GEAR.os.includes(id)), on=LOOK&&LOOK.model===id;
  if(!id) return '<p class="bdc-note">This character has no outfit yet.</p>';
  const free=E.b>=0;
  return '<div class="chr-look"><p class="bdc-note">'+(free?S.char.name+'\'s look is yours to wear for free while you have their Bond, exactly as designed.':'Unlock '+S.char.name+' (Bond 0) to wear their look for free.')
    +' Changing anything about it (colours, mixing its pieces into another look) needs the outfit set from the gem shop'+(bought?' (you own it: the character editor has every piece)':'')+'.</p>'
    +'<div class="chr-la">'+(free?'<button class="chip buy" data-chrlook="'+k+'"'+(on?' disabled':'')+'>'+(on?'Wearing it':'Wear '+S.char.name+'\'s look')+'</button>':'')
    +(on?'<button class="chip" data-chrlook="">Back to my own look</button>':'')+'</div></div>';
}
// wearing the look: model = the outfit, every tint as designed (-1); "back" restores the look saved before
let CHR_OWN_LOOK=null;
function chrWearLook(k){
  if(!k){ if(CHR_OWN_LOOK){ LOOK=fullLook(CHR_OWN_LOOK); CHR_OWN_LOOK=null; } else { LOOK=fullLook(Object.assign({},LOOK,{model:'base'})); } saveLook(); rebuildHiker(); UI_SFX.click(); awcRender(); return; }
  const S=SS_SETS[k], id=S&&S.outfit; if(!id||!(bdcEntry(k).b>=0)) return;
  if(!CHR_OWN_LOOK&&LOOK.model!==id) CHR_OWN_LOOK=Object.assign({},LOOK);
  const L=Object.assign({},LOOK,{model:id}); for(const f of Object.keys(L)) if(/^tint[A-Z]/.test(f)) L[f]=-1;
  LOOK=fullLook(L); saveLook(); rebuildHiker(); UI_SFX.success(); awcRender();
}
// ---- drawing ----
function chrPut(id,html){ if(AWC.html[id]!==html){ AWC.html[id]=html; $('#'+id).innerHTML=html; return true; } return false; }
function chrRender(){
  const k=AWC.set; if(!k||!GEAR) return;
  const tabs=chrTabsOf(k); if(!tabs.some(t=>t[0]===AWC.tab)) AWC.tab=chrOwn(k)?'sk':'bd';
  if(chrPut('chrHero',chrHeroHtml(k))) chrPic(k);
  chrPut('chrTabs',tabs.map(t=>'<button class="chip chr-tb" role="tab" data-chrtab="'+t[0]+'" aria-selected="'+(t[0]===AWC.tab)+'">'+t[1]+'</button>').join(''));
  for(const [t,id] of [['awk','chrVAwk'],['sk','chrVSk'],['bd','chrVBd'],['path','chrVPath'],['look','chrVLook']]) $('#'+id).hidden=AWC.tab!==t;
  if(AWC.tab==='sk') chrPut('chrVSk',chrSkillsHtml(k));
  else if(AWC.tab==='bd') chrPut('chrVBd',chrBondHtml(k));
  else if(AWC.tab==='path') chrPut('chrVPath',chrPathHtml());
  else if(AWC.tab==='look') chrPut('chrVLook',chrLookHtml(k));
}
// one listener for the frame's buttons (the tree's own are awakening/panel.js's)
$('#awc').addEventListener('click',e=>{
  const t=e.target&&e.target.closest?e.target.closest('[data-chrtab],[data-chrswap],[data-chrall],[data-chrlook],[data-bdcplay],[data-bdcbuy],[data-bdcpick],[data-bdcpath],[data-bdcsel]'):null; if(!t||t.disabled) return;
  const d=t.dataset;
  if(d.chrtab) chrTab(d.chrtab);
  else if(d.chrswap) openSkills(null,d.chrswap);
  else if(d.chrall) bdcOpenBonds(AWC.set==='wanderer'?null:AWC.set);
  else if(d.chrlook!==undefined) chrWearLook(d.chrlook);
  else if(d.bdcplay) bdcPlay(d.bdcplay);
  else if(d.bdcbuy) bdcBuy(d.bdcbuy);
  else if(d.bdcpick) bdcPick(d.bdcpick);
  else if(d.bdcpath) bdcSetPath(d.bdcpath);
});
