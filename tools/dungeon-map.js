// Draws a preview of a dungeon's map: the baked layout of a theme and missions (shared/dungeons.js: dgLayout, dgBake), cell by cell, with the tiles' roles, monster mouths, objectives, caches,
// the entrance and the round boss hall. The cells are dumped as JSON and drawn by tools/dungeon-map.py (numpy + pillow, like model-preview.js). The same {mission, seed, theme} rebuilds the same
// dungeon in the game, so a preview here is the dungeon a run of that mission and seed plays on.
// Usage: node tools/dungeon-map.js out.png [--theme trial] [--missions purge,defense,escort] [--seed 5]
const fs=require('fs'), os=require('os'), path=require('path'), {spawnSync}=require('child_process');
const {loadShared}=require('./load');
const X=loadShared(['DG_THEMES','dgLayout','dgBake','DG_TC','DG_CELL','DG_BOSS_R','DG_MISSIONS','dgLevel']);
const arg=(k,d)=>{ const i=process.argv.indexOf('--'+k); return i>0&&process.argv[i+1]?process.argv[i+1]:d; };
const out=process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:'dungeon-map.png', themeId=arg('theme','trial'), seed=parseInt(arg('seed','5'),10), missions=arg('missions','purge,defense,escort').split(',');
const T=X.DG_THEMES[themeId]; if(!T){ console.error('no theme '+themeId+' (have '+Object.keys(X.DG_THEMES).join(', ')+')'); process.exit(1); }
const panels=missions.map(m=>{
  let L=null, s=seed; for(let i=0;i<40&&!L;i++){ L=X.dgLayout({mission:m,seed:s+i,theme:T}); if(L) s+=i; }   // (a run takes the first seed that works, like server/dungeons/instances.js)
  if(!L){ console.error('no layout for '+m); process.exit(1); }
  const B=X.dgBake(L);
  return {mission:m,name:X.DG_MISSIONS[m].name,seed:s,w:B.w,h:B.h,cells:Array.from(B.cells),marks:B.marks,props:B.props.map(p=>({k:p.k,x:p.x,z:p.z,hz:p.hz||null})),
    tiles:L.cells.map(t=>({x:t.x,z:t.z,role:t.role||'',tags:t.tags||[]})),gw:L.gw,gh:L.gh,boss:B.boss,solid:Object.fromEntries(Object.entries(B.legend).map(([ch,e])=>[e.prop,e.solid]))};
});
const job={title:T.name+' ('+(T.trial?'a copy of the Hollow Roots, level '+T.lv+', pays nothing':'level '+T.lv)+')',cell:X.DG_CELL,tc:X.DG_TC,pal:T.pal,panels};
const tmp=path.join(os.tmpdir(),'wildwood-dungeon-map.json'); fs.writeFileSync(tmp,JSON.stringify(job));
const r=spawnSync('python3',[path.join(__dirname,'dungeon-map.py'),tmp,out],{stdio:'inherit'});
process.exit(r.status||0);
