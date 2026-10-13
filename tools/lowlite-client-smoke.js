// Test of the phone paths of the built page (dist/, solo, headless): the owner plays on a phone, where LOW (a touch device) and LITE (light mode, a setting) change the detail, the size of the
// terrain tiles, the villagers, the plants and the budgets of the streaming. Boots the page as a phone and then in light mode and checks that the world loads, that the ground of far tiles is
// coloured when you come near (and not before), that the far villages' people are built after the loading screen, that solo starts with the monsters in place, and that nothing logs an error.
// Build first (python3 build.py).   Usage: node tools/lowlite-client-smoke.js
const {bootClient}=require('./headless');
const wait=ms=>new Promise(r=>setTimeout(r,ms)); let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const EXPOSE=['NET','startSolo','beginPlay','canStart:()=>canStart','LOW','LITE','TBAND','TTILE','TERRAIN_BANDS','Stream','NPCs','NPC_DEFER','P','MONS','getH'];
(async()=>{
  const errors=[], err0=console.error; console.error=(...a)=>{ errors.push(a.map(String).join(' ').slice(0,200)); };
  for(const [name,opts,low,lite] of [['a phone (touch)',{touch:true},true,false],['light mode (touch + the LITE setting)',{touch:true,lite:true},true,true]]){
    const c=bootClient(Object.assign({expose:EXPOSE},opts)); let G=c.G(), t0=Date.now();
    for(let i=0;i<1800;i++){ await wait(100); G=c.G(); if(G.canStart()) break; }
    ok(name+': the world streams in and the device flags are what the page was told',G.canStart()&&G.LOW===low&&G.LITE===lite&&G.TBAND===(lite?48:64),((Date.now()-t0)/1000).toFixed(1)+' s, LOW '+G.LOW+', LITE '+G.LITE+', tiles '+G.TBAND+'x'+G.TTILE);
    const bands=G.TERRAIN_BANDS, ready0=bands.filter(b=>b.ready), wait0=bands.filter(b=>!b.ready), npc0=G.NPCs.length;
    ok(name+': only the tiles by the spawn are coloured at boot, the rest wait and are not drawn',ready0.length>0&&wait0.length>ready0.length&&wait0.every(b=>b.lazy&&!b.mesh.visible),ready0.length+' coloured, '+wait0.length+' waiting');
    const far=wait0.sort((a,b)=>Math.hypot(b.x0-G.P.x,b.z0-G.P.z)-Math.hypot(a.x0-G.P.x,a.z0-G.P.z))[0], home={x:G.P.x,z:G.P.z};
    G.P.x=(far.x0+far.x1)/2; G.P.z=(far.z0+far.z1)/2; let t=0; for(;t<900&&!far.ready;t++) await wait(100); G=c.G();
    let nz=0; for(let i=0;i<far.tc.length;i++) if(far.tc[i]>0) nz++;
    ok(name+': a far tile is coloured once you are there',far.ready&&nz>far.tc.length*0.9,(t/10)+' s');
    G.P.x=home.x; G.P.z=home.z;
    for(let i=0;i<600&&G.NPC_DEFER.length;i++){ await wait(100); G=c.G(); }
    ok(name+': the far villages\' people are built after the loading screen',G.NPC_DEFER.length===0&&G.NPCs.length>npc0,npc0+' at boot, '+G.NPCs.length+' later');
    G.NET.onReady=()=>G.beginPlay(); G.startSolo(); await wait(2500); G=c.G();
    ok(name+': solo starts with the monsters in place',G.NET.ready&&G.MONS.length>400,G.MONS.length+' monster views');
    c.stop(); await wait(200);
  }
  console.error=err0;
  ok('nothing logged an error in either mode',errors.length===0,errors.slice(0,2).join(' | '));
  console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
})();
