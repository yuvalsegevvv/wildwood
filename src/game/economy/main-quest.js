//@ The main quest on the client: what quest villagers say (mqTalk), the marks over them, the main quest at the top of the quest log, its marker on the maps (people, places, resource nodes), where Odran is, heartleaf to pick
/* The server owns the progress (gear.mq, server/main-quest.js); this file only reads GEAR.mq. The talk lines come from the same
   shared mqTalk the server applies, so what a villager says always matches what happens. */
const mqG=()=>(GEAR&&GEAR.mq)||null;
const mqCur=()=>{ const M=mqG(); return M?MQ[M.s]||null:null; };
// Odran's cart stands by the village gate from W8 (when he arrives) until V8 (he moves to Hanami's gate), by Rimehold's from F7 until G4, and by Highmark's from G4
function odranHere(vil){ const M=mqG(); if(!M) return false; return vil===1?M.s>=MQ_BY_ID.W8.i&&M.s<MQ_BY_ID.V8.i:vil===2?M.s>=MQ_BY_ID.V8.i&&M.s<MQ_BY_ID.F7.i:vil===3?M.s>=MQ_BY_ID.F7.i&&M.s<MQ_BY_ID.G4.i:vil===4?M.s>=MQ_BY_ID.G4.i:false; }
// what a quest villager has to say about the main quest right now (null: nothing, their usual lines)
/* The script writes a scene as a screenplay ("Wren: ...", "(She nods.) Tansy: ..."). One bubble holds one speaker: a line is cut at every "Name: " into
   its own line, and the bubble then wears that name (sayLine, village/talking.js). Narration in brackets stays a line of its own. */
