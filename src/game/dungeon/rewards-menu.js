//@ The Delves rewards menu: what each of the eight dungeons pays at each of the eleven tiers (the cards, the tier strip, the piece count, the equipment-level split, the rarity line, the pool, a details card, the Compare tiers table)
/* Agent map (docs/DUNGEON-REVAMP.md section 7b; markup #dgRewards in index.html; styles/41-delves.css; test tools/dungeon-rewards-menu-smoke.js).
   Public:  dgrmOpen(themeId,tier)   opens the panel on that dungeon (tier: 0-10, default the highest open one); dgrmRender() redraws it; DGRM = {th, tier, pick} the state.
   Opened from: the Delve board's "Rewards" chip (board.js), the inventory header's "Delves" button (#invDelves, bound below), the travel window's Dungeons tab (ui/travel.js).
   Reads:   only shared data: DG_TIERS (levels, piece counts, the eq split), DG_REWARDS (kind, pool), DG_REWARD_W (the rarity line), rlLinesFor (rolled lines of an eq level), dgItem / dgPieceId
            (the records of the pool's pieces), DG_THEMES / DG_LANDS / dgGateOpen (the lock) and GEAR.dg.top (tiers cleared, from the `you` message). Nothing is sent to the server.
   Uses:    dgBoardEl / dgBoardAdd (board.js), mpPic / mpFill (ui/mon-pics.js), itemIcon, dgStatHtml. Prefix dgrm / DGRM_. */
