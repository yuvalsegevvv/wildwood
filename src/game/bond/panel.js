//@ The Bonds panel: every character's Bond 0-VI as pips with the stones held against the next step, the zone-tier gate, what each step gives and a Buy button; the orb pouch (the pick, the charge, the stall), the Wanderer's Realization and this hour's Stirrings
/* Agent map (skills revamp step 16; PLAN section 3; rules: shared/bond.js; the server's word on every purchase: server/bond.js bdBuyP; protocol: docs/PROTOCOL.md `bd`; styles/38-bonds.css; test: client-smoke, the bonds block).
   Open: bdcOpenBonds(set) (the Bonds buttons of the skills panel and the Awakening panel, #bdc in PANELS: ui/panels.js); the orb stall's own panel stays in bond/orbs.js (#orbs), its link is in the pouch.
   Sends: bd {a:'buy', set} | bd {a:'play', set} (Play: the character in play, bdcPlay) | bd {a:'pick', set | null} | bd {a:'path', id} (the Wanderer's path picker, bdcSetPath; step 18). Hears: the bd event [pid, set, bond] (bdcOnBond: a ring on the card, a toast-free redraw) and every you update (applyGear: bdcBondsRender), so the panel shows what the server last said.
   Reads the gear mirror: GEAR.bd[<set>] {b, st, o}, GEAR.bd.pick / chg / wanderer.r / wanderer.path, GEAR.skills.bdx {main, act, g}, GEAR.zt (zoneTierMax), GEAR.mq (the acts: bdActDone).
   State: BDC = {sel (the card that shows its steps), filter ('all' | 'own' | 'can'), stirOpen (the Stirrings box: null = open on a wide screen, folded on a phone), html (the last markup per box: the DOM is only touched when it changed), wait, ring (the card that just rose), bound}.
   Cards: wanderer first, then the characters you own, then the rest. bdcEntry(k), bdcNext(k) {to, need, have, stOk, tierNeed, tierOk, can, why}, bdcStepsHtml(k), bdcOrbSet() (the character whose orb opens next, as the server's bdOrbSetOf). */
