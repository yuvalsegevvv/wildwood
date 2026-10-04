//@ The Delve board: the panel a dungeon door opens (the dungeon, its lock, the two missions on offer this hour, the countdown, your party, the leader's Start) and the prompt to join a party's run (dgi)
/* Agent map (docs/DUNGEONS.md sections 8 and 9; the door is game/dungeon/entrances.js; the server's answer is server/dungeons/lobby.js dgBoardP; markup #dgBoard and #dgJoin in index.html;
   styles/25-dungeon-board.css; test tools/dungeon-board-client-smoke.js).
   Public:  dgBoardOpen(themeId)   the talk key at an open door (dgOpenDoor calls it): sends dg{a:'open'}, opens the panel at once (the dungeon's name, "reading the board") and fills it
                                   when the server's dgboard answer arrives (NETH.dgboard; it also refreshes an open board: after "the offer changed" or the hour turning).
            DG_BOARD               the board's state: {th, msg (the last dgboard), until (ms: when the offer changes), want (ms of the last request), ...}.
            dgJoinShow(e) / dgJoinHide()   the join prompt for a dgi event [name, pid, run, 0 starting | 1 under way, theme, mission, level, seconds, leader's name]: Join sends dg{a:'accept'},
                                   Stay behind dg{a:'decline'}. EVH.dgi is set here only when no other file has set it (a later file in the manifest may take it over and call dgJoinShow).
   Reads:   dgPartyState (the party code's roster, if it keeps one: {lead: pid, list|members|roster: [[pid, name, ...] or {pid|id, name}]}, read-only: see dgBoardRoster). Nothing is registered for pty here.
   Rules:   the panel only shows what the server decided (ok / gate / why / lead / offer / left): it checks nothing itself. It closes when you step away from a door (a 1 s timer, which also ticks the clock).
   Hooks:   'dgBoard' in PANELS (ui/panels.js), the #dgBoard / #dgJoin block in index.html, two lines in the manifest. */
const DG_BOARD={th:null,msg:null,want:0,until:0,sent:0,silent:false,polled:0};
// one sentence for each dungeon (docs/DUNGEON-THEMES.md section 3) and the accent of its card
const DG_BOARD_INFO={
  hollowroots:{color:'#8fd06a',text:'A hollow under the Ancient Grove where the roots of the Heartwood go down: warm dark, sap and fungus for light, and root spikes in the floor.'},
  jadesprings:{color:'#5fd4a8',text:'Warm caves behind Jade Falls where the hot springs rise: jade pools, drifting steam, bamboo roots through the ceiling.'},
  bonefrostbarrow:{color:'#8fd0f0',text:'The long grave of a vanished clan at Bonefrost Barrow: stone passages, cairns and bone-white rime, lightless but for the braziers.'},
  blackseam:{color:'#e8a050',text:'An abandoned coal mine under Highmark Pastures, worked until the foreman sold the seam to the powder: timbered drifts, ore carts, scalding slag vents and the lamps he left burning.'}};
// what each mission calls its objective in each dungeon (docs/DUNGEON-THEMES.md section 3, "What every mission calls its objectives")
const DG_BOARD_OBJ={
  hollowroots:{defense:'the Heartwood Knot',survival:'a sap-lamp',sabotage:'heartroots',siege:'seed shrines',hunt:'a runaway Shroomling',escort:'a hunter in a root cocoon'},
  jadesprings:{defense:'the jade basin',survival:'a stone lantern',sabotage:'spring gates',siege:'offering stones',hunt:'a Karasu Tengu in flight',escort:'the bath-house keeper'},
  bonefrostbarrow:{defense:'the warding rune stone',survival:'a grave lamp',sabotage:'burial cairns',siege:'rune pillars',hunt:'a Barrow Wight slipping between graves',escort:'a snared grave-warden'},
  blackseam:{defense:'the winch house',survival:'a miner\'s lamp',sabotage:'the timber props',siege:'the winding gear',hunt:'a Mountain Goblin bolting through the drifts',escort:'a trapped surveyor'}};
// one line for each of the seven missions (docs/DUNGEONS.md section 4); {o} is the dungeon's name for the objective
const DG_BOARD_TEXT={
  purge:'Clear the rooms of everything that lives there, then face the boss in the round hall.',
  defense:'Hold {o} against two rotations of waves, with a reward chest after each. Then the boss comes.',
  survival:'Keep {o} burning through ten minutes of dark: every kill feeds the flame. Then the boss comes.',
  sabotage:'Destroy the three {o}, each shielded until its warden pack is dead. The boss that guarded them comes.',
  siege:'Channel the three {o} one after another, a minute each, while waves hit the room. The last wakes the boss.',
  hunt:'Corner {o}: it bolts when you come close, and its death calls the boss.',
  escort:'Free {o} and lead them to the round hall, where the boss must not reach them.'};
