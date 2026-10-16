// Zone dressing (src/game/world/zone-props*.js): every monster zone and boss arena has a ground tint and its props, every prop kind builds sane geometry within a triangle budget,
// the chunk generator really places camps / webs / ruins / boss rings where the themes say, and a chunk adds only a handful of draw calls. Needs a build (python3 build.py).
// Usage: node tools/zoneprops-smoke.js        (about 20 s)
const {bootClient}=require('./headless');
const c=bootClient({expose:['ZP_KIND','ZP_BAD','ZP_THEME','ZP_TH_OF','ZP_BOSS','ZP_PLANS','ZP_GEO','zpGeo','zpGroundTint','terrainColorBase','ZONES','ARENAS','zonePoint','CHUNK_MESHES','CHX','CS','WX0','WZ0','genZoneProps','zpCellZone',
  'canStart:()=>canStart','setRand:r=>{ rand=r; }','mulberry32','NCH','chunkRect','THREE','zoneAt']});
const wait=ms=>new Promise(r=>setTimeout(r,ms)); let fails=0; const ok=(n,cond,i)=>{ console.log((cond?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!cond) fails++; };
(async()=>{
  let G=c.G(); for(let i=0;i<300;i++){ await wait(100); G=c.G(); if(G.canStart()) break; }
  ok('the world boots',G.canStart());
  ok('no theme row names a missing prop kind',G.ZP_BAD.length===0,G.ZP_BAD.join(', '));
  const noTheme=G.ZONES.filter((z,i)=>!G.ZP_TH_OF[i]).map(z=>z.key);
  ok('every zone has a ground tint row ('+G.ZONES.length+' zones)',!noTheme.length,noTheme.join(','));
  const rows=Object.values(G.ZP_THEME), bossArena=G.ARENAS.map(A=>A.key);
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
    const v=new G.THREE.Color(0x808080); G.zpGroundTint(0,0,5,0.2,v); ok('the village square is not',v.r===b.r&&v.g===b.g&&v.b===b.b); }
  // the generator: run it over the chunks round a zone's centre and see what it built
  const chunkAt=(x,z)=>Math.floor((z-G.WZ0)/G.CS)*G.CHX+Math.floor((x-G.WX0)/G.CS);
  const run=(ci)=>{ G.setRand(G.mulberry32(1000+ci*7919)); const n0=G.CHUNK_MESHES.length, gen=G.genZoneProps(ci); while(!gen.next().done); return G.CHUNK_MESHES.length-n0; };
  const near=(x,z,r)=>{ const s=new Set(); for(let dx=-r;dx<=r;dx++) for(let dz=-r;dz<=r;dz++) s.add(chunkAt(x+dx*G.CS,z+dz*G.CS)); return [...s]; };
  const around=(key,kinds)=>{ const zn=G.ZONES.find(z=>z.key===key), [x,z]=G.zonePoint(zn,0,0.5,true); let meshes=0, chunks=0; for(const ci of near(x,z,2)){ meshes=Math.max(meshes,run(ci)); chunks++; }
    return {meshes,built:kinds.filter(k=>G.ZP_GEO[k])}; };
  for(const [key,kinds,label] of [[5,['gobhut','campfire','gobtotem','barricade'],'goblin huts and fires in the Goblin Woods'],[20,['web','webdome','cocoon'],'spider webs in the Ghostlight Marsh'],['m35',['gallows','gravestone'],'gallows and graves on Gallows Down'],['s34',['obelisk','sarcophagus'],'obelisks and sarcophagi in the Whitefloor'],['g28',['minecart','mineframe','orepile'],'mine carts in the Miners\' Scree'],['h29',['barrowmound','gravestone_frost'],'barrow mounds in Bonefrost Barrow']]){
    const r=around(key,kinds); ok(label+' (built: '+r.built.join(',')+')',r.built.length>=1); ok('  ...and a chunk costs at most 16 more draw calls ('+r.meshes+')',r.meshes<=16); }
  for(const A of G.ARENAS){ const kinds=G.ZP_BOSS[A.key].map(r=>r[0]); const before=new Set(Object.keys(G.ZP_GEO)); let hit=false;
    for(const ci of near(A.x,A.z,1)) run(ci); hit=kinds.some(k=>G.ZP_GEO[k]); ok('boss surroundings are placed round '+A.key+' ('+A.name+')',hit); }
  { let ruins=0; const gz=G.ZONES.find(z=>z.key==='m33'); const [x,z]=G.zonePoint(gz,0,0.5,true); for(const ci of near(x,z,3)) run(ci);
    ruins=['ruinplan0','ruinplan1','ruinplan2','ruinplan3','ruinplan4'].filter(k=>G.ZP_GEO[k]).length; ok('ruins are scattered over the Gloamhorn ('+ruins+' kinds built)',ruins>=2); }
  c.stop();
  console.log(fails?fails+' check(s) failed':'all checks passed (total '+Math.round(total)+' triangles of every kind once)'); process.exit(fails?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
