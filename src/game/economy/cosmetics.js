//@ The Cosmetics section of the Wayfarers' Lodge panel (version 3.2): every crafted hat, top, bottom, shoes, gloves, cape and aura with its recipe (resources and monsters' drops), and a Make button; cosRecipeText; the tools' small stat bonus line; the Go home / Leave home button
/* Called by renderLodge (economy/professions.js): cosLodgeHtml(gear) returns the markup, cosLodgeBind(box) wires its buttons (cosmake{type,id}: server/cosmetics.js). Wearing what you made is the
   character editor's Cosmetics tab (ui/character-editor.js). test: client-smoke, tools/revamp-smoke.js */
// one line for a recipe: "6 Iron Ore, 10 Boar Tusk (dropped by Boar), 150 coins" (the editor's tooltips and try-on bar use it too)
function cosRecipeText(type,id){
  const D=cpDef(type,id); if(!D||!D.recipe) return 'free';
  const C=D.recipe, parts=C.res.map(([r,n])=>n+' '+RES[r].name).concat(C.mats.map(([m,n])=>n+' '+MATS[m].name+' (dropped by '+MATS[m].from+')'));
  return 'make it at a Wayfarers\' Lodge: '+parts.join(', ')+', '+C.coins+' coins';
}
function cosCostHtml(cost,res,mats){
  const chip=(have,n,col,txt)=>`<span class="${have>=n?'':'muted'}"><i style="background:${col}"></i>${n} ${txt}${have>=n?'':' ('+have+')'}</span>`;
  return cost.res.map(([r,n])=>chip(res[r]||0,n,RES[r].col,RES[r].name)).concat(cost.mats.map(([m,n])=>chip(mats[m]||0,n,MATS[m].col,MATS[m].name+' <em>from '+MATS[m].from+'</em>'))).join(' ')+' · '+cost.coins+' coins';
}
// every crafted piece of one slot: [id, name, text]
function cosCraftedOf(type){
  if(type==='a') return COS_AURAS.filter(d=>!cpIsFree('a',d[0])).map(d=>[d[0],d[1],d[8]]);
  if(type==='c') return COS_CAPES.filter(d=>!cpIsFree('c',d[0])).map(d=>[d[0],d[1],d[6]]);
  return CP_PIECES.filter(r=>r[0]===type).map(r=>[r[1],r[2],r[4]]);
}
function cosLodgeHtml(g){
  const own=g.cos||[], res=g.res||{}, mats=g.mats||{}, coins=g.coins||0;
  let h=`<div class="inv-h">Cosmetics <span>hats, clothes, capes and auras made from ore, logs, herbs and monsters' drops: try them on in the character editor first</span></div>`;
  for(const type of ['h','t','b','s','g','c','a','d','w']){
    h+=`<p class="lo-intro"><b>${CP_SLOTS[type][2]}s</b> <span class="muted">${type==='c'?'(the backpack, Wayfarer\'s and Mossback are free)':type==='a'?'(Firefly Veil and Dewfall are free)':type==='w'?'(optional, for looks only: nothing is worn unless you pick one; all are made)':type==='d'?'(wear up to three at once, any of them anywhere; all are made, none are free)':'(the plain ones are free)'}</span></p>`;
    for(const [id,name,text] of cosCraftedOf(type)){
      const cost=cosCost(type,id), has=own.includes(cosKey(type,id)), can=cost.res.every(([r,n])=>(res[r]||0)>=n)&&cost.mats.every(([m,n])=>(mats[m]||0)>=n)&&coins>=cost.coins;
      h+=`<div class="lo-sell"><span class="mat"><b>${name}</b></span><span class="muted">${text}</span><small>${cosCostHtml(cost,res,mats)}</small>`
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
// the way home / out: a lodge panel opened at a village lodge offers Go home, one opened at your home's bench offers Leave home (server/professions.js homeP)
function cosHomeHtml(){
  if(!HOME_YARD) return '';
  return `<div class="inv-h">Your home <span>a private plot: nobody else sees it</span></div><div class="lo-sell"><span class="muted">${atHome()?'Your nodes grow every grade of ore, tree and herb here, and they grow back for you alone.':'Walk in from any lodge. Your ore, trees and herbs grow there for you alone.'}</span><button class="chip" data-home="${atHome()?'leave':'enter'}">${atHome()?'Leave home':'Go home'}</button></div>`;
}
function cosLodgeBind(B){
  B.querySelectorAll('[data-home]').forEach(b=>b.onclick=()=>{ netSend({t:'home',a:b.dataset.home}); closePanels(); UI_SFX.click(); });
  B.querySelectorAll('[data-cosmake]').forEach(b=>b.onclick=()=>{ const [type,id]=b.dataset.cosmake.split(':'); netSend({t:'cosmake',type,id}); UI_SFX.pickup(); });
}
