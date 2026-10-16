// Headless test of version 3's rolled gear in the client UI: unrolled/rolled item details, the forge's Roll and Sacrifice tabs, stone chips, the cooldown helper, events
// Usage: python3 build.py && node tools/rolls-client-smoke.js   (solo world, ~20 s). Covers game/economy/rolls.js and its hooks. Server side: tools/rolls-smoke.js.
const {bootClient}=require('./headless');
const c=bootClient({expose:['NET','startSolo','beginPlay','canStart:()=>canStart','GEAR','PL','ITEM','INV','renderInv','renderInvInfo','openForge','renderForge','statDiff','rlUiCdr','rlUiRollHtml','rlUiSacHtml','rlUiInfoHtml','rlUiStoneChipHtml','dgInfoHtml','setForgeTab:t=>{ forgeTab=t; }','EVH']});
const wait=ms=>new Promise(r=>setTimeout(r,ms)); let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
(async()=>{
  let G=c.G(); for(let i=0;i<300;i++){ await wait(100); G=c.G(); if(G.canStart()) break; }
  G.NET.onReady=()=>G.beginPlay(); G.startSolo(); await wait(1500); G=c.G();
  G.NET.send({t:'dev',cmd:'level',v:40}); G.NET.send({t:'rldev',cmd:'stones'}); G.NET.send({t:'rldev',cmd:'all40'}); G.NET.send({t:'rldev',cmd:'rolled'}); await wait(900); G=c.G();
  ok('stones reach the mirror',G.GEAR.rsw===30&&G.GEAR.rsa===30,G.GEAR.rsw+'/'+G.GEAR.rsa);
  const un=G.GEAR.inv.find(id=>/^sword8$/.test(id)||(G.ITEM[id]&&G.ITEM[id].roll0&&!G.ITEM[id].roll)), ro=G.GEAR.inv.find(id=>G.ITEM[id]&&G.ITEM[id].roll);
  ok('an unrolled and a rolled piece are in the bag',!!un&&!!ro);
  ok('unrolled details say to use a Reroll Stone',/Unrolled: use a Reroll Stone/.test(G.dgInfoHtml(G.ITEM[un])));
  ok('rolled details list three lines',(G.dgInfoHtml(G.ITEM[ro]).match(/rl-line"/g)||[]).length===3);
  ok('statDiff works on a rolled piece',typeof G.statDiff(G.ITEM[ro],G.ITEM[G.GEAR.eq.weapon])==='string');
  ok('the stone chips show',/Weapon Reroll Stone/.test(G.rlUiStoneChipHtml())&&/Armor Reroll Stone/.test(G.rlUiStoneChipHtml()));
  const roll=G.rlUiRollHtml(); ok('Roll tab lists pieces with Roll and Reroll buttons',/data-reroll=/.test(roll)&&/Reroll:|Roll:/.test(roll));
  ok('Sacrifice tab lists spare pieces with stone counts',/data-sac=/.test(G.rlUiSacHtml())&&/gives \d+/.test(G.rlUiSacHtml()));
  G.openForge({def:{name:'Greta'}}); for(const t of ['roll','sac']){ G.setForgeTab(t); G.renderForge(); ok('forge renders the '+t+' tab',document.querySelector('#forgeBody').innerHTML.length>100); }
  ok('rlUiCdr is a fraction within 0..0.4',(x=>x>=0&&x<=0.4)(G.rlUiCdr()));
  ok('events registered',typeof G.EVH.sac==='function'&&typeof G.EVH.reroll==='function');
  process.exit(fails?1:0);
})().catch(e=>{ console.log('FAIL crash',e); process.exit(1); });
