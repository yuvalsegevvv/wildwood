//@ Bonds on the skill tiles and the set cards: the +1 a Bond gives, the guest tag and its -2, the action bar's level, and the skillsets panel's Bond rows with the active Bond
/* Agent map (skills revamp step 16; PLAN section 3; rules: shared/bond.js; the server writes the level changes into gear.skills.bdx {main, act, g, p, r, lv}, the client reads the same field; styles/38-bonds.css; test: client-smoke).
   bdcLvInfo(S, id) -> {d (the Bond's change, + or -), base (the tree's level), eff (skillLvOf: the level in play), guest} or null when the active Bond does not touch the skill (S = GEAR.skills).
   bdcTileBadge(S, id) -> markup for a skill tile: a green "+1" for the main character's pieces at Bond III / V, a "guest -2" tag for a piece of another character worn beside the main (the real change when the floor of level 1 cuts it).
   bdcLvNote(S, id) a clause for the details ("(the tree is at 4, +1 from the Bond)").
   bdcAbLevel(el, ab, S) puts "Lv N" (and the +1 / guest mark) on an action-bar button through data-bd / data-bdk (38-bonds.css draws it); ab null clears it.
   bdcActiveLine(set, worn) -> a sentence for the skillsets panel: "Bond IV active (4 pieces worn)" for the character played, the guest note for another, or the Bond it has.
   bdcSetRowsHtml(setId, worn) -> the character's Bond rows (I / IV passives, II / VI rows), lit up to the active Bond; the skillsets panel (skillsets/panel.js) shows it where the hidden 3- / 5-piece rows were.
   Only function declarations: combat-hud.js asks for the badge while the page loads. */
function bdcLvInfo(S,id){
  const d=S?bdLvAddOf(S,id):0; if(!d) return null;
  const base=Math.max(1,Math.min(SKILL_MAX_LV,((S.lv&&S.lv[id])|0)||1)), eff=skillLvOf(S,id);
  return {d,base,eff,guest:d<0};
}
function bdcTileBadge(S,id){
  const I=bdcLvInfo(S,id); if(!I) return '';
  if(I.guest){ const real=I.eff-I.base; return '<i class="bdc-bd guest" title="A guest piece: another character than the one you play, '+(real?real+' levels':'already at level 1')+'">guest'+(real?' &minus;'+(-real):'')+'</i>'; }
  return '<i class="bdc-bd up" title="Bond: +'+I.d+' level'+(I.d===1?'':'s')+' (the tree is at '+I.base+')">+'+I.d+'</i>';
}
function bdcAbLevel(el,ab,S){
  if(!el||!el.setAttribute) return;
  if(!ab||!S){ el.setAttribute('data-bd',''); el.setAttribute('data-bdk',''); return; }
  const I=bdcLvInfo(S,ab.id), L=skillLvOf(S,ab.id);
  el.setAttribute('data-bd','Lv '+L+(I&&I.guest?' guest':'')); el.setAttribute('data-bdk',I?(I.guest?'guest':'up'):'');
}
const bdcRoman=b=>BD_ROMAN[Math.max(0,Math.min(BD_TOP,b|0))];
function bdcActiveLine(set,worn){
  const X=GEAR&&GEAR.skills&&GEAR.skills.bdx, B=GEAR&&GEAR.bd, E=bdOwnKey(B,set)&&typeof B[set]==='object'?B[set]:null, have=E&&E.b>=0?E.b:-1;
  if(X&&X.main===set){ const a=X.act; return a>=1?'Bond '+bdcRoman(a)+' active ('+worn+' piece'+(worn===1?'':'s')+' worn'+(X.g?', '+X.g+' guest':'')+')':'You play '+SS_SETS[set].char.name+': Bond '+(have>=0?bdcRoman(have):'locked')+', '+worn+' piece'+(worn===1?'':'s')+' worn'+(have>=0&&a<=0?' (the active Bond is the lower of the two, less one per guest piece)':''); }
  return worn>0?'A guest piece: another character than the one you play, '+BD_GUEST_PEN+' levels lower, no Bond of its own':'Bond '+(have>=0?bdcRoman(have):'locked')+' (it works when you play '+SS_SETS[set].char.name+')';
}
function bdcSetRowsHtml(setId,worn){
  const S=SS_SETS[setId], X=GEAR&&GEAR.skills&&GEAR.skills.bdx, act=X&&X.main===setId?X.act:-1; if(!S||!S.bonds) return '';
  const step=(b,name,text)=>'<div class="sk-set-b'+(act>=b?' on':'')+'"><i>Bond '+BD_ROMAN[b]+'</i><span><b>'+name+'</b> '+text+(act>=b?'':' <em>(needs Bond '+BD_ROMAN[b]+' active)</em>')+'</span></div>';
  const P1=PASSIVES[S.bonds[1]], P4=PASSIVES[S.bonds[4]], R2=S.bonus[3], R6=S.bonus[5];
  return '<div class="bdc-active">'+bdcActiveLine(setId,worn)+'</div>'
    +(P1?step(1,P1.name,passiveText(S.bonds[1],BD_PASS_LV)):'')+(R2?step(2,R2.name,ssBonusText(R2)):'')+(P4?step(4,P4.name,passiveText(S.bonds[4],BD_PASS_LV)):'')+(R6?step(6,R6.name,ssBonusText(R6)):'');
}
function bdcLvNote(S,id){   // " (+1 from the Bond)" / " (guest piece, -2)" after "Level 5 of 8" in a skill's details
  const I=bdcLvInfo(S,id); if(!I) return '';
  return I.guest?' (a guest piece: '+(I.eff-I.base?(I.eff-I.base)+' from the tree\'s '+I.base:'at the floor')+')':' (the tree is at '+I.base+', +'+I.d+' from the Bond)';
}
