// Zone dressing (src/game/world/zone-props*.js): every monster zone and boss arena has a ground tint and its props, every prop kind builds sane geometry within a triangle budget,
// the chunk generator really places camps / webs / ruins / boss rings where the themes say, and a chunk adds only a handful of draw calls. Needs a build (python3 build.py).
// Usage: node tools/zoneprops-smoke.js        (about 20 s)
const {bootClient}=require('./headless');
const c=bootClient({expose:['VIL','ZP_KIND','ZP_BAD','ZP_THEME','ZP_TH_OF','ZP_BOSS','ZP_PLANS','ZP_GEO','zpGeo','zpGroundTint','terrainColorBase','ZONES','ARENAS','zonePoint','CHUNK_MESHES','CHX','CS','WX0','WZ0','genZoneProps','zpCellZone',
  'canStart:()=>canStart','setRand:r=>{ rand=r; }','mulberry32','NCH','chunkRect','THREE','zoneAt','savZoneAt','SAV_ZONE_OF','SAV_HUB','ARENA_A41','ARENA_A45','savWetAt','SAV_CYCLE_S','savDryAt','savBurnK','savKeepOut','inAmber','ZPF_KIND','SAV_GATE','savTint','SAV_SKY','SAV_WET_U','envCur']});
const wait=ms=>new Promise(r=>setTimeout(r,ms)); let fails=0; const ok=(n,cond,i)=>{ console.log((cond?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!cond) fails++; };
(async()=>{
  let G=c.G(); for(let i=0;i<300;i++){ await wait(100); G=c.G(); if(G.canStart()) break; }
  ok('the world boots',G.canStart());
  ok('no theme row names a missing prop kind',G.ZP_BAD.length===0,G.ZP_BAD.join(', '));
  const noTheme=G.ZONES.filter((z,i)=>!G.ZP_TH_OF[i]).map(z=>z.key);
  ok('every zone has a ground tint row ('+G.ZONES.length+' zones)',!noTheme.length,noTheme.join(','));
  const rows=Object.values(G.ZP_THEME), bossArena=G.ARENAS.filter(A=>!A.raid).map(A=>A.key);
  ok('every row that places props has at least two kinds, a density and a tint',rows.every(t=>(t.dens===0&&!t.entries.length)||(t.dens>0&&t.dens<0.3&&t.entries.length>=2)&&t.tk>0&&t.tk<=0.5));
  ok('every boss arena has a surroundings ring and its kinds exist',bossArena.every(k=>G.ZP_BOSS[k]&&G.ZP_BOSS[k].every(r=>G.ZP_KIND[r[0]])),bossArena.filter(k=>!G.ZP_BOSS[k]).join(','));
  ok('ruin plans use real kinds',G.ZP_PLANS.every(p=>p.p.every(r=>G.ZP_KIND[r[0]])));
  // geometry: every kind builds, finite, coloured, under budget
  const bad=[], big=[]; let total=0, worst=['',0];
  for(const id of Object.keys(G.ZP_KIND)){
    try{ const g=G.zpGeo(id); for(const geo of [g.geo,g.glow]){ if(!geo) continue;
        const A=geo.attributes; if(!A.position||!A.normal||!A.color||A.color.count!==A.position.count){ bad.push(id+': missing attributes'); continue; }
        for(const n of ['position','normal','color']) for(const v of A[n].array) if(!isFinite(v)){ bad.push(id+': NaN in '+n); break; }
        const tris=A.position.count/3; total+=tris; if(tris>worst[1]) worst=[id,tris]; if(tris>1500) big.push(id+' '+tris); } }
    catch(e){ bad.push(id+': '+e.message); } }
  ok('all '+Object.keys(G.ZP_KIND).length+' prop kinds build finite, coloured geometry',!bad.length,bad.slice(0,4).join('; '));
  ok('no prop kind is over 1,500 triangles (largest '+worst[0]+' '+worst[1]+')',!big.length,big.join(', '));
  // the ground: a goblin zone is tinted, the village is not
  { const zn=G.ZONES.find(z=>z.key===5), [x,z]=G.zonePoint(zn,0,0.5), a=new G.THREE.Color(0x808080), b=new G.THREE.Color(0x808080);
    G.zpGroundTint(x,z,5,0.2,a); const d=Math.abs(a.r-b.r)+Math.abs(a.g-b.g)+Math.abs(a.b-b.b); ok('a goblin zone\'s ground is tinted',d>0.02,d.toFixed(3));
    const v=new G.THREE.Color(0x808080); G.zpGroundTint(G.VIL.x,G.VIL.z,5,0.2,v); ok('the village square is not',v.r===b.r&&v.g===b.g&&v.b===b.b); }
  // the generator: run it over the chunks round a zone's centre and see what it built
  const chunkAt=(x,z)=>Math.floor((z-G.WZ0)/G.CS)*G.CHX+Math.floor((x-G.WX0)/G.CS);
  const run=(ci)=>{ G.setRand(G.mulberry32(1000+ci*7919)); const n0=G.CHUNK_MESHES.length, gen=G.genZoneProps(ci); while(!gen.next().done); return G.CHUNK_MESHES.length-n0; };
  const near=(x,z,r)=>{ const s=new Set(); for(let dx=-r;dx<=r;dx++) for(let dz=-r;dz<=r;dz++) s.add(chunkAt(x+dx*G.CS,z+dz*G.CS)); return [...s]; };
  const around=(key,kinds)=>{ const zn=G.ZONES.find(z=>z.key===key), [x,z]=G.zonePoint(zn,0,0.5,true); let meshes=0, chunks=0; for(const ci of near(x,z,2)){ meshes=Math.max(meshes,run(ci)); chunks++; }
    return {meshes,built:kinds.filter(k=>G.ZP_GEO[k])}; };
  for(const [key,kinds,label] of [[5,['gobhut','campfire','gobtotem','barricade'],'goblin huts and fires in the Goblin Woods'],[20,['web','webdome','cocoon'],'spider webs in the Ghostlight Marsh'],['m35',['gallows','gravestone'],'gallows and graves on Gallows Down'],['s34',['obelisk','sarcophagus'],'obelisks and sarcophagi in the Whitefloor'],['g28',['minecart','mineframe','orepile'],'mine carts in the Miners\' Scree'],['h29',['barrowmound','gravestone_frost'],'barrow mounds in Bonefrost Barrow']]){
    const r=around(key,kinds); ok(label+' (built: '+r.built.join(',')+')',r.built.length>=1); ok('  ...and a chunk costs at most 16 more draw calls ('+r.meshes+')',r.meshes<=16); }
  for(const A of G.ARENAS.filter(a=>!a.raid)){ const kinds=G.ZP_BOSS[A.key].map(r=>r[0]); const before=new Set(Object.keys(G.ZP_GEO)); let hit=false;
    for(const ci of near(A.x,A.z,1)) run(ci); hit=kinds.some(k=>G.ZP_GEO[k]); ok('boss surroundings are placed round '+A.key+' ('+A.name+')',hit); }
  // Amber Reach (docs/SAVANNA.md): nine zones a37..a45, two arenas, props that fit, the season
  { const A=G.ZONES.filter(z=>z.amber&&!z.boss), pts=A.map(z=>G.zonePoint(z,0,0.5,true));
    ok('Amber Reach has the nine zones a37..a45 (levels 37-45), each with a ground tint row, and zoneAt answers with them',A.length===9&&A.every((z,i)=>z.key==='a'+(37+i)&&z.level===37+i&&G.ZP_THEME[z.key])&&A.every((z,i)=>{ const q=G.SAV_ZONE_OF[z.level]; return q===z&&G.inAmber(z.x,z.z); }),A.map(z=>z.key).join());
    const near=A.filter((z,i)=>{ const q=G.zoneAt(pts[i][0],pts[i][1]); return q===z; }).length;
    ok('a point drawn inside each zone (zonePoint) is mostly in that zone ('+near+' of 9; the borders wander)',near>=6);
    ok('the village has no zone (70 m round the hub) and the two arenas have their own (aboss41 / aboss45)',G.zoneAt(G.SAV_HUB[0],G.SAV_HUB[1])===null&&G.zoneAt(G.ARENA_A41.x,G.ARENA_A41.z)===G.ARENA_A41.zone&&G.zoneAt(G.ARENA_A45.x,G.ARENA_A45.z)===G.ARENA_A45.zone&&G.ARENA_A41.key==='aboss41'&&G.ARENA_A45.key==='aboss45'&&G.ARENAS.includes(G.ARENA_A41)&&G.ARENAS.includes(G.ARENA_A45));
    ok('nothing is placed at random in the village, on the arenas or at the Moot (savKeepOut)',G.savKeepOut(G.SAV_HUB[0],G.SAV_HUB[1],0)&&G.savKeepOut(G.ARENA_A41.x,G.ARENA_A41.z,0)&&!G.savKeepOut(0,0,0)); }
  for(const [key,kinds,label] of [['a40',['termitespire','termitemound'],'termite spires in the Termite Cathedrals'],['a42',['smolder','charstump'],'smouldering ash on the Burnt Plain'],['a44',['reedclump','wallow'],'reeds and wallows in the Sedge Delta'],['a43',['songpost','greystone'],'song posts and grey stones in Baobab Reach']]){
    const r=around(key,kinds); ok(label+' (built: '+r.built.join(',')+')',r.built.length>=1); ok('  ...and a chunk costs at most 16 more draw calls ('+r.meshes+')',r.meshes<=16); }
  { const T=G.SAV_CYCLE_S, w=f=>G.savWetAt(T*f), t0=G.savWetAt(0);
    ok('the season is a two-hour cycle: Greenfall (wet 1) for the first half, Goldfall (0) for the second, five minutes of change at each turn',w(0.25)===1&&w(0.75)===0&&Math.abs(w(0)-0.5)<1e-9&&Math.abs(w(0.5)-0.5)<1e-9&&w(0.1)===1&&w(0.9)===0&&w(1.25)===1&&T===7200&&t0>=0&&t0<=1);
    ok('the air is as dry as the season in Amber Reach (1 - SAV_SKY.wet), always dry in the Sunscar and not dry in the home forest (savDryAt)',(()=>{ const [x,z]=G.zonePoint(G.SAV_ZONE_OF[39],0,0.5,true); return G.inAmber(x,z)&&G.savDryAt(x,z)>=0&&G.savDryAt(x,z)<=1&&G.savDryAt(G.SAV_GATE.x,G.SAV_GATE.z)===1&&G.savDryAt(0,0)===0; })());
    ok('the burnt plain has ash at its heart and none far away',G.savBurnK(G.SAV_ZONE_OF[42].x,G.SAV_ZONE_OF[42].z)>0&&G.savBurnK(G.SAV_ZONE_OF[38].x,G.SAV_ZONE_OF[38].z)===0);
    { const S=G.SAV_SKY, keep=[S.force,S.wet,S.k]; S.force=1; for(let i=0;i<400;i++) G.savTint(G.envCur,0.05); const g=[S.wet,G.SAV_WET_U.value]; S.force=0; for(let i=0;i<400;i++) G.savTint(G.envCur,0.05); const d=[S.wet,G.SAV_WET_U.value]; S.force=keep[0]; S.wet=keep[1]; S.k=keep[2];
      ok('savTint follows the season (forced Greenfall: wet 1; Goldfall: 0) and sets the grass shader\'s uniform',g[0]===1&&g[1]===1&&d[0]===0&&d[1]===0,g.join()+' / '+d.join()); }
    ok('a smouldering heap is a fire for the zone fires (smoke and embers)',!!G.ZPF_KIND.smolder&&G.ZPF_KIND.smolder.fire===1); }
  { let ruins=0; const gz=G.ZONES.find(z=>z.key==='m33'); const [x,z]=G.zonePoint(gz,0,0.5,true); for(const ci of near(x,z,3)) run(ci);
    ruins=['ruinplan0','ruinplan1','ruinplan2','ruinplan3','ruinplan4'].filter(k=>G.ZP_GEO[k]).length; ok('ruins are scattered over the Gloamhorn ('+ruins+' kinds built)',ruins>=2); }
  c.stop();
  console.log(fails?fails+' check(s) failed':'all checks passed (total '+Math.round(total)+' triangles of every kind once)'); process.exit(fails?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
