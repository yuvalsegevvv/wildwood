// Renders monster and boss models (src/game/combat/monster-*.js) to a PNG, a three-quarter and a side view of each, without building the game.
// Usage: node tools/monster-preview.js [out.png] [--ids slime,treant,boss | --all | --bosses] [--cell 300] [--views 35,90] [--pose | --act | --head | --stats]
//   ids are the ids in MON_DEFS / BOSS_DEFS (boss = the Rootwarden, carapax, akaoni, kyuubi, ymrik, vetrmaw, plus their add-ons: thornling, crabhatch, oniimp, foxkit, frostthrall, wyrmling, totem, warmcore).
//   --views: camera yaws in degrees (0 = straight at the front, 90 = its left side); --pose: the model after a second of trotting; --act: caught mid-attack; --head: only the top fifth of each model, for faces; --stats: print each model's triangles and meshes (draw calls) instead of drawing.
// Every model is scaled to its in-game size and fitted into its cell; each strip prints the triangle count and the size in metres.
// Needs: npm install (three), python3 with numpy + pillow (tools/monster-rast.py draws it).
global.THREE=require('three');
const fs=require('fs'), path=require('path'), os=require('os'), {execFileSync}=require('child_process'), {SRC,strip}=require('./load');
const arg=n=>{ const i=process.argv.indexOf(n); return i>0?process.argv[i+1]:null; };
const out=process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:path.join(os.tmpdir(),'monster-preview.png');
const rd=f=>strip(fs.readFileSync(path.join(SRC,f),'utf8'));
const pm=rd('game/world/plant-models.js'), bl=rd('game/village/buildings.js');
const helpers='const vbox=(w,h,d,x,y,z)=>new THREE.BoxGeometry(w,h,d).translate(x||0,y||0,z||0);\n'+
  pm.slice(pm.indexOf('const _c'),pm.indexOf('\n',pm.indexOf('const cyl'))+1)+
  bl.slice(bl.indexOf('function stoneC'),bl.indexOf('\n',bl.indexOf('function trisGeo'))+1);
const model=rd('game/character/model.js').split('const hiker=')[0];
const game=JSON.parse(fs.readFileSync(path.join(SRC,'manifest.json'),'utf8')).game;
const monFiles=game.filter(f=>/^combat\/monster/.test(f));   // parts, the families' files, then monsters.js itself (views and animation)
const code=['shared/math.js','shared/noise.js','shared/balance.js','shared/monster-defs.js'].map(rd).join('')+helpers+
  'const LITE=false,LOW=false;const localStorage={getItem(){return null},setItem(){}};const scene=new THREE.Scene();const matFlat=new THREE.MeshLambertMaterial();let t=0;const GAIT=[0,Math.PI,Math.PI,0];const getH=()=>0,BOSS={list:[]},CB={target:null};\n'+
  rd('game/world/plant-models-hi.js')+model+';\n'+rd('game/character/pose.js')+monFiles.map(f=>rd('game/'+f)).join('')+
  '\nreturn {ALL_MON_DEFS,buildMonster,monMat,AM:animateMonster};';
const M=new Function(code)();
const ids=arg('--ids')?arg('--ids').split(','):process.argv.includes('--bosses')?['boss','carapax','akaoni','kyuubi','ymrik','vetrmaw']:process.argv.includes('--all')?M.ALL_MON_DEFS.map(d=>d.id):['slime','treant','goblin'];
const views=(arg('--views')||'35,90').split(',').map(Number), cell=+(arg('--cell')||300), trot=process.argv.includes('--pose'), act=process.argv.includes('--act');
const rows=[]; let tAll=0;
for(const id of ids){
  const d=M.ALL_MON_DEFS.find(x=>x.id===id); if(!d){ console.error('no monster',id); continue; }
  const t0=Date.now(), mat=M.monMat(d.glow), g=new THREE.Group(), parts=M.buildMonster(d,mat,g); tAll+=Date.now()-t0;
  // the same call the game makes each frame: a fake view standing still, trotting, or caught mid-attack (a few frames so the pose settles)
  const m={def:d,T:d,model:d.model,parts,g,s:1,gs:d.scale,ph:1.3,lunge:0,spawnT:0,face:0,x:0,y:0,z:0,aggro:true,act:null,boss:!!d.boss,mat};
  for(let i=0;i<(trot||act?40:20);i++){ if(act) m.act={kind:'slash',t:0.22,dur:0.6}; M.AM(m,0.05,trot?4:0); }
  g.updateMatrixWorld(true);
  if(process.argv.includes('--stats')){ let n=0,tr=0; g.traverse(o=>{ if(o.isMesh){ n++; tr+=o.geometry.attributes.position.count/3; } }); console.log(id.padEnd(12),String(tr).padStart(6),'tris',String(n).padStart(3),'meshes'); continue; }
  
  const t=[]; g.traverse(o=>{ if(!o.isMesh) return; const ge=o.geometry.index?o.geometry.toNonIndexed():o.geometry, p=ge.attributes.position, c=ge.attributes.color, nr=ge.attributes.normal, v=new THREE.Vector3(), n=new THREE.Vector3(), nm=new THREE.Matrix3().getNormalMatrix(o.matrixWorld);
    for(let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld); if(nr) n.fromBufferAttribute(nr,i).applyMatrix3(nm).normalize(); else n.set(0,0,0);
      t.push(+v.x.toFixed(4),+v.y.toFixed(4),+v.z.toFixed(4),c?+c.getX(i).toFixed(3):0.8,c?+c.getY(i).toFixed(3):0.8,c?+c.getZ(i).toFixed(3):0.8,+n.x.toFixed(3),+n.y.toFixed(3),+n.z.toFixed(3)); } });
  if(process.argv.includes('--head')){ let top=-1e9,bot=1e9; for(let i=1;i<t.length;i+=9){ top=Math.max(top,t[i]); bot=Math.min(bot,t[i]); } const cut=top-(top-bot)*0.2, keep=[]; for(let i=0;i<t.length;i+=27){ if(Math.max(t[i+1],t[i+10],t[i+19])>cut) keep.push(...t.slice(i,i+27)); } t.length=0; t.push(...keep); }
  rows.push({id,label:d.name+' (L'+d.level+', '+d.model+' x'+d.scale+')',tris:t});
}
if(process.argv.includes('--stats')){ console.log('geometry build time, all listed:',tAll,'ms'); process.exit(0); }
const tmp=path.join(os.tmpdir(),'monster-preview.json'); fs.writeFileSync(tmp,JSON.stringify(rows));
execFileSync('python3',[path.join(__dirname,'monster-rast.py'),tmp,out,String(cell),views.join(',')],{stdio:'inherit'});
console.log('wrote',out,'('+rows.map(r=>r.id+' '+(r.tris.length/27)+' tris').join(', ')+')');