const MQ_SPEAKER_NAMES='Tansy|Wren|Dunstan|Torgeir|Pip|Morrow|Linnea|Pell|Aldric|Maren|Greta|Bram|Oskar|Hollen|Ambrose|Odran|Tomas|Daisuke|Kaede|The Rootwarden|You';
const MQ_SPEAKER_CUT=new RegExp('\\s+(?=(?:'+MQ_SPEAKER_NAMES+'): )'), MQ_SPEAKER_DIR=new RegExp('^\\((?:'+MQ_SPEAKER_NAMES+'),[^)]*\\)\\s*([^(].*)$'), MQ_SPEAKER_OF=new RegExp('^('+MQ_SPEAKER_NAMES+'): ([\\s\\S]*)$');
function mqSplitLines(list){ const out=[]; let cine=''; for(const line of list||[]){ let s=String(line); if(s.startsWith('@cine ')){ cine=s+'\n'; continue; }
    if(s.startsWith('@pick ')){ out.push(cine+s); cine=''; continue; }   // (a choice stays whole: story-choice.js)   // (a key scene's marker rides in front of the next line: story-voice.js)
    const d=s.match(/^\((\w+),/); if(d&&MQ_SPEAKER_DIR.test(s)) s=d[1]+': '+s.match(MQ_SPEAKER_DIR)[1]; for(const part of s.split(MQ_SPEAKER_CUT)) if(part){ out.push(cine+part); cine=''; } } return out; }
// a line's speaker and what is said, and what the speaking voice reads (stage directions in brackets are seen, not said)
function mqLineOf(line){ if(line.startsWith('@cine ')){ const i=line.indexOf('\n'); try{ svCineStart(line.slice(6,i<0?undefined:i)); }catch(_){} line=i<0?'':line.slice(i+1); } const m=MQ_SPEAKER_OF.exec(line); return m?{who:m[1],text:mqSubst(m[2])}:{who:null,text:mqSubst(line)}; }
/* how people address you: {lad} {boy} {brother} {sir} follow the gender you picked in the editor; {name} is your in-game name (a guest has their default name; it is left out, with its comma, only when there is none) ("Well done, {name}." -> "Well done.") */
const MQ_GENDERED={lad:['lad','lass'],boy:['boy','girl'],brother:['brother','sister'],sir:['sir','miss']};
function mqSubst(t){
  t=String(t); if(t.indexOf('{')<0) return t;
  const g=LOOK&&LOOK.sex==='female'?1:0, name=(typeof NET!=='undefined'&&NET&&NET.name)||'';
  t=t.replace(/\{(lad|boy|brother|sir)\}/g,(m,k)=>MQ_GENDERED[k][g]);
  if(name) return t.replace(/\{name\}/g,name);
  return t.replace(/^\{name\},? ?(\S)/,(m,c)=>c.toUpperCase()).replace(/,? \{name\}/g,'').replace(/\{name\}/g,'');
}
const mqSpoken=text=>text[0]==='('&&text.indexOf(')')===text.length-1?'':text.replace(/\([^)]*\)\s*/g,'').trim();
function mqLinesFor(n){ const M=mqG(); if(!M||!MQ_NPC_VIL[n.def.id]) return null; const T=mqTalk(M,n.def.id,PL.level,mqNight(dayClock)); return T.lines.length?Object.assign({},T,{lines:mqSplitLines(T.lines)}):null; }
// the mark over a villager: ! a step to take (or a part to do with them), ? a step to hand in
function mqMark(id){
  const M=mqG(), s=mqCur(); if(!s) return '';
  if(M.st===0) return s.from===id&&PL.level>=mqGate(s)?'!':'';
  if(M.st===2) return s.to===id?'?':'';
  return s.parts.some((pt,i)=>pt.talk===id&&mqOpen(s,M.n,i))?'!':'';
}
function mqPicking(){ const M=mqG(), s=mqCur(); return !!(s&&M.st===1&&s.parts.some((pt,i)=>pt.pick&&mqOpen(s,M.n,i))); }
function nearHerb(){ if(!mqPicking()) return -1; const M=mqG(); for(let i=0;i<HERBS.length;i++) if(!((M.h>>i)&1)&&Math.hypot(P.x-HERBS[i][0],P.z-HERBS[i][1])<HERB_R) return i; return -1; }
// where a villager stands (their live position if they are drawn, else their anchor)
function npcSpot(id){ const n=npcById(id); if(n) return {x:n.x,z:n.z,name:n.def.name}; return null; }
const MQ_ACT_AT={buy:'ilse',board:'maren',merge:'greta'};   // (the tree, 'upskill', is bought anywhere: no place to point at)
const MQ_GREY_C={};
// the nearest node of a gather part that your gear can work and is not taken (else null)
function mqGatherTarget(pt){ let best=null,bd=1e9; for(const n of NODES) if((n.kind===pt.gather||NODE_KINDS[n.kind].prof===pt.gather)&&!nodeBlock(GEAR,n)){ const d=Math.hypot(n.x-P.x,n.z-P.z); if(d<bd&&!nodeTaken(n.i)){ bd=d; best=n; } } return best?{x:best.x,z:best.z,name:NODE_KINDS[best.kind].name}:null; }
function mqPartTarget(s,pt){
  if(pt.talk) return npcSpot(pt.talk);
  if(pt.visit||pt.spawn){ const P=MQ_PLACES[pt.visit||pt.spawn]; return {x:P.x,z:P.z,name:P.name}; }   // the prologue's places (shared/main-quest.js)
  if(pt.gather&&pt.collect){ const T=mqGatherTarget(pt); if(T) return T; }   // (dig it or take it from the monsters: the veins first, else the monsters' zone)
  if(pt.kill||pt.collect){ const d=MON_DEFS.find(m=>m.id===(pt.kill||pt.from[0])), zn=d&&defZone(d); if(!zn) return null; const [x,z]=zonePoint(zn,0,0.5); return {x,z,name:zn.name}; }
  if(pt.grey){ const g=MQ_GREY_C[pt.zone]||(MQ_GREY_C[pt.zone]=mqGreySpot(pt.zone)); return {x:g[0],z:g[1],name:ZONES.find(z=>z.key===pt.zone).name}; }
  if(pt.pick){ const M=mqG(); let best=null,bd=1e9; HERBS.forEach(([x,z],i)=>{ const d=Math.hypot(x-P.x,z-P.z); if(!((M.h>>i)&1)&&d<bd){ bd=d; best={x,z,name:'Heartleaf'}; } }); return best; }
  if(pt.read){ const L=LORE_BY_ID[pt.read]; return {x:L.x,z:L.z,name:L.name}; }
  if(pt.boss){ const bd=BOSS_DEFS.find(b=>b.def.id===pt.boss), A=ARENAS.find(a=>a.key===bd.arena); return {x:A.x,z:A.z,name:A.name}; }
  if(pt.gather) return mqGatherTarget(pt);
  if(pt.act==='sell'){ const V=VILS[MQ_NPC_VIL[s.from]-1]; return {x:V.cart.x,z:V.cart.z,name:'Odran\'s cart'}; }
  if(pt.act==='warp'){ const V=vilAt(P.x,P.z); return V!==VIL?{x:V.tele.x,z:V.tele.z,name:'the teleport circle'}:null; }
  if(pt.act==='rimehold') return inHoar(P.x,P.z)?{x:VIL3.anchors.gate.x,z:VIL3.anchors.gate.z,name:'Rimehold'}:{x:PASS.x,z:PASS.ice+4,name:'Frostgate Pass'};
  if(pt.act==='highmark') return inGrey(P.x,P.z)?{x:VIL4.anchors.gate.x,z:VIL4.anchors.gate.z,name:'Highmark'}:{x:GLEN.x1,z:GLEN.z,name:'the glacier valley'};
  if(pt.act==='hanami') return inVale(P.x,P.z)?{x:VIL2.anchors.gate.x,z:VIL2.anchors.gate.z,name:'Hanami'}:{x:TUN.x0,z:TUN.z,name:'the bridge'};
  { const v=(MQ_NPC_VIL[s.from]||1)-1;   // the professions' places are in the giver's village: its lodge keeper, healer, weaponsmith or armourer
    if(pt.act==='learn'||pt.act==='tool') return npcSpot(['tamsin','isamu','gudrun'][v]);
    if(pt.act==='brew') return npcSpot(['linnea','hinata','ylva'][v]);
    if(pt.act==='craft') return npcSpot((pt.kind==='armor'?['ilse','haruka','dagny']:['tomas','kenji','bjorn'])[v]); }
  return MQ_ACT_AT[pt.act]?npcSpot(MQ_ACT_AT[pt.act]):null;
}
// the main quest's marker for the maps: the giver, the first open part that has a place, or whom to hand in to
function mqTarget(){
  const M=mqG(), s=mqCur(); if(!s) return null;
  if(M.st===0) return s.from&&PL.level>=mqGate(s)?npcSpot(s.from):null;
  if(M.st===2) return npcSpot(s.to);
  for(let i=0;i<s.parts.length;i++) if(mqOpen(s,M.n,i)){ const T=mqPartTarget(s,s.parts[i]); if(T) return T; }
  return null;
}
// the main quest's line at the top of the quest log (text only: every string here comes from shared data, never from a player)
function mqLogRow(){
  const M=mqG(); if(!M) return '';
  const s=mqCur(); if(!s) return `<div class="ql mq"><b>The main quest</b><span>${MQ_END}</span></div>`;
  let what;
  if(M.st===0) what=PL.level<mqGate(s)?'From level '+mqGate(s)+': '+MQ_NAMES[s.from]+'. Until then, hunt and take notices from the quest board':'Talk to '+MQ_NAMES[s.from];
  else if(mqAllDone(s,M.n)) what=mqObjective(s,M.n);
  else what=s.parts.map((pt,i)=>{ if(!mqOpen(s,M.n,i)&&!(M.n[i]>=mqNeed(pt))) return ''; const need=mqNeed(pt), got=Math.min(need,M.n[i]||0);   // every part that runs at once, each with its count (Heartleaf: herbs and slimes together)
    return got>=need?'<i class="ql-done">&#10003; '+pt.text+'</i>':pt.text+(need>1?' ('+got+' / '+need+')':''); }).filter(Boolean).join('<br>');
  const T=mqTarget(), where=T&&!(M.st===0&&PL.level<mqGate(s))?(Math.hypot(T.x-P.x,T.z-P.z)<12?'':' &middot; '+Math.round(Math.hypot(T.x-P.x,T.z-P.z))+' m '+dirWord(T.x-P.x,T.z-P.z)):'';
  // the first steps keep their how-to under the objective while they run (the toast that brought it fades, and a new player reads it when they need it)
  const tip=M.st===1&&s.tip&&M.s<=MQ_BY_ID.W18.i?`<small class="ql-tip">${s.tip}</small>`:'';
  const hard=M.st===1&&s.hard&&PL.level<s.hard?`<small class="ql-tip">Wise at level ${s.hard}. Too hard right now? Explore, hunt and take board notices to grow stronger first.</small>`:'';   // (a step meant to be met by a hiker who grew on their own)
  return `<div class="ql mq${M.st===2?' ok':''}"><b>${s.title}</b><span>${what}${where}</span>${tip}${hard}</div>`;
}
/* The main quest tab of the quest panel (economy/quests.js): the step, what its giver asked, every part with a picture of the monster it names (ui/mon-pics.js),
   a bar and where to go, then the reward and the how-to. Text only from shared data, never from a player. */
