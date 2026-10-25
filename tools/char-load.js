// Loads the character code (shared/character.js + game/character/model*.js + game/outfits/*.js + weaponsOn from game/combat/weapons.js) outside the game, for tools/model-preview.js and tools/character-smoke.js.
// const C=require('./char-load')(); C.buildCharacter(look,{q}) ... C.CHAR_MODELS, C.BODY_SLIDERS, C.randomLook ...  (needs `npm install` for three)
// C.tris(rig) -> the flat vertex list tools/rast.py draws (position, colour, normal per vertex); C.stats(rig) -> {tris, meshes, minY, maxY, ...} in world metres.
global.THREE=global.THREE||require('three');
const fs=require('fs'), path=require('path'), {SRC,strip}=require('./load');
const NAMES=['KIN_PARTS','KIN_BAD','KIN_MARKS','KIN_SLOTS','KIN_FUR','KIN_LOOK','KIN_EARS','KIN_TAILS','KIN_MUZZLES','kinPart','kinList','kinCleanLook','kinHatMode','CP_PIECES','CP_RECIPE','CP_SLOTS','cpDef','cosLocked','HTX_HATS','DECOS','SHIELDS','GMX_PAL','gmxPalDef','GMX_TOPS','GMX_BOTTOMS','GMX_SHOES','OF_PAL','OF_TINTX','ofPalOf','HT_HATS','HG_MODES','GM_TOPS','GM_BOTTOMS','GM_SHOES','GL_BASE','GLOVEC','glPlan','cosDef','cosCleanLook','COS_AURAS','COS_CAPES','buildCharacter','charDetail','LOOK_M','LOOK_F','fullLook','lookScale','randomLook','mulberry32','SKINS','HAIRC','HAIRC_NATURAL','EYEC','CLOTH','SHOEC','HATC',
  'BODY_SLIDERS','SLIDER_KEYS','SLIDER_BY_KEY','SLIDER_DEFS','sliderVal','lookSliders','lookForNet','CHAR_MODELS','charModelOf','sliderRange','setupsOf','applySetup','lookOutOfRange','charSexFit','validateCharModel','faceShape','OUTFITS','OF_SLOTS','OF_FIELD','ofWear','ofPieces','ofItems','ofTidy','weaponsOn','matGlow','WPN_SHAPES'];
module.exports=function loadCharacter(patch){   // patch(code) -> code: a tool may edit the assembled source (tools/outfit-palette.js probes the tints)
  const read=f=>strip(fs.readFileSync(path.join(SRC,f),'utf8'));
  const pm=read('game/world/plant-models.js');
  const helpers='const _c=new THREE.Color();'+pm.slice(pm.indexOf('function paint'),pm.indexOf('\n',pm.indexOf('const cyl'))+1);
  const shared=['shared/math.js','shared/noise.js','shared/character.js','shared/cosmetics.js','shared/kin.js','shared/cospieces.js'].map(read).join('');
  const pre=['model-parts.js','model-face.js','model-hair.js','model-hats.js','model-hats-more.js','model-hairgrad.js','outfit-palettes.js','model-body.js','model-gloves.js','model-garments.js','model-garments-more.js','outfit-tools.js','outfit-extras.js','outfit-shapes.js','outfit-faces.js','cosmetics.js','modest.js','model-decos.js','model-shields.js','model-kin.js'].map(f=>read('game/character/'+f)).join('');
  const outfits=fs.readdirSync(path.join(SRC,'game/outfits')).filter(f=>f.endsWith('.js')).sort().map(f=>{ const src=read('game/outfits/'+f);
    try{ new Function(src); return src; }catch(e){ console.warn('char-load: skipping src/game/outfits/'+f+' (syntax error: '+e.message+')'); return ''; } }).join('');   // a half-edited outfit must not break every preview and test (several are written at once)   // the order of src/manifest.json does not matter here: they only fill OUTFITS / CHAR_MODELS
  const model=read('game/character/model.js').split('const hiker=')[0];
  const ws=read('game/combat/weapons.js'), wpn=ws.slice(ws.indexOf('function weaponsOn'),ws.indexOf('function aimDir'));   // the weapon models, to preview an outfit's weapon dressing
  const wsh=read('game/combat/weapon-shapes.js')+read('game/combat/weapon-shapes-v3b.js');
  const stubs='const ITEM={warrior:{slot:"W",tier:2},archer:{slot:"A",tier:2},mage:{slot:"M",tier:2}},CLASS_OF={W:"warrior",A:"archer",M:"mage"};const fxMat=(c,o)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o});const dgVisTier=w=>w?w.tier:0;\n';
  const code=shared+helpers+'const localStorage={getItem(){return null},setItem(){}};const scene=new THREE.Scene();const matFlat=new THREE.MeshLambertMaterial();\n'+pre+outfits+model+stubs+wsh+wpn+';return {'+NAMES.join(',')+'};';
  const C=new Function(patch?patch(code):code)();
  // every vertex of the rig as world-space numbers: position, colour, normal (the renderer shades per pixel like the game's Phong material)
  C.tris=rig=>{ rig.root.updateMatrixWorld(true); const t=[];
    rig.root.traverse(m=>{ if(!m.isMesh) return; const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry, p=g.attributes.position, c=g.attributes.color, nr=g.attributes.normal, v=new THREE.Vector3(), n=new THREE.Vector3(), nm=new THREE.Matrix3().getNormalMatrix(m.matrixWorld);
      for(let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld); if(nr) n.fromBufferAttribute(nr,i).applyMatrix3(nm).normalize(); else n.set(0,0,0);
        t.push(+v.x.toFixed(4),+v.y.toFixed(4),+v.z.toFixed(4),c?+c.getX(i).toFixed(3):0.8,c?+c.getY(i).toFixed(3):0.8,c?+c.getZ(i).toFixed(3):0.8,+n.x.toFixed(3),+n.y.toFixed(3),+n.z.toFixed(3)); } });
    return t; };
  C.stats=rig=>{ rig.root.updateMatrixWorld(true); let tris=0, meshes=0, bad=0, minY=1e9, maxY=-1e9, maxR=0; const v=new THREE.Vector3();
    rig.root.traverse(m=>{ if(!m.isMesh) return; meshes++; const g=m.geometry, p=g.attributes.position, n=g.attributes.normal; tris+=(g.index?g.index.count:p.count)/3;
      for(let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);
        if(!isFinite(v.x+v.y+v.z)) bad++; else { minY=Math.min(minY,v.y); maxY=Math.max(maxY,v.y); maxR=Math.max(maxR,Math.hypot(v.x,v.z)); }
        if(n&&!isFinite(n.getX(i)+n.getY(i)+n.getZ(i))) bad++; } });
    return {tris,meshes,bad,minY,maxY,maxR}; };
  // a bent pose (the angles poseRig works with), to look at the joints: arms forward and bent, one knee up
  C.bend=(rig,o)=>{ o=o||{}; const a=o.a===undefined?1:o.a; rig.shL.rotation.x=-0.8*a; rig.elL.rotation.x=1.3*a; rig.shR.rotation.x=0.7*a; rig.elR.rotation.x=1.9*a; rig.shL.rotation.z=-0.1-0.5*a*(o.out||0); rig.shR.rotation.z=0.1+0.5*a*(o.out||0);
    rig.hipL.rotation.x=0.8*a; rig.kneeL.rotation.x=-1.4*a; rig.hipR.rotation.x=-0.4*a; rig.kneeR.rotation.x=-0.15*a; rig.spine.rotation.x=-0.08*a; };
  return C;
};
