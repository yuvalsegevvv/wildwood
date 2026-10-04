//@ Headless test of the Delve board panel and the join prompt: what dgboard renders (open, sealed, leader, member, offer, soon), the clock, Start, Esc, the door's talk key, dgi
// Usage: python3 build.py && node tools/dungeon-board-client-smoke.js   (runs dist/wildwood.html in Node with a stub DOM, solo mode, ~25 s)
// What it covers: game/dungeon/board.js (dgBoardOpen, NETH.dgboard, the panel, the clock, Start, the join prompt), the PANELS entry and the #dgBoard / #dgJoin markup. Fake dgboard messages
// (netHandle) for every case, the real solo server for what it really answers at the Hollowed Elder (sealed at +0, open at +1, a refused Start) and at the Falls Door.
// Server side of the same messages: tools/dungeon-runs-smoke.js.
const errs=[]; const realErr=console.error; console.error=(...a)=>{ errs.push(a.map(String).join(' ')); };
const {bootClient}=require('./headless');
const c=bootClient({expose:['NET','startSolo','beginPlay','canStart:()=>canStart','Stream','P','PL','GEAR','VIL','DG_ENTRANCES','DG_THEMES','DG_MISSIONS','DG_BOARD','DG_JOIN','dgBoardOpen','dgBoardTick','dgBoardRender',
  'dgBoardSwap:f=>{ const o=dgBoardOpen; dgBoardOpen=f; return o; }','dgOpenDoor','netHandle','applyEvent','EVH','NETH','PANELS','uiOpen','closePanels','updateTalkUI','dgJoinShow','dgJoinTick','dgOffer','dgEntranceNear']});
