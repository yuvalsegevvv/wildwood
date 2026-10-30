// The public test world (src/server/testworld.js) on the built server as its own process: /test serves the page, /ws-test is a separate world (level 60 kit, no XP, no saves, no testing tools, no ranking), the main world at /ws is untouched, and an emptied test world is dropped.   Build first.   Usage: node tools/testworld-smoke.js
const {wait,until,get,wsOpen,msgs,send,startHost}=require('./host-lib'), crypto=require('crypto');
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const you=c=>msgs(c).filter(m=>m.t==='you').pop(), hello=(c,extra)=>send(c,Object.assign({t:'hello',name:'Tester',look:{},save:{level:3,exp:5,gear:{coins:7}}},extra));
(async()=>{
  const H=await startHost(); ok('the server starts',H.up); if(!H.up){ console.log(H.log().slice(-500)); process.exit(1); }
  try{
    const page=await get(H.port,'/test'), root=await get(H.port,'/');
    ok('/test serves the game page',page.status===200&&page.body.length===root.body.length);
    const M=await wsOpen(H.port); hello(M,{acct:crypto.randomBytes(16).toString('hex')}); await until(()=>you(M),20000);
    ok('the main world ignores the test world: level 1 hiker has the saved level 3',you(M).level===3);
    const T=await wsOpen(H.port,'/ws-test'); hello(T,{acct:crypto.randomBytes(16).toString('hex')}); ok('the test world answers',!!await until(()=>you(T),30000));
    const y=you(T), g=y.gear||{};
    send(M,{t:'pztest',v:{kind:'sudoku',diff:2,seed:5}}); send(T,{t:'pztest',v:{kind:'sudoku',diff:2,seed:5}});
    ok('the public puzzle tool works in the test world and not in the main one',!!await until(()=>msgs(T).find(m=>m.t==='pz'&&m.a==='open'&&m.kind==='sudoku'),5000)&&!msgs(M).find(m=>m.t==='pz'));
    ok('level 60, 10M coins, 1000 reroll stones of each kind',y.level===60&&g.coins===10000000&&g.rsw===1000&&g.rsa===1000&&g.rsr===1000,y.level+' '+g.coins);
    ok('the browser\'s save was ignored',g.coins!==7);
    const inv=g.inv||[];
    ok('every level-40 piece at Unique +8 and every pendant',['sword8-u+8','bow8-u+8','wand8-u+8','helmet8-u+8','top8-u+8','bottom8-u+8','shoes8-u+8','ring8-basic-u+8','ring8-light-u+8','pendant-xp-u+8','pendant-critdmg-u+8'].every(i=>inv.includes(i)));
    ok('the best is worn',g.eq.weapon==='sword8-u+8'&&g.eq.top==='top8-u+8'&&g.eq.ring==='ring8-basic-u+8'&&g.eq.pendant==='pendant-critdmg-u+8',JSON.stringify(g.eq));
    ok('every circle attuned, every symbol +4',g.east===2&&g.north===2&&g.west===2&&g.sun===2&&g.gloam===2&&g.tall===2&&Object.values(g.zt).every(z=>z.max===4));
    ok('outfits, skills at level 4, the cave',g.os.length>=8&&Object.keys(g.skills.lv).length>20&&Object.values(g.skills.lv).every(v=>v>=4)&&Object.values(g.skills.lv).includes(4)&&Object.keys(g.cave.own).length>=20,g.os.length+' '+Object.keys(g.skills.lv).length+' '+[...new Set(Object.values(g.skills.lv))]+' '+Object.keys(g.cave.own).length);
    const gems0=you(T).gear.gem|0; send(T,{t:'dev',cmd:'level',v:5}); send(T,{t:'gemtest'}); await wait(600);
    ok('no testing tools',you(T).level===60&&!JSON.stringify(msgs(T)).includes('(testing)'),you(T).level+' gems '+you(T).gear.gem);
    const fr=msgs(T).length; send(T,{t:'fr',a:'rank'}); await wait(700);
    ok('no ranking',JSON.stringify(msgs(T).slice(fr)).includes('"rnk",[],0,0')||!JSON.stringify(msgs(T).slice(fr)).includes('Tester'));
    const st=JSON.parse((await get(H.port,'/status')).body.toString());
    ok('/status counts both worlds apart',st.players===1&&st.testPlayers===1,JSON.stringify(st));
    T.s.destroy(); await wait(800);
    const T2=await wsOpen(H.port,'/ws-test'); hello(T2); await until(()=>you(T2),30000);
    ok('after the last hiker left a new session starts from the kit again',you(T2).level===60&&/test world dropped/.test(H.log()));
    ok('the main hiker was never touched',you(M).level===3);
  }catch(e){ console.log('FAIL threw',e); fails++; }
  await H.stop(); console.log(fails?fails+' failed':'all passed'); process.exit(fails?1:0);
})();
