// Renders characters from src/game/character/model.js to a PNG (front + side of each), without building the game.
// Usage: node tools/model-preview.js [out.png] [--head] [--looks '<JSON array of look overrides>'] [--model path/to/model.js]
//   e.g. node tools/model-preview.js /tmp/p.png --head --looks '[{"sex":"female","hat":"beanie"},{"facial":"beard"}]'
// Each look override is merged onto the default male look, or the female one when it has "sex":"female".
// Needs: npm install (three), python3 with numpy + pillow. Then open the PNG (in Claude: the view tool).
global.THREE=require('three');
const fs=require('fs'), path=require('path'), os=require('os'), {execFileSync}=require('child_process'), {SRC,strip}=require('./load');
const arg=(n)=>{ const i=process.argv.indexOf(n); return i>0?process.argv[i+1]:null; };
const out=process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:path.join(os.tmpdir(),'model-preview.png');
const head=process.argv.includes('--head'), modelPath=arg('--model')||path.join(SRC,'game/character/model.js');
const pm=strip(fs.readFileSync(path.join(SRC,'game/world/plant-models.js'),'utf8'));
const helpers='const _c=new THREE.Color();const vbox=(w,h,d,x,y,z)=>new THREE.BoxGeometry(w,h,d).translate(x||0,y||0,z||0);\n'+pm.slice(pm.indexOf('function paint'),pm.indexOf('\n',pm.indexOf('const cyl'))+1);
const code=['shared/math.js','shared/noise.js'].map(f=>strip(fs.readFileSync(path.join(SRC,f),'utf8'))).join('')+helpers+
  'const localStorage={getItem(){return null},setItem(){}};const scene=new THREE.Scene();const matFlat=new THREE.MeshLambertMaterial();\n'+
  strip(fs.readFileSync(modelPath,'utf8')).split('const hiker=')[0]+';return {buildCharacter,LOOK_M,LOOK_F};';
const M=new Function(code)();
const overrides=arg('--looks')?JSON.parse(arg('--looks')):[{top:'tshirt',bottom:'shorts'},{sex:'female',top:'tshirt',bottom:'shorts'},{build:1.24,hat:'ranger'},{sex:'female',build:0.86,top:'flannel',bottom:'trousers',hat:'beanie'}];
const chars=overrides.map(o=>{
  const L=Object.assign({},o.sex==='female'?M.LOOK_F:M.LOOK_M,o), rig=M.buildCharacter(L); rig.root.updateMatrixWorld(true);
  // per vertex: position, colour, normal (the renderer shades per pixel from interpolated normals, like the game's Phong material)
  const t=[]; rig.root.traverse(m=>{ if(!m.isMesh) return; const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry, p=g.attributes.position, c=g.attributes.color, nr=g.attributes.normal, v=new THREE.Vector3(), n=new THREE.Vector3(), nm=new THREE.Matrix3().getNormalMatrix(m.matrixWorld);
    for(let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld); if(nr) n.fromBufferAttribute(nr,i).applyMatrix3(nm).normalize(); else n.set(0,0,0);
      t.push(+v.x.toFixed(4),+v.y.toFixed(4),+v.z.toFixed(4),c?+c.getX(i).toFixed(3):0.8,c?+c.getY(i).toFixed(3):0.8,c?+c.getZ(i).toFixed(3):0.8,+n.x.toFixed(3),+n.y.toFixed(3),+n.z.toFixed(3)); } });
  return t; });
const tmp=path.join(os.tmpdir(),'model-preview.json'); fs.writeFileSync(tmp,JSON.stringify(chars));
execFileSync('python3',[path.join(__dirname,'rast.py'),tmp,out].concat(head?['200','200','1.7']:['180','320']),{stdio:'inherit'});
console.log('wrote',out,'('+chars.length+' characters, '+chars.map(c=>c.length/27).join('/')+' triangles)');