const dgBoardDesc=(th,id)=>{ const o=DG_BOARD_OBJ[th]&&DG_BOARD_OBJ[th][id], t=DG_BOARD_TEXT[id]; return t?(o?t.replace('{o}',o):t.replace('{o}','the objective')):(DG_MISSIONS[id]?DG_MISSIONS[id].blurb:''); };

function dgBoardEl(tag,cls,text){ const e=document.createElement(tag); if(cls) e.className=cls; if(text!==undefined&&text!==null) e.textContent=text; return e; }   // (text before children: setting textContent drops them)
function dgBoardAdd(parent,...kids){ for(const k of kids) if(k) parent.appendChild(k); return parent; }

function dgBoardOpen(themeId){
  if(DG_BOARD.th!==themeId) DG_BOARD.msg=null;   // another door: do not show the last one's board while this one answers
  DG_BOARD.th=themeId; DG_BOARD.want=Date.now(); DG_BOARD.sent=1; DG_BOARD.silent=false;
  netSend({t:'dg',a:'open'});   // the server finds the door from your position; the answer is dgboard
  openPanel('dgBoard'); dgBoardRender();
}
NETH.dgboard=msg=>{
  if(!msg||typeof msg.th!=='string') return;
  const shown=!$('#dgBoard').hidden;
  if(!shown&&Date.now()-DG_BOARD.want>8000) return;   // nobody asked (or the board was closed since): a late answer must not pop a panel open
  DG_BOARD.th=msg.th; DG_BOARD.msg=msg; DG_BOARD.until=Date.now()+Math.max(0,+msg.left||0)*1000; DG_BOARD.want=0; DG_BOARD.silent=false;
  if(!shown) openPanel('dgBoard');
  dgBoardRender();
};

// the party as the party code keeps it (game/dungeon/party.js), if it does: [{pid, name}] or null
function dgBoardRoster(){
  const S=typeof dgPartyState==='undefined'?null:dgPartyState, L=S&&(S.list||S.members||S.roster);
  if(!Array.isArray(L)) return null;
  return L.map(q=>Array.isArray(q)?{pid:q[0],name:String(q[1])}:{pid:q.pid!==undefined?q.pid:q.id,name:String(q.name)});
}
function dgBoardPartyText(m){
  const R=dgBoardRoster(), others=R?R.filter(q=>q.pid!==NET.pid).map(q=>q.name):[];
  if(others.length) return m.lead?'You lead a party of '+(others.length+1)+': '+others.join(', ')+'.':'You are in a party with '+others.join(', ')+'. Only its leader can start a run.';
  if(!m.lead) return 'You are in a party: only its leader can start a run.';
  return 'You go in alone. Up to 4 can delve together: type /invite and a name in chat.';
}
const dgBoardClock=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');