const MQ_ACTS=[['P','Prologue: The Sheaf-Crown'],['W','Act I: The Grey Rain'],['V','Act II: The Blossom and the Blight'],['F','Act III: The Frost Flower'],['G','Act IV: The Black Stone']];
const mqPartMon=pt=>pt.kill||pt.boss||pt.grey||(pt.collect&&pt.from&&pt.from[0])||'';
function mqWhere(T){ if(!T) return ''; const d=Math.hypot(T.x-P.x,T.z-P.z); return d<12?'You are here':T.name+', '+Math.round(d)+' m '+dirWord(T.x-P.x,T.z-P.z); }
function mqJournalHtml(){
  const M=mqG(); if(!M) return '';
  const s=mqCur(); if(!s) return `<div class="jq-step"><p class="jq-say">${MQ_END}</p></div>`;
  const act=MQ_ACTS.find(a=>s.id[0]===a[0]), inAct=MQ.filter(q=>q.id[0]===s.id[0]), k=inAct.indexOf(s), r=mqReward(s);
  let h=`<div class="jq-act"><span>${act?act[1]:''}</span><span>Step ${k+1} of ${inAct.length}</span></div><div class="jq-actbar"><i style="width:${Math.max(4,Math.round(k/inAct.length*100))}%"></i></div>`;
  h+=`<div class="jq-step"><h3>${s.title}</h3>`;
  if(M.st===0){
    h+=PL.level<mqGate(s)?`<p class="jq-say">${MQ_NAMES[s.from]} will have the next step for you at level ${mqGate(s)}. Until then, hunt and take notices from the quest board.</p>`
      :`<div class="jq-obj"><span class="jq-dot"></span><div><b>Talk to ${MQ_NAMES[s.from]}</b><span class="jq-n">${mqWhere(mqTarget())}</span></div></div>`;
  } else {
    if(s.offer&&s.offer.length) h+=`<p class="jq-say">\u201C${s.offer[s.offer.length-1]}\u201D <span>${MQ_NAMES[s.from]||''}</span></p>`;
    s.parts.forEach((pt,i)=>{
      const need=mqNeed(pt), got=Math.min(need,M.n[i]||0), done=got>=need, open=mqOpen(s,M.n,i), mon=mqPartMon(pt);
      const where=open?mqWhere(mqPartTarget(s,pt)):'', cnt=need>1?got+' / '+need:'';
      h+=`<div class="jq-obj${done?' done':''}${!done&&!open?' later':''}">${mon?mpPic(mon,true):`<span class="jq-dot">${done?'&#10003;':''}</span>`}<div><b>${pt.text}</b>`
        +(need>1?`<div class="jq-prog"><div class="jq-bar"><i style="width:${Math.max(got?6:0,Math.round(got/need*100))}%"></i></div><span class="jq-cnt">${cnt}</span></div>`:'')
        +`<span class="jq-n">${done?'Done':!open?'After the step before it':where}</span></div></div>`;
    });
    if(M.st===2) h+=`<div class="jq-obj ready"><span class="jq-dot">!</span><div><b>Return to ${MQ_NAMES[s.to]}</b><span class="jq-n">${mqWhere(npcSpot(s.to))}</span></div></div>`;
  }
  h+=`<div class="jq-rw">Reward: <b>${numC(r.xp)} XP</b> and <b>${r.coins} coins</b></div>`;
  if(s.tip) h+=`<p class="jq-tip">${s.tip}</p>`;
  return h+'</div>';
}
// Wren sits up when a step wants them awake (handing in to Wren, and the goodbye before the tunnel); otherwise they sleep
function wrenAwake(){ const M=mqG(), s=mqCur(); if(!s) return !!M; return (M.st===2&&s.to==='wren')||(s.id==='W18'&&M.st===1&&mqOpen(s,M.n,0)); }