const DGRM={th:'hollowroots',tier:0,pick:null};
const DGRM_KIND={weapon:'Weapons',armor:'Armour',ring:'Rings',pendant:'Pendants',talisman:'Talismans',cape:'Capes',gloves:'Gloves',shield:'Shields'};
const DGRM_EQ=[30,40,50,60], DGRM_SHADE=['#7fa86a','#5fb4c8','#c58bf0','#f0b050'];   // eq level 30 / 40 / 50 / 60 in four shades
const dgrmThemes=()=>Object.keys(DG_ENTRANCES).filter(id=>DG_THEMES[id]&&DG_THEMES[id].land&&DG_REWARDS[id]);
const dgrmTop=()=>dgtTop(GEAR);
const dgrmEqMost=t=>{ const W=DG_TIERS[t].eq; let b=0; for(let i=1;i<W.length;i++) if(W[i]>W[b]) b=i; return b; };   // the most likely equipment level of a tier (index 0-3)
const dgrmPieces=t=>{ const n=DG_TIERS[t].n; return n[0]===n[1]?String(n[0]):n[0]+'-'+n[1]; };
// the record of one pool piece at equipment index eq, common and untempered (null when the id is not valid)
const dgrmItem=(th,pick,eq)=>{ const R=DG_REWARDS[th]; return R?dgItem(dgPieceId(R.kind,pick,7+eq,0,0)):null; };
function dgrmOpen(th,tier){
  if(!DG_REWARDS[th]) th=dgrmThemes()[0];
  if(DGRM.th!==th) DGRM.pick=null;
  DGRM.th=th; DGRM.tier=dgtClamp(tier===undefined?Math.min(DG_TIER_MAX,dgrmTop()):tier);
  openPanel('dgRewards'); dgrmRender();
}
function dgrmKindIcon(th){ const R=DG_REWARDS[th], it=dgrmItem(th,R.pool[0],0); return it?'<span class="dgr-kico">'+itemIcon(it)+'</span>':''; }
function dgrmCard(th){
  const T=DG_THEMES[th], B=DG_BOSSES[T.boss], R=DG_REWARDS[th], open=dgGateOpen(GEAR,T), info=DG_BOARD_INFO[th]||{};
  const b=dgBoardEl('button','dgr-card'+(th===DGRM.th?' on':'')+(open?'':' locked')); b.type='button'; b.dataset.th=th; b.style.setProperty('--dgc',info.color||'#cdd98f');
  b.title=open?T.name:DG_LANDS[T.land].hint;
  const pic=dgBoardEl('span','dgr-pic'); const ph=mpPic(T.boss); if(ph) pic.innerHTML=ph; else pic.textContent=(B&&B.short||T.name).charAt(0);
  const tx=dgBoardEl('span','dgr-ct'); dgBoardAdd(tx,dgBoardEl('b',null,T.name),dgBoardEl('small',null,DG_LANDS[T.land].name+(open?'':' · locked')));
  const kind=dgBoardEl('span','dgr-kind'); kind.innerHTML=dgrmKindIcon(th); kind.title=DGRM_KIND[R.kind]||R.kind;
  dgBoardAdd(b,pic,tx,kind,open?null:dgBoardEl('span','dgr-lock','🔒'));
  b.addEventListener('click',()=>{ UI_SFX.click(); dgrmOpen(th,DGRM.tier); });
  return b;
}
function dgrmStrip(){
  const top=dgrmTop(), s=dgBoardEl('div','dgr-tiers');
  for(let t=0;t<=DG_TIER_MAX;t++){
    const st=t<top?'done':t===top?'open':'lock', b=dgBoardEl('button','dgr-tier '+st+(t===DGRM.tier?' sel':'')); b.type='button'; b.dataset.tier=String(t);
    dgBoardAdd(b,dgBoardEl('b',null,DG_BOARD_ROMAN[t]),dgBoardEl('small',null,'Lv '+DG_TIERS[t].lv),dgBoardEl('i',null,st==='done'?'✓':st==='lock'?'🔒':'★'));
    b.title=st==='lock'?'Clear tier '+DG_BOARD_ROMAN[t-1]+' first':st==='done'?'Cleared':'Open';
    b.addEventListener('click',()=>{ UI_SFX.click(); DGRM.tier=t; dgrmRender(); });
    s.appendChild(b);
  }
  return s;
}
// the equipment-level split as one stacked bar, then the rolled lines each level carries
function dgrmSplit(t){
  const W=DG_TIERS[t].eq, wrap=dgBoardEl('div','dgr-split'), bar=dgBoardEl('div','dgr-bar'), key=dgBoardEl('div','dgr-key');
  for(let i=0;i<W.length;i++){ if(!W[i]) continue;
    const seg=dgBoardEl('span','dgr-seg',W[i]>=9?W[i]+'%':''); seg.style.width=W[i]+'%'; seg.style.background=DGRM_SHADE[i]; seg.title='Equipment level '+DGRM_EQ[i]+': '+W[i]+'%'; bar.appendChild(seg);
    const k=dgBoardEl('span','dgr-k'); const dot=dgBoardEl('i'); dot.style.background=DGRM_SHADE[i];
    dgBoardAdd(k,dot,dgBoardEl('span',null,'Lv '+DGRM_EQ[i]+' · '+W[i]+'% · '+rlLinesFor(7+i)+(rlLinesFor(7+i)===1?' line':' lines'))); key.appendChild(k); }
  return dgBoardAdd(wrap,dgBoardEl('div','dgr-h','Equipment level of each piece'),bar,key);
}
function dgrmRarity(){
  const w=dgBoardEl('div','dgr-rar'); w.appendChild(dgBoardEl('div','dgr-h','Rarity of each piece'));
  const row=dgBoardEl('div','dgr-rarow'); for(let r=0;r<DG_REWARD_W.length;r++){ const c=dgBoardEl('span','dgr-rc',RARITY[r]+' '+(DG_REWARD_W[r]/10)+'%'); c.style.color=RAR_COL[r]; c.style.borderColor=RAR_COL[r]; row.appendChild(c); }
  w.appendChild(row); return w;
}
function dgrmPool(th,t){
  const R=DG_REWARDS[th], eq=dgrmEqMost(t), w=dgBoardEl('div','dgr-pool'); const tiles=dgBoardEl('div','dgr-tiles');
  for(const pick of R.pool){ const it=dgrmItem(th,pick,eq); if(!it) continue;
    const b=dgBoardEl('button','dgr-tile'+(DGRM.pick===pick?' on':'')); b.type='button'; b.dataset.pick=String(pick); b.title=it.name;
    const ic=dgBoardEl('span','it-ico r'+it.rar); ic.innerHTML=itemIcon(it); b.appendChild(ic); b.appendChild(dgBoardEl('small',null,it.name.replace(/ Lv\d+$/,'')));
    b.addEventListener('click',()=>{ UI_SFX.click(); DGRM.pick=DGRM.pick===pick?null:pick; dgrmRender(); }); tiles.appendChild(b); }
  dgBoardAdd(w,dgBoardEl('div','dgr-h','What it can pay ('+(DGRM_KIND[R.kind]||R.kind)+', '+R.pool.length+' kinds; one is picked at random for each piece)'),tiles);
  if(DGRM.pick!==null&&R.pool.includes(DGRM.pick)){   // the details card: the fixed bonus at every equipment level this tier can roll
    const card=dgBoardEl('div','dgr-info'), it0=dgrmItem(th,DGRM.pick,eq); const W=DG_TIERS[t].eq;
    if(it0){ const nm=dgBoardEl('b',null,it0.name.replace(/ Lv\d+$/,'')); nm.style.color=RAR_COL[0]; card.appendChild(nm);
      for(let i=0;i<W.length;i++){ if(!W[i]) continue; const it=dgrmItem(th,DGRM.pick,i); if(!it) continue; const l=dgBoardEl('div','dgr-il'); l.innerHTML='<span>Lv '+it.lv+' (common, +0)</span><span>'+dgStatHtml(it)+'</span><span class="muted">'+rlLinesFor(7+i)+' rolled</span>'; card.appendChild(l); }
      card.appendChild(dgBoardEl('p','dgr-note','Rarity multiplies the bonus (x'+RAR_MULT.join(' / x')+') and each tempering step adds 10%.')); w.appendChild(card); }
  }
  return w;
}
function dgrmCompare(th){
  const tb=dgBoardEl('table','dgr-cmp'), hd=dgBoardEl('tr'); for(const h of ['Tier','Level','Pieces','Lv 30','Lv 40','Lv 50','Lv 60']) hd.appendChild(dgBoardEl('th',null,h)); tb.appendChild(hd);
  for(let t=0;t<=DG_TIER_MAX;t++){ const r=dgBoardEl('tr',t===DGRM.tier?'sel':''), W=DG_TIERS[t].eq;
    dgBoardAdd(r,dgBoardEl('td',null,DG_BOARD_ROMAN[t]),dgBoardEl('td',null,String(DG_TIERS[t].lv)),dgBoardEl('td',null,dgrmPieces(t))); for(const w of W) r.appendChild(dgBoardEl('td',w?'':'zero',w?w+'%':'–'));
    r.addEventListener('click',()=>{ DGRM.tier=t; dgrmRender(); }); tb.appendChild(r); }
  return dgBoardAdd(dgBoardEl('div','dgr-cw'),dgBoardEl('div','dgr-h','Compare tiers'),tb);
}
function dgrmRender(){
  if($('#dgRewards').hidden) return;
  const body=$('#dgrBody'), th=DGRM.th, T=DG_THEMES[th], t=dgtClamp(DGRM.tier), top=dgrmTop(), open=dgGateOpen(GEAR,T), info=DG_BOARD_INFO[th]||{};
  body.innerHTML='';
  const list=dgBoardEl('div','dgr-list'); for(const id of dgrmThemes()) list.appendChild(dgrmCard(id));
  const main=dgBoardEl('div','dgr-main'); main.style.setProperty('--dgc',info.color||'#cdd98f');
  const hd=dgBoardEl('div','dgr-hero'); dgBoardAdd(hd,dgBoardEl('h3',null,T.name),dgBoardEl('div','dgr-sub',DG_LANDS[T.land].name+' · pays '+(DGRM_KIND[DG_REWARDS[th].kind]||'')+' · boss level '+T.lv));
  main.appendChild(hd);
  if(!open) main.appendChild(dgBoardEl('p','dgb-state no','Locked: '+DG_LANDS[T.land].hint));
  main.appendChild(dgrmStrip());
  main.appendChild(dgBoardEl('p','dgb-state '+(t<=top?'ok':'no'),t<top?'Tier '+DG_BOARD_ROMAN[t]+' cleared.':t===top?'Tier '+DG_BOARD_ROMAN[t]+' is open: your highest.':'Locked: clear tier '+DG_BOARD_ROMAN[t-1]+' of any dungeon first.'));
  const rc=dgBoardEl('div','dgr-reward');
  const cnt=dgBoardEl('div','dgr-cnt'); dgBoardAdd(cnt,dgBoardEl('b',null,dgrmPieces(t)+(DG_TIERS[t].n[1]===1?' piece':' pieces')+' a clear'),dgBoardEl('span',null,'monster level '+DG_TIERS[t].lv));
  const pips=dgBoardEl('span','dgr-pips'); for(let i=0;i<DG_TIERS[t].n[1];i++) pips.appendChild(dgBoardEl('i',i<DG_TIERS[t].n[0]?'sure':null)); cnt.appendChild(pips);
  dgBoardAdd(rc,cnt,dgrmSplit(t),dgrmRarity(),dgrmPool(th,t)); main.appendChild(rc); main.appendChild(dgrmCompare(th));
  dgBoardAdd(body,list,main); mpFill(body);
}
$('#invDelves').addEventListener('click',()=>{ UI_SFX.click(); dgrmOpen(DGRM.th); });