const BDC={sel:null,filter:'all',html:{},wait:0,ring:null,bound:false,stirOpen:null};   // stirOpen: null = open on a wide screen, closed on a phone
const bdcEntry=k=>{ const B=(GEAR&&GEAR.bd)||{}, e=bdOwnKey(B,k)&&typeof B[k]==='object'?B[k]:null; return {b:e&&e.b>=0?e.b|0:-1,st:e?e.st|0:0,o:e?e.o|0:0}; };
// a character's colour as the card uses it: a dark one (Sazanka's blue) is lifted toward white so its text, pips and emblem read on the dark panel; bdcInk: the text on a filled pip
function bdcCol(S){ let r=S.pal.main>>16&255, g=S.pal.main>>8&255, b=S.pal.main&255; const lum=(0.299*r+0.587*g+0.114*b)/255;
  if(lum<0.42){ const t=0.5*(0.42-lum)/0.42+0.28; r=Math.round(r+(255-r)*t); g=Math.round(g+(255-g)*t); b=Math.round(b+(255-b)*t); }
  return '#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1); }
function bdcInk(col){ const n=parseInt(col.slice(1),16); return (0.299*(n>>16&255)+0.587*(n>>8&255)+0.114*(n&255))/255>0.55?'#14110c':'#fff'; }
const bdcSets=()=>SS_ORDER.filter(bdSetOk);
$('#skBonds').addEventListener('click',()=>bdcOpenBonds(AWC.set==='wanderer'?null:AWC.set));   // the Bonds overview: the button's name finally says where it goes (it opened the Characters panel's Skills tab)
$('#awcBonds').addEventListener('click',()=>bdcOpenBonds(AWC.set==='wanderer'?null:AWC.set));   // the Characters panel's head: the same Bonds button the skills panel has
$('#bdcSkills').addEventListener('click',()=>openSkills());   // the skills panel itself (the button's title always said so)
$('#bdcAwaken').addEventListener('click',()=>{ const X=GEAR&&GEAR.skills&&GEAR.skills.bdx; chrOpen(BDC.sel||(X&&X.main),'awk'); });   // bond: the Characters panel (awakening/hub.js)
function bdcOpenBonds(set){
  openPanel('bdc'); BDC.sel=bdSetOk(set)?set:null; BDC.html={}; bdcBind(); bdcBondsRender();
}
// the next step of one character: its price, the stones held, the zone tier asked and whether the Buy button works
function bdcNext(k){
  const S=SS_SETS[k], E=bdcEntry(k), to=E.b+1;
  if(to>BD_TOP) return {to:null,can:false,why:'Every step is bought'};
  const need=BD_COST[to], tn=bdTierNeed(S,to), have=zoneTierMax(GEAR,S.land), stOk=E.st>=need, tierOk=have>=tn, can=stOk&&tierOk;
  return {to,need,have:E.st,stOk,tierNeed:tn,tierHave:have,tierOk,can,why:!stOk?'Needs '+(need-E.st)+' more Bondstone'+(need-E.st===1?'':'s'):!tierOk?'Needs zone tier '+ZTIER_ROMAN[tn]+' in '+ZTIER_NAMES[S.land]:''};
}
function bdcOrbSet(){   // the same rule as the server: the pick if you hold an orb of theirs, else the character you hold most of (ties: the first in SS_ORDER)
  const B=(GEAR&&GEAR.bd)||{}; if(bdSetOk(B.pick)&&bdcEntry(B.pick).o>0) return B.pick;
  let best=null, bn=0; for(const k of bdcSets()){ const n=bdcEntry(k).o; if(n>bn){ best=k; bn=n; } } return best;
}
// what a step gives, in words
function bdcStepGive(S,b){
  if(b===0) return {name:'The character is yours',text:'their basic, skill and power are yours to wear'};
  if(b===1||b===4){ const id=S.bonds[b], P=PASSIVES[id]; return {name:P?P.name:'A passive',text:(P?passiveText(id,BD_PASS_LV):'')+' (works without wearing it)'}; }
  if(b===2||b===6){ const R=S.bonus[b===2?3:5]; return {name:R?R.name:'A set row',text:R?ssBonusText(R):''}; }
  return {name:'+1 level',text:'to all their pieces (skills, charge skill and burst)'};
}
function bdcStepsHtml(k){
  const S=SS_SETS[k], E=bdcEntry(k), N=bdcNext(k); let h='<ol class="bdc-steps">';
  for(let b=0;b<=BD_TOP;b++){ const G=bdcStepGive(S,b), tn=bdTierNeed(S,b), own=E.b>=b, nx=N.to===b;
    h+='<li class="'+(own?'own':nx?'next':'')+'"><i>'+(own?'&#10003;':BD_ROMAN[b])+'</i><span><b>'+(b?'Bond '+BD_ROMAN[b]+': ':'Bond 0: ')+G.name+'</b> '+G.text+'<em>'+BD_COST[b]+' stones'+(tn?' &middot; zone tier '+ZTIER_ROMAN[tn]+' in '+ZTIER_NAMES[S.land]+(zoneTierMax(GEAR,S.land)>=tn?' (met)':' (not yet)'):'')+'</em></span></li>'; }
  return h+'</ol>';
}
const bdcPips=(b,top)=>{ let h=''; for(let i=0;i<=top;i++) h+='<i class="bdc-pip'+(i<=b?' on':i===b+1?' next':'')+'" title="Bond '+BD_ROMAN[i]+'">'+BD_ROMAN[i]+'</i>'; return h; };
function bdcCardHtml(k){
  const S=SS_SETS[k], E=bdcEntry(k), N=bdcNext(k), X=GEAR.skills&&GEAR.skills.bdx, main=X&&X.main===k, B=GEAR.bd||{}, open=BDC.sel===k, pk=B.pick===k, own=E.b>=0;
  const pct=N.to===null?100:Math.round(100*Math.min(1,E.st/N.need));
  const gate=N.to===null||!N.tierNeed?'':'<div class="bdc-gate '+(N.tierOk?'ok':'bad')+'">Zone tier '+ZTIER_ROMAN[N.tierNeed]+' in '+ZTIER_NAMES[S.land]+': '+(N.tierOk?'met':'not yet (you: '+(N.tierHave?ZTIER_ROMAN[N.tierHave]:'none')+')')+'</div>';
  const buy=N.to===null?'<span class="bdc-max">Bond VI</span>':'<button class="chip buy" data-bdcbuy="'+k+'"'+(N.can&&!BDC.wait?'':' disabled')+' title="'+(N.can?'':N.why)+'">'+(own?'Buy Bond '+BD_ROMAN[N.to]:'Unlock')+' ('+N.need+')</button>';
  return '<div class="bdc-card'+(own?' own':'')+(open?' open':'')+(main?' main':'')+(N.can?' ready':'')+(BDC.ring===k?' ring':'')+'" style="--c:'+bdcCol(S)+';--ci:'+bdcInk(bdcCol(S))+'" data-k="'+k+'">'
    +'<button class="bdc-top" data-bdcsel="'+k+'" aria-expanded="'+open+'"><span class="bdc-emb'+(portHtml(k)?' has-port':'')+'">'+(portHtml(k)||'<svg '+SS_ICON_ATTR+'>'+(S.emblem?S.emblem.glyph:'')+'</svg>')+'</span><span class="bdc-nm"><b>'+S.char.name+(main?' <u>playing</u>':'')+'</b><small>'+ZTIER_NAMES[S.land]+' &middot; tier '+ZTIER_ROMAN[S.tier]+'</small></span><span class="bdc-bn">'+(own?(E.b?'Bond '+BD_ROMAN[E.b]:'Bond 0'):'locked')+'</span></button>'
    +'<div class="bdc-pips">'+bdcPips(E.b,BD_TOP)+'</div>'
    +'<div class="bdc-st"><i class="bdc-bar"><u style="width:'+pct+'%"></u></i><span>'+(N.to===null?'every step bought':E.st+' / '+N.need+' stones for '+(own?'Bond '+BD_ROMAN[N.to]:'Bond 0 (unlock)'))+'</span></div>'+gate
    +(main&&X.act>=1?'<div class="bdc-act">Bond '+BD_ROMAN[X.act]+' active'+(X.g?' ('+X.g+' guest piece'+(X.g===1?'':'s')+' worn)':'')+'</div>':'')
    +'<div class="bdc-acts"><span class="bdc-orbs" title="Bond Orbs of this character held">'+E.o+' orb'+(E.o===1?'':'s')+'</span><button class="chip'+(pk?' on':'')+'" data-bdcpick="'+k+'" aria-pressed="'+pk+'" title="Open this character\'s orbs first">'+(pk?'Opens first':'Open first')+'</button>'+bdcPlayBtn(k,own,main)+buy+'</div>'
    +(open?bdcStepsHtml(k):'')+'</div>';
}
// the Wanderer: Realization 0-VI from the main quest's acts, no stones; I / II / IV / VI are the active path's rows (shared/wanderer.js), the path picker sends bd {a:'path', id} (step 18)
const BDC_REAL=[[0,'The Wanderer','no character\'s Bonds: the general skills and the path you walk',0],[1,'A path passive','your first path passive',1],[2,'A path row','a row of your path',2],[3,'+1 level','to every general skill: shop and class skills, general passives, charge skills and the path\'s passive and burst',3],[4,'A second path passive','the path\'s second passive',4],[5,'+1 level','to every general skill once more',4],[6,'A path row','the path\'s last row',4]];
const bdcPath=()=>GEAR?wdPathOf(GEAR):null;   // the active path (the server's word: GEAR.bd.wanderer.path, the default when missing)
// what Realization step b gives on path k: [name, text]; a step a path does not fill keeps BDC_REAL's words
function bdcRealGive(k,b){
  const W=k&&WD_PATHS[k], R=BDC_REAL[b]; if(!W) return [R[1],R[2]];
  if(b===0){ const U=ultDef(W.ult); return ['The Wanderer on the path of '+W.name,'the general skills, the path passive '+PASSIVES[W.passive].name+' (the tree\'s passive node) and the burst '+(U?U.name:'')+' (its burst node)']; }
  if(b===1||b===4){ const id=W.real[b]; return [PASSIVES[id].name,passiveText(id,BD_PASS_LV)+' (works by itself)']; }
  if(b===2||b===6){ const r=W.rows[b]; return [r.name,ssBonusText(r)]; }
  return [R[1],R[2]];
}
function bdcPathsHtml(cur){
  if(!WD_ORDER.length) return '';
  return '<div class="bdc-paths" role="group" aria-label="The Wanderer\'s path">'+WD_ORDER.map(k=>{ const W=WD_PATHS[k], on=k===cur; return '<button class="chip'+(on?' on':'')+'" data-bdcpath="'+k+'" aria-pressed="'+on+'" title="'+W.text.replace(/"/g,'&quot;')+'">'+W.name+' <small>'+({warrior:'Warrior',archer:'Archer',mage:'Mage'}[W.cls]||'')+' &middot; '+(W.el==='basic'?'no element':ELEMS[W.el].name)+'</small></button>'; }).join('')
    +'</div><p class="bdc-note">'+(WD_PATHS[cur]?WD_PATHS[cur].text+' ':'')+bdcPathKitHtml(cur)+' Changing path is free: the tree and the Realization stay.</p>';
}
// the path's own set for the class in hand (placeholders: shared/wanderer.js WD_PIECE_SRC), and how much of the Realization is in play: like a Bond, min(Realization, path pieces worn) - off-path pieces
function bdcPathKitHtml(k){
  const P=WD_PATHS[k], c=P&&P.pieces[P.cls]; if(!c) return '';   // (the path's own class: one class and one element each)
  const nm=[c.basic,c.skill,c.burst].map(id=>SKILLS[id]?SKILLS[id].name:'').filter(Boolean);
  return 'Its set: <b>'+nm.join('</b>, <b>')+'</b>, its passive <b>'+(PASSIVES[P.passive]?PASSIVES[P.passive].name:'')+'</b>, a general charge skill and its burst. Wear them for the Realization; anything else worn is off the path and costs a step.';
}
function bdcWandererHtml(){
  const r=((GEAR.bd||{}).wanderer||{}).r|0, X=GEAR.skills&&GEAR.skills.bdx, main=X&&X.main==='wanderer', open=BDC.sel==='wanderer', next=r<6?BDC_REAL[r+1]:null, pk=bdcPath(), W=pk&&WD_PATHS[pk];
  let steps=''; if(open){ steps='<ol class="bdc-steps">'; for(const R of BDC_REAL){ const b=R[0], own=r>=b, ask=b?MQ_ACTS[R[3]][1]:'', G=bdcRealGive(pk,b);
    steps+='<li class="'+(own?'own':b===r+1?'next':'')+'"><i>'+(own&&b?'&#10003;':BD_ROMAN[b])+'</i><span><b>'+(b?'Realization '+BD_ROMAN[b]+': ':'')+G[0]+'</b> '+G[1]+'<em>'+(b?'needs '+ask+' finished'+(own?' (done)':''):'always')+'</em></span></li>'; } steps+='</ol>'; }
  return '<div class="bdc-card own wand'+(open?' open':'')+(main?' main':'')+'" style="--c:#d9b26a" data-k="wanderer"><button class="bdc-top" data-bdcsel="wanderer" aria-expanded="'+open+'"><span class="bdc-emb">W</span><span class="bdc-nm"><b>The Wanderer'+(main?' <u>playing</u>':'')+'</b><small>'+(W?'the path of '+W.name+' &middot; ':'')+'no stones: the main quest\'s acts</small></span><span class="bdc-bn">Realization '+BD_ROMAN[r]+'</span></button>'
    +(main?'<div class="bdc-act">Realization '+BD_ROMAN[Math.max(0,X.act|0)]+' active ('+(X.on|0)+' path piece'+((X.on|0)===1?'':'s')+' worn'+(X.g?', '+X.g+' off the path':'')+')</div>':'')
    +'<div class="bdc-pips">'+bdcPips(r,BD_TOP)+'</div>'+bdcPathsHtml(pk)+'<div class="bdc-acts">'+bdcPlayBtn('wanderer',true,main)+'</div><div class="bdc-st"><span>'+(next?'Next: Realization '+BD_ROMAN[next[0]]+' when '+MQ_ACTS[next[3]][1]+' is finished':'Every Realization reached')+'</span></div>'+steps+'</div>';
}
// the path picker: free, any time; the you update that follows redraws the card
function bdcSetPath(k){
  if(!wdPathOk(k)){ UI_SFX.error(); return false; }
  if(k===bdcPath()) return false;
  netSend({t:'bd',a:'path',id:k}); UI_SFX.click(); return true;
}
function bdcPouchHtml(){
  const B=GEAR.bd||{}, ks=bdcSets(), total=ks.reduce((n,k)=>n+bdcEntry(k).o,0), chg=Math.min(BD_STIR_CHARGE,B.chg|0), next=bdcOrbSet();
  const opts='<option value=""'+(bdSetOk(B.pick)?'':' selected')+'>The one I hold most of</option>'+ks.filter(k=>bdcEntry(k).o>0||B.pick===k).map(k=>'<option value="'+k+'"'+(B.pick===k?' selected':'')+'>'+SS_SETS[k].char.name+' ('+bdcEntry(k).o+')</option>').join('');
  return '<div class="bdc-sh"><b>Orb pouch</b><span>'+total+' orb'+(total===1?'':'s')+' held</span></div>'
    +'<label class="bdc-pk">Opens next <select id="bdcPickSel" aria-label="Whose orbs open next">'+opts+'</select></label>'
    +'<div class="bdc-nx">'+(next?'Next orb: <b>'+SS_SETS[next].char.name+'</b>':'You hold no orbs: the stall sells them for '+BD_ORB_PRICE+' coin')+'</div>'
    +'<div class="bdc-st" title="Kills at the glowing spot of your land fill the charge; a full charge opens one orb. It is kept when the hour ends."><i class="bdc-bar chg"><u style="width:'+Math.round(100*chg/BD_STIR_CHARGE)+'%"></u></i><span>Stirring charge <b>'+chg+' / '+BD_STIR_CHARGE+'</b> &middot; a full charge opens an orb</span></div>'
    +'<button class="chip buy bdc-stall" data-bdcstall="1">Orb stall</button>';
}
function bdcFilterHtml(ks){
  const own=ks.filter(k=>bdcEntry(k).b>=0).length, can=ks.filter(k=>bdcNext(k).can).length;
  return [['all','All '+ks.length],['own','Owned '+own],['can','Can buy '+can]].map(f=>'<button class="chip" data-bdcfilter="'+f[0]+'" aria-pressed="'+(BDC.filter===f[0])+'">'+f[1]+'</button>').join('');
}
function bdcPut(id,html){ if(BDC.html[id]!==html){ BDC.html[id]=html; $('#'+id).innerHTML=html; } }
// which character's Bond is in play, and how to change it: the owner found it unclear (the main character is the worn power piece's set, bdMainOf on the server)
function bdcMainHtml(){
  const X=GEAR.skills&&GEAR.skills.bdx, k=X&&bdSetOk(X.main)?X.main:null;
  return '<p class="bdc-note bdc-main">'+(k?'Playing <b>'+SS_SETS[k].char.name+'</b>: Bond '+(X.act>=1?BD_ROMAN[X.act]:'0')+' active.':'Playing <b>the Wanderer</b> (no character\'s power worn).')
    +' Press <b>Play</b> on any character you own (or the Wanderer) to switch, free at any time. Their Bond grows with each of their pieces you wear; another character\'s piece is a guest.</p>';
}
function bdcBondsRender(){
  if($('#bdc').hidden||!GEAR) return;
  const ks=bdcSets().slice().sort((a,b)=>(bdcEntry(b).b>=0)-(bdcEntry(a).b>=0)), shown=ks.filter(k=>BDC.filter==='own'?bdcEntry(k).b>=0:BDC.filter==='can'?bdcNext(k).can:true);
  $('#bdcCoins').textContent=fmtCoins(GEAR.coins)+' coins';
  bdcPut('bdcPouch',bdcPouchHtml()); bdcPut('bdcStir',bdcStirBoxHtml(BDC.stirOpen===null?innerWidth>=720:BDC.stirOpen)); bdcPut('bdcFilter',bdcFilterHtml(ks));
  bdcPut('bdcGrid',bdcMainHtml()+(BDC.filter==='all'||BDC.filter==='own'?bdcWandererHtml():'')+shown.map(bdcCardHtml).join('')+(shown.length?'':'<p class="bdc-note">No character can buy a step right now: they need more Bondstones or a higher zone tier.</p>'));
}
function bdcBuy(k){
  const N=bdSetOk(k)?bdcNext(k):null; if(!N||!N.can){ toast(N&&N.why?N.why:'You cannot buy that yet','bad'); UI_SFX.error(); return false; }
  netSend({t:'bd',a:'buy',set:k}); BDC.wait=performance.now(); setTimeout(()=>{ BDC.wait=0; bdcBondsRender(); },1500); bdcBondsRender(); return true;
}
// the character played (bd {a:'play'}): the server's word comes back as gear.skills.bdx.main
function bdcPlayBtn(k,own,main){   // done only when picked with Play and their class's weapon is in hand: a character played by the old rule (their Power worn) or in another class's weapon keeps a live button
  if(!own) return ''; const B=GEAR&&GEAR.bd||{}, c=k==='wanderer'?null:chrClsOf(k), done=main&&B.play===k&&(!c||c===clsOf());
  return '<button class="chip'+(main?' on':'')+'" data-bdcplay="'+k+'" aria-pressed="'+main+'"'+(done?' disabled':'')+' title="Play this character: their set worn, their weapon in hand, their Bond in play">'+(done?'Playing':main?'Wear their set':'Play')+'</button>'; }
function bdcPlay(k){ netSend({t:'bd',a:'play',set:k}); UI_SFX.click(); return true; }
function bdcPick(k){ netSend({t:'bd',a:'pick',set:bdSetOk(k)?k:null}); UI_SFX.click(); return true; }
function bdcSel(k){ BDC.sel=BDC.sel===k?null:(k==='wanderer'||bdSetOk(k)?k:null); bdcBondsRender(); }
// the bd event (net/client.js): a step of yours was bought; the you message that follows has the new gear
function bdcOnBond(set,b){
  BDC.wait=0; UI_SFX.success(); BDC.ring=set; setTimeout(()=>{ if(BDC.ring===set){ BDC.ring=null; bdcBondsRender(); } },1400);
  if(!$('#bdc').hidden) bdcBondsRender();
}
function bdcBind(){
  if(BDC.bound) return; BDC.bound=true;
  $('#bdc').addEventListener('click',e=>{
    const t=e.target&&e.target.closest?e.target.closest('[data-bdcbuy],[data-bdcpick],[data-bdcsel],[data-bdcfilter],[data-bdcstall],[data-bdcstir],[data-bdcpath],[data-bdcplay]'):null; if(!t||t.disabled) return;
    if(t.dataset.bdcplay) bdcPlay(t.dataset.bdcplay); else if(t.dataset.bdcpath) bdcSetPath(t.dataset.bdcpath); else if(t.dataset.bdcbuy) bdcBuy(t.dataset.bdcbuy); else if(t.dataset.bdcpick) bdcPick(t.dataset.bdcpick); else if(t.dataset.bdcsel) bdcSel(t.dataset.bdcsel);
    else if(t.dataset.bdcfilter){ BDC.filter=t.dataset.bdcfilter; bdcBondsRender(); } else if(t.dataset.bdcstall) bdcOpenStall(); else if(t.dataset.bdcstir){ BDC.stirOpen=!(BDC.stirOpen===null?innerWidth>=720:BDC.stirOpen); bdcBondsRender(); }
  });
  $('#bdc').addEventListener('change',e=>{ const t=e.target; if(t&&t.id==='bdcPickSel') bdcPick(t.value||null); });
  setInterval(()=>{ if(!$('#bdc').hidden) bdcBondsRender(); },15000);   // the minutes left in the Stirrings box
}