const wait=ms=>new Promise(r=>setTimeout(r,ms)); let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const tx=e=>[e.textContent||'',...(e._kids||[]).map(tx)].join(' ').replace(/\s+/g,' ').trim();   // all the text under an element (the board is built with createElement + textContent)
const secs=t=>{ const m=/(\d+):(\d\d)/.exec(t); return m?+m[1]*60+ +m[2]:-1; };
const walk=(e,f)=>{ f(e); (e._kids||[]).forEach(k=>walk(k,f)); };
const find=(e,cls)=>{ const out=[]; walk(e,k=>{ if(typeof k.className==='string'&&k.className.split(' ').includes(cls)) out.push(k); }); return out; };
(async()=>{
  let G=c.G(); for(let i=0;i<400;i++){ await wait(100); G=c.G(); if(G.canStart()) break; }
  G.NET.onReady=()=>G.beginPlay(); G.startSolo(); await wait(1500); G=c.G();
  const sent=[]; let swallow=false; const send0=G.NET.send; G.NET.send=m=>{ sent.push(JSON.parse(JSON.stringify(m))); if(!swallow) send0(m); };
  const mine=()=>sent.filter(m=>m.t==='dg'), last=()=>mine().slice(-1)[0], board=()=>c.el('#dgBoard'), body=()=>c.el('#dgBody'), hidden=()=>board().hidden;
  const MSG=(o)=>Object.assign({t:'dgboard',th:'hollowroots',name:'The Hollow Roots',door:'The Hollowed Elder',offer:['purge','defense'],pool:['purge','defense'],left:125,L:40,tier:2,gate:1,ok:1,why:'',lead:1},o||{});
  const deliver=m=>{ c.G().netHandle(m); };
  const place=(x,z)=>{ const g=c.G(); g.P.x=x; g.P.z=z; };
  const near=()=>{ const E=G.DG_ENTRANCES.hollowroots; place(E.x+3,E.z); };   // the client's own position is what the 1 s timer reads
  ok('the page boots into a solo world with the board wired (PANELS entry, markup, the dgboard handler, the dgi handler)',G.NET.ready&&G.PANELS.includes('dgBoard')&&!!board()&&typeof G.NETH.dgboard==='function'&&typeof G.EVH.dgi==='function'&&typeof G.dgBoardOpen==='function',
    'dgi handler: '+(G.EVH.dgi===G.dgJoinShow?'the board\'s':'someone else\'s'));
  // ---- opening: the request and the waiting state ----
  swallow=true; near(); sent.length=0; G.dgBoardOpen('hollowroots');
  ok('dgBoardOpen sends dg{a:"open"} and opens the panel at once: the dungeon\'s name, "Reading the board", no Start',mine().length===1&&last().a==='open'&&!hidden()&&G.uiOpen()&&/Hollow Roots/.test(tx(body()))&&/Reading the board/.test(tx(body()))&&!find(body(),'dgb-start').length,tx(body()));
  ok('an answer that nobody asked for does not open a panel (a closed board stays closed)',(()=>{ G.closePanels(); const w=G.DG_BOARD.want=0; deliver(MSG()); return hidden()&&!G.uiOpen(); })());
  // ---- an open door, the leader ----
  swallow=true; sent.length=0; G.dgBoardOpen('hollowroots'); deliver(MSG());
  { const t=tx(body()), cards=find(body(),'dgb-card'), btns=find(body(),'dgb-start');
    ok('the board for an open door: name, door and land, level at your tier, entry level 25 (the same at every difficulty), "the way is open"',/The Hollow Roots/.test(t)&&/The Hollowed Elder · Wildwood/.test(t)&&/Level 40/.test(t)&&/Wildwood \+2/.test(t)&&/Enter from level 25/.test(t)&&/The way is open for you/.test(t)&&find(body(),'ok').length===1,t.slice(0,260));
    ok('it tells the dungeon in a sentence and each mission in a line (with the dungeon\'s own name for the objective)',/Heartwood go down/.test(t)&&cards.length===2&&/Purge/.test(tx(cards[0]))&&/round hall/.test(tx(cards[0]))&&/Defense/.test(tx(cards[1]))&&/Hold the Heartwood Knot/.test(tx(cards[1])),tx(cards[1]));
    ok('the leader gets a Start button on each mission on offer, naming its id',btns.length===2&&btns[0].dataset.mission==='purge'&&btns[1].dataset.mission==='defense');
    ok('the footer: the countdown to the next offer and the party line (alone: how to invite)',/The offer changes in 2:0[45]/.test(tx(c.el('#dgClock')))&&/You go in alone/.test(tx(c.el('#dgParty')))&&/\/invite/.test(tx(c.el('#dgParty'))),tx(c.el('#dgClock'))+' | '+tx(c.el('#dgParty')));
    sent.length=0; btns[1].click();
    ok('Start sends dg{a:"start",dungeon,type} for that mission and closes the panel',mine().length===1&&JSON.stringify(last())===JSON.stringify({t:'dg',a:'start',dungeon:'hollowroots',type:'defense'})&&hidden()&&!G.uiOpen(),JSON.stringify(last())); }
  // ---- the other texts ----
  swallow=true; G.dgBoardOpen('hollowroots'); deliver(MSG({gate:0,ok:0,why:'Wildwood opens its dungeon at +1 difficulty: once Carapax, the Tide King, has fallen, set Wildwood to +1 on the map in a village.',tier:0,L:30,lead:1}));
  { const t=tx(body());
    ok('a sealed door (Wildwood at +0): "Sealed" and what unlocks it, level 30, no Start button on any mission, they say Locked',/Sealed\. Wildwood opens its dungeon at \+1 difficulty/.test(t)&&find(body(),'no').length===1&&find(body(),'ok').length===0&&/Level 30/.test(t)&&/Wildwood \+0/.test(t)&&!find(body(),'dgb-start').length&&(t.match(/Locked/g)||[]).length===2,t.slice(0,300)); }
  deliver(MSG({gate:1,ok:0,why:'Reach level 35 first.'}));
  ok('an open door with too low a level: the reason, not "Sealed", and still no Start',/Reach level 35 first/.test(tx(body()))&&!/Sealed/.test(tx(body()))&&!find(body(),'dgb-start').length);
  deliver(MSG({lead:0}));
  ok('a party member: no Start, "Waiting for the leader to start" on each mission, and the party line says only the leader starts',!find(body(),'dgb-start').length&&(tx(body()).match(/Waiting for the leader to start/g)||[]).length===2&&/only its leader can start a run/.test(tx(c.el('#dgParty'))),tx(c.el('#dgParty')));
  G.applyEvent(['pty',G.NET.pid,99,[[99,'Ana',20,20,30,0,0],[G.NET.pid,'Me',20,20,30,0,0],[98,'Bo',20,20,30,0,0]]]); deliver(MSG({lead:0}));
  ok('with the party code\'s roster (read, never registered): a member sees who is in it; the leader sees "You lead a party of 3"',/with Ana, Bo/.test(tx(c.el('#dgParty')))&&(deliver(MSG({lead:1})),/You lead a party of 3: Ana, Bo/.test(tx(c.el('#dgParty')))),tx(c.el('#dgParty')));
  G.applyEvent(['pty',G.NET.pid,0,[]]);
  deliver(MSG({offer:['purge','siege'],pool:['purge'],left:60}));
  { const cards=find(body(),'dgb-card'), btns=find(body(),'dgb-start'); ok('a mission that is not built shows "Soon" with no button (and the board says how many types are built)',cards.length===2&&btns.length===1&&btns[0].dataset.mission==='purge'&&/Soon/.test(tx(cards[1]))&&/1 of 7 mission types are built/.test(tx(body())),tx(body()).slice(-200)); }
  deliver(MSG({offer:['purge'],pool:['purge']}));
  ok('one mission on offer (while only one is built): one card, one Start',find(body(),'dgb-card').length===1&&find(body(),'dgb-start').length===1);
  deliver(MSG({th:'newdungeon',name:'A <b>New</b> Place',door:'Some Door',offer:['purge','nosuchmission'],pool:['purge'],why:'x<img src=1>'}));
  ok('odd data does not break it: a dungeon and a mission the client does not know are drawn from what the message says, and text goes through textContent (no markup is made)',/A <b>New<\/b> Place/.test(tx(body()))&&find(body(),'dgb-card').length===2&&!body()._html&&!find(body(),'dgb-blurb').length);
  // ---- the clock ----
  deliver(MSG({left:125})); { const t0=tx(c.el('#dgClock')); G.DG_BOARD.until-=5000; G.dgBoardTick(); const t1=tx(c.el('#dgClock')); ok('the clock counts down: 5 s taken off reads 2:00 (m:ss)',/2:0[45]/.test(t0)&&t1==='The offer changes in 2:00',t0+' -> '+t1); }
  { const t0=tx(c.el('#dgClock')); await wait(2300); const t1=tx(c.el('#dgClock')); ok('and it ticks by itself once a second (a real wait of 2.3 s)',t0!==t1&&secs(t1)<secs(t0),t0+' -> '+t1); }
  { sent.length=0; G.DG_BOARD.until=Date.now()-50; G.dgBoardTick(); const a=mine().length, aOpen=a===1&&last().a==='open'; G.dgBoardTick(); const b=mine().length; ok('at 0 the board asks again for the new offer, once (not every tick)',aOpen&&b===1,a+' then '+b);
    deliver(MSG({offer:['hunt','escort'],pool:['hunt','escort'],left:3600})); ok('and the answer refreshes the open board in place (new missions, clock 60:00)',!hidden()&&/Hunt/.test(tx(body()))&&/Escort/.test(tx(body()))&&/60:00/.test(tx(c.el('#dgClock')))); }
  // a transport that answers inside the send call (the solo server may): the refusal's board must still open
  { const send1=G.NET.send; swallow=true; G.dgBoardOpen('hollowroots'); deliver(MSG()); G.NET.send=m=>{ sent.push(JSON.parse(JSON.stringify(m))); if(m.a==='start') deliver(MSG({offer:['hunt','escort'],pool:['hunt','escort']})); };
    find(body(),'dgb-start')[0].click(); G.NET.send=send1;
    ok('a board that comes back inside the Start call itself (a refusal, "the offer changed") is open afterwards, with the new offer',!hidden()&&/Hunt/.test(tx(body()))); G.closePanels(); }
  // ---- closing ----
  ok('Esc closes it',(()=>{ c.fireWin('keydown',{code:'Escape'}); return hidden()&&!G.uiOpen(); })());
  swallow=true; G.dgBoardOpen('hollowroots'); deliver(MSG()); G.dgBoardTick();
  ok('it stays open while you stand at the door',!hidden());
  place(G.DG_ENTRANCES.hollowroots.x+40,G.DG_ENTRANCES.hollowroots.z); G.dgBoardTick();
  ok('and closes when you walk away from the door (the server would no longer answer or start)',hidden());
  { const E=G.DG_ENTRANCES.jadesprings; place(E.x+3,E.z); swallow=true; G.dgBoardOpen('jadesprings'); sent.length=0;
    G.DG_BOARD.want=Date.now()-2500; G.dgBoardTick(); const resent=mine().length===1&&last().a==='open'; G.dgBoardTick(); const once=mine().length===1;
    G.DG_BOARD.want=Date.now()-5500; G.dgBoardTick();
    ok('a board nobody answers: it asks once more after 2 s (once), and after 5 s says the board does not answer',resent&&once&&/does not answer/.test(tx(body())),tx(body()).slice(-120)); G.closePanels(); }
  // ---- the join prompt ----
  { const e=['dgi',G.NET.pid,7,0,'hollowroots','purge',40,15,'Ana'];
    ok('dgi: a prompt names the leader, the dungeon, the mission and the level, with the seconds left',(G.EVH.dgi===G.dgJoinShow?(G.applyEvent(e),true):(G.dgJoinShow(e),true))&&!c.el('#dgJoin').hidden&&/Ana is going into The Hollow Roots: Purge, level 40/.test(tx(c.el('#dgJoinText')))&&tx(c.el('#dgJoinLeft'))==='15s'&&c.el('#dgJoinBar').style.width==='100%',tx(c.el('#dgJoinText')));
    sent.length=0; c.el('#dgJoinYes').click(); ok('Join sends dg{a:"accept"} and the prompt goes away',mine().length===1&&last().a==='accept'&&c.el('#dgJoin').hidden);
    G.dgJoinShow(['dgi',G.NET.pid,8,1,'jadesprings','escort',30,15,'']); ok('a run already under way is worded so, a missing leader name reads "Your party"',/Your party is already in Jade Spring Grottoes: Escort, level 30/.test(tx(c.el('#dgJoinText'))),tx(c.el('#dgJoinText')));
    sent.length=0; c.el('#dgJoinNo').click(); ok('Stay behind sends dg{a:"decline"} and closes it',mine().length===1&&last().a==='decline'&&c.el('#dgJoin').hidden);
    G.dgJoinShow(e); G.DG_JOIN.until=Date.now()+7400; G.dgJoinTick(Date.now()); const mid=tx(c.el('#dgJoinLeft'))+' '+c.el('#dgJoinBar').style.width; G.DG_JOIN.until=Date.now()-5; G.dgJoinTick(Date.now());
    ok('the prompt counts down (8s, 53% of the bar) and hides itself when the time is up',mid==='8s 53%'&&c.el('#dgJoin').hidden,mid);
    G.dgJoinShow(['dgi',123456,7,0,'hollowroots','purge',40,15,'Ana']); ok('a prompt meant for another player is ignored',c.el('#dgJoin').hidden); }
  // ---- the real server ----
  swallow=false;
  G.NET.send({t:'dev',cmd:'level',v:30}); G.NET.send({t:'dev',cmd:'zt',v:1}); G.NET.send({t:'dev',cmd:'vale',v:2}); await wait(300);
  const tp=async(x,z)=>{ const x0=c.G().P.x; G.NET.send({t:'dev',cmd:'tunnel',v:Math.round(x)+','+Math.round(z)}); for(let i=0;i<60;i++){ await wait(50); if(Math.hypot(c.G().P.x-x,c.G().P.z-z)<2) break; } await wait(250); };
  const E1=G.DG_ENTRANCES.hollowroots, E2=G.DG_ENTRANCES.jadesprings;
  G.NET.send({t:'zt',land:'home',n:0}); await wait(300); G=c.G();
  await tp(E1.x+3,E1.z); G=c.G(); sent.length=0; G.closePanels(); G.dgBoardOpen('hollowroots'); await wait(500); G=c.G();
  { const m=G.DG_BOARD.msg, t=tx(body()); ok('the real server at the Elder with Wildwood at +0: gate 0, ok 0, its own reason; the panel shows it sealed with no Start',!!m&&m.th==='hollowroots'&&m.gate===0&&m.ok===0&&m.lead===1&&/Sealed\. Wildwood opens its dungeon at \+1 difficulty/.test(t)&&!find(body(),'dgb-start').length&&!hidden(),m?JSON.stringify(m).slice(0,200):'no answer'); }
  G.closePanels(); await tp(G.VIL.x,G.VIL.z); G.NET.send({t:'zt',land:'home',n:1}); await wait(300); await tp(E1.x+3,E1.z); G=c.G();
  sent.length=0; c.fireWin('keydown',{code:'Escape'}); G.updateTalkUI();
  { const toasts0=c.el('#toasts')._kids.length; c.fireWin('keydown',{code:'KeyE'}); await wait(500); G=c.G(); const m=G.DG_BOARD.msg, offer=m&&m.offer, t=tx(body());
    ok('the talk key at the open Elder (Wildwood at +1, level 30) sends dg open and shows the real board, not the "not ready" toast',mine().some(q=>q.a==='open')&&!hidden()&&!!m&&m.ok===1&&m.gate===1&&m.lead===1&&m.L===30&&m.tier===1&&/Level 30/.test(t)&&/Wildwood \+1/.test(t)&&!c.el('#toasts')._kids.slice(toasts0).some(k=>/not ready/.test(k.textContent)),m?JSON.stringify(m).slice(0,220):'no answer');
    const want=G.dgOffer('hollowroots',Date.now(),m.pool), names=want.map(k=>G.DG_MISSIONS[k].name);
    ok('the offer on the board is the offer the shared rule gives for this hour and the missions built (dgOffer), each with its name, and a Start for each',JSON.stringify(m.offer)===JSON.stringify(want)&&names.every(n=>t.includes(n))&&find(body(),'dgb-start').length===want.length&&m.left>0&&m.left<=3600,JSON.stringify(m.offer)+' vs '+JSON.stringify(want)+' left '+m.left);
    const real=JSON.stringify(m.offer), wrong=Object.keys(G.DG_MISSIONS).find(k=>!m.offer.includes(k)), here=[G.P.x,G.P.z];   // (a copy of the real offer: the message object itself is changed next)
    G.DG_BOARD.msg.offer=[wrong,wrong==='hunt'?'escort':'hunt']; G.DG_BOARD.msg.pool=G.DG_BOARD.msg.offer.slice(); G.dgBoardRender(); sent.length=0;
    find(body(),'dgb-start')[0].click(); await wait(500); G=c.G();
    ok('a Start for a type that is no longer on offer is refused by the server (no run, no move), and its fresh dgboard reopens the board with the real offer',mine().length===1&&last().a==='start'&&last().type===wrong&&!hidden()&&JSON.stringify(G.DG_BOARD.msg.offer)===real&&Math.hypot(G.P.x-here[0],G.P.z-here[1])<1,JSON.stringify(last())+' offer now '+JSON.stringify(G.DG_BOARD.msg&&G.DG_BOARD.msg.offer)); }
  G.closePanels(); await tp(E2.x,E2.z-3); G=c.G(); G.closePanels(); G.dgBoardOpen('jadesprings'); await wait(500); G=c.G();
  { const m=G.DG_BOARD.msg, t=tx(body()); ok('the real server at the Falls Door (Hanami walked into, level 30, Sakura Vale +0): open, level 30, "Sakura Vale +0", Jade Spring Grottoes',!!m&&m.th==='jadesprings'&&m.ok===1&&m.L===30&&m.tier===0&&/Jade Spring Grottoes/.test(t)&&/Sakura Vale \+0/.test(t)&&/Level 30/.test(t)&&/Jade Falls|Falls/.test(t),m?JSON.stringify(m).slice(0,200):'no answer'); }
  G.closePanels();
  // ---- the door's talk key goes through the board now ----
  { const orig=G.dgBoardSwap(undefined); await tp(E1.x+3,E1.z); G=c.G(); G.updateTalkUI(); const n0=c.el('#toasts')._kids.length; c.fireWin('keydown',{code:'KeyE'});
    const kids=c.el('#toasts')._kids; ok('with no board defined dgOpenDoor still falls back to the "not ready" toast (the door\'s own rule)',kids.length===n0+1&&kids[kids.length-1].textContent==='The way is not ready yet'); G.dgBoardSwap(orig); }
  ok('the whole run threw nothing (no stream failure, no console error)',!c.G().Stream.failed&&errs.length===0,errs.slice(0,2).join(' | '));
  c.stop(); console.error=realErr; console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
})();