function dgBoardRender(){
  if($('#dgBoard').hidden) return;
  const m=DG_BOARD.msg, th=m?m.th:DG_BOARD.th, T=DG_THEMES[th], E=DG_ENTRANCES[th], info=DG_BOARD_INFO[th]||{}, land=T&&DG_LANDS[T.land], body=$('#dgBody');
  body.innerHTML='';
  const hero=dgBoardEl('div','dgb-hero'); hero.style.setProperty('--dgc',info.color||'#cdd98f');
  dgBoardAdd(hero,dgBoardEl('h3','dgb-name',(m&&m.name)||(T&&T.name)||(E&&E.name)||'Dungeon'),
    dgBoardEl('div','dgb-door',((m&&m.door)||(E&&E.name)||'')+(land?' · '+land.name:'')));
  if(info.text) hero.appendChild(dgBoardEl('p','dgb-blurb',info.text));
  if(!m){
    body.appendChild(hero);
    body.appendChild(dgBoardEl('p','dgb-wait',DG_BOARD.silent?'The board does not answer. Step up to the door and try again.':'Reading the board…'));
    $('#dgClock').textContent=''; $('#dgParty').textContent=''; return;
  }
  const facts=dgBoardEl('div','dgb-facts');
  dgBoardAdd(facts,dgBoardEl('span','dgb-fact lv','Level '+m.L),dgBoardEl('span','dgb-fact',(land?land.name+' ':'')+'+'+m.tier),dgBoardEl('span','dgb-fact','Enter from level '+DG_ENTRY_LV));
  hero.appendChild(facts); body.appendChild(hero);
  body.appendChild(dgBoardEl('p','dgb-state '+(m.ok?'ok':'no'),m.ok?'The way is open for you.':(m.gate?'':'Sealed. ')+(m.why||'You cannot enter yet.')));
  const offer=m.offer||[], pool=m.pool||offer, cards=dgBoardEl('div','dgb-cards');
  for(const id of offer){
    const Mi=DG_MISSIONS[id], built=pool.includes(id), card=dgBoardEl('div','dgb-card'+(built?'':' soon')), ct=dgBoardEl('div','dgb-ct'), act=dgBoardEl('div','dgb-act');
    dgBoardAdd(ct,dgBoardEl('b',null,Mi?Mi.name:id),dgBoardEl('span',null,dgBoardDesc(th,id)));
    if(!built) act.appendChild(dgBoardEl('span',null,'Soon'));
    else if(!m.ok) act.appendChild(dgBoardEl('span',null,'Locked'));
    else if(m.lead){ const b=dgBoardEl('button','chip buy dgb-start','Start'); b.type='button'; b.dataset.mission=id; b.addEventListener('click',()=>dgBoardStart(id)); act.appendChild(b); }
    else act.appendChild(dgBoardEl('span',null,'Waiting for the leader to start'));
    dgBoardAdd(card,ct,act); cards.appendChild(card);
  }
  if(!offer.length) cards.appendChild(dgBoardEl('p','dgb-wait','No mission is on offer here yet.'));
  body.appendChild(cards);
  const all=Object.keys(DG_MISSIONS).length;
  if(pool.length<all) body.appendChild(dgBoardEl('p','dgb-more',pool.length+' of '+all+' mission types are built so far ('+pool.map(k=>DG_MISSIONS[k]?DG_MISSIONS[k].name:k).join(', ')+'); the others join the hourly offer as they are.'));
  $('#dgParty').textContent=dgBoardPartyText(m); dgBoardClockSet(Date.now());
}
const dgBoardLeft=now=>Math.max(0,Math.ceil((DG_BOARD.until-now)/1000));
function dgBoardClockSet(now){ $('#dgClock').textContent='The offer changes in '+dgBoardClock(dgBoardLeft(now)); }
// the leader's Start: the panel closes at once (the run's view takes over); a refusal that sends a fresh board ("the offer changed") opens it again
function dgBoardStart(id){
  const m=DG_BOARD.msg; if(!m||!m.ok||!m.lead||!(m.offer||[]).includes(id)) return;
  UI_SFX.click(); DG_BOARD.want=Date.now(); DG_BOARD.msg=null;
  closePanels();   // before the send: a refusal's fresh board may come back at once (solo: in the same call), and must find the panel closed to open it again
  netSend({t:'dg',a:'start',dungeon:m.th,type:id});
}
// once a second: the clock (and a fresh board when it runs out), a board nobody answered, and closing when you walk away from the door
function dgBoardTick(){
  const now=Date.now();
  if(!$('#dgBoard').hidden){
    if(!dgEntranceNear(P.x,P.z)) closePanels();
    else if(!DG_BOARD.msg){
      const age=now-DG_BOARD.want;
      if(DG_BOARD.want&&age>2000&&DG_BOARD.sent<2){ DG_BOARD.sent=2; netSend({t:'dg',a:'open'}); }   // the first message may have beaten the position update
      if(DG_BOARD.want&&age>5000&&!DG_BOARD.silent){ DG_BOARD.silent=true; dgBoardRender(); }
    } else {
      dgBoardClockSet(now);
      if(dgBoardLeft(now)===0&&now-DG_BOARD.polled>2500){ DG_BOARD.polled=now; DG_BOARD.want=now; netSend({t:'dg',a:'open'}); }   // the hour turned: ask for the new offer
    }
  }
  dgJoinTick(now);
}
setInterval(dgBoardTick,1000);

/* ---- the prompt to join a party's run (dgi) ---- */
const DG_JOIN={until:0,secs:15};
function dgJoinShow(e){
  if(e[1]!==NET.pid) return;
  const T=DG_THEMES[e[4]], Mi=DG_MISSIONS[e[5]], lead=e[8]?String(e[8]):'Your party';
  DG_JOIN.secs=Math.max(1,+e[7]||15); DG_JOIN.until=Date.now()+DG_JOIN.secs*1000;
  $('#dgJoinText').textContent=lead+(e[3]?' is already in ':' is going into ')+(T?T.name:e[4])+': '+(Mi?Mi.name:e[5])+', level '+e[6]+'. Go with them?';
  $('#dgJoin').hidden=false; UI_SFX.notify(); dgJoinTick(Date.now());
}
function dgJoinHide(){ DG_JOIN.until=0; $('#dgJoin').hidden=true; }
function dgJoinTick(now){
  if($('#dgJoin').hidden) return;
  const left=Math.max(0,Math.ceil((DG_JOIN.until-now)/1000));
  if(left===0){ dgJoinHide(); return; }   // the server went on without you when the time ran out
  $('#dgJoinLeft').textContent=left+'s'; $('#dgJoinBar').style.width=Math.round(100*left/DG_JOIN.secs)+'%';
}
$('#dgJoinYes').addEventListener('click',()=>{ netSend({t:'dg',a:'accept'}); dgJoinHide(); UI_SFX.click(); });
$('#dgJoinNo').addEventListener('click',()=>{ netSend({t:'dg',a:'decline'}); dgJoinHide(); UI_SFX.click(); });
if(!EVH.dgi) EVH.dgi=dgJoinShow;
