// Headless client test: runs dist/wildwood.html in Node with a stub DOM/WebGL (tools/headless.js) and plays solo through the real
// client code. Build first (python3 build.py). Needs the three package (npm install). Prints PASS/FAIL lines.
// Usage: node tools/client-smoke.js
const {bootClient}=require('./headless');
const c=bootClient({expose:['NET','startSolo','beginPlay','MONS','P','PL','CB','GEAR','MAP','CHAT','WX','doAttack','equip','updateMonsters','updateCombat','updateWeather','openSkills','renderInv','sendChat','openChat','chatText','getH','canStart:()=>canStart']});
const wait=ms=>new Promise(r=>setTimeout(r,ms)); let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const el=s=>document.querySelector(s);
(async()=>{
  let G=c.G(); for(let i=0;i<300;i++){ await wait(100); G=c.G(); if(G.canStart()) break; }
  ok('world streams in',G.canStart());
  G.NET.onReady=()=>G.beginPlay(); G.startSolo(); await wait(1500); G=c.G();
  ok('solo server: welcome and monster views',G.NET.ready&&G.MONS.length>400,G.MONS.length+' views');
  const s=G.MONS.find(m=>m.def.id==='slime'); G.P.x=s.x+1.5; G.P.z=s.z; G.P.y=G.getH(G.P.x,G.P.z);
  for(let i=0;i<120&&!s.dead;i++){ G.CB.target=s; G.P.yaw=Math.atan2(-(s.x-G.P.x),-(s.z-G.P.z)); G.doAttack('basic'); G.updateMonsters(0.033); G.updateCombat(0.033); await wait(33); }
  G=c.G(); ok('attack through the server kills a slime',s.dead,'xp '+G.PL.exp.toFixed(1));
  G.equip('bow1'); await wait(300); ok('equip round-trip',c.G().GEAR.eq.weapon==='bow1');
  el('#inv').hidden=false; G.renderInv(); ok('inventory renders body slots',(el('#invBody').innerHTML.match(/class="eqslot"/g)||[]).length===5);
  G.openSkills(); ok('skills panel renders 3 slots',(el('#skBody').innerHTML.match(/class="sk-slot/g)||[]).length===3);
  G.openChat(); G.chatText.value='hi'; G.sendChat(); await wait(300); ok('chat line arrives',c.G().CHAT.lines.length>0);
  for(let i=0;i<150&&!c.G().MAP.done;i++) await wait(100); ok('world map painted',c.G().MAP.done);
  G.NET.send({t:'dev',cmd:'weather',v:'rain'}); await wait(300); for(let i=0;i<60;i++){ G.WX.t+=0.5; G.updateWeather(0.5); } ok('rain fades in',G.WX.inten>0.9);
  c.stop(); console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
})();
