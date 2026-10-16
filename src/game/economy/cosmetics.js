//@ The Cosmetics section of the Wayfarers' Lodge panel (version 3): the auras and capes you can make, their cost, and a Make button; and the tools' small stat bonus line
/* Called by renderLodge (economy/professions.js): cosLodgeHtml(gear) returns the markup, cosLodgeBind(box) wires its buttons (cosmake{type,id}: server/cosmetics.js). Wearing what you made is the
   character editor's Cosmetics tab (ui/character-editor.js). test: client-smoke, tools/revamp-smoke.js */
function cosCostHtml(cost,res){ return cost.res.map(([r,n])=>`<span class="${(res[r]||0)>=n?'':'muted'}"><i style="background:${RES[r].col}"></i>${n} ${RES[r].name}</span>`).join(' ')+' · '+cost.coins+' coins'; }
function cosLodgeHtml(g){
  const own=g.cos||[], res=g.res||{}, coins=g.coins||0;
  let h=`<div class="inv-h">Cosmetics <span>made from what you gather: wear them in the character editor</span></div>`;
  for(const [type,defs,label] of [['a',COS_AURAS,'Auras'],['c',COS_CAPES,'Capes']]){
    h+=`<p class="lo-intro"><b>${label}</b></p>`;
    for(const d of defs){
      const id=d[0], name=d[1], text=d[type==='a'?8:6], cost=cosCost(type,id), has=own.includes(cosKey(type,id)), can=cost.res.every(([r,n])=>(res[r]||0)>=n)&&coins>=cost.coins;
      h+=`<div class="lo-sell"><span class="mat"><b>${name}</b></span><span class="muted">${text}</span><small>${cosCostHtml(cost,res)}</small>`
        +(has?`<span class="lo-state ok">Made</span>`:`<button class="chip" data-cosmake="${cosKey(type,id)}" ${can?'':'disabled'}>Make</button>`)+`</div>`;
    }
  }
  return h;
}
// the small bonus the three worn tools give (shared/professions.js toolBonusOf): one line, or '' when none is good enough yet
function cosToolBonusText(g){
  const names={atk:'attack',hp:'health',def:'defence'}, out=[];
  for(const s of TOOL_SLOTS){ const v=toolBonusOf(g,s); if(v>0) out.push('+'+(v*100).toFixed(1).replace('.0','')+'% '+names[TOOL_BONUS_STAT[s]]+' ('+TOOL_KIND[s].toLowerCase()+')'); }
  return out.length?out.join(', '):'';
}
function cosLodgeBind(B){
  B.querySelectorAll('[data-cosmake]').forEach(b=>b.onclick=()=>{ const [type,id]=b.dataset.cosmake.split(':'); netSend({t:'cosmake',type,id}); UI_SFX.pickup(); });
}
