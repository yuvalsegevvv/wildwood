//@ Look presets, random looks (randomLook), save/load, buildCharacter (puts the head, body and clothes together), the hiker, rebuildHiker
/* ---------- the hiker: a customisable character ----------
   The pieces: model-parts.js (helpers), model-face.js (skull, eyes, nose, mouth, ears), model-hair.js (hair, hats), model-body.js (torso, arms, legs, hands, feet);
   this file keeps the look data and assembles them. The sliders (BODY_SLIDERS) and the recommended setups live in shared/character.js. Docs: docs/CHARACTER.md. */
const SKINS=[0xf3d3bd,0xe6b894,0xc98e66,0xa56c45,0x7a4a2c,0x4f2f1d];
const SKINS_ODD=[0x9aae82,0x7f9a86,0xb5bea4];   // zombie green, mossy grey-green and corpse pale: only in the editor's swatches, so randomLook's pool (and every random villager) is unchanged
// natural shades first (random looks pick from HAIRC.slice(0,HAIRC_NATURAL)), then the dyed / fantasy ones
const HAIRC=[0x1d1714,0x3b2619,0x6a4428,0x9a4a24,0xd8b56e,0xb9b3aa,0x5e2418,0xc47a45,0xeadcb4,0xeeece6,0x2f6f73,0x3a5fa0,0x6b3f8f,0xc25a86,0x9c2a2a];
const HAIRC_NATURAL=10;   // black, dark brown, brown, red, blonde, grey, auburn, copper, platinum, white
const EYEC=[0x4a2e1c,0x6b5a2e,0x3f6b3a,0x3b6a9e,0x7a8288];
// the editor's eye colours: the five natural ones (randomLook picks only from EYEC) and a wider range, from amber and hazel to violet, red and glowing pale
const EYEC_MORE=[0xc8822a,0x8a5a2a,0x2f8f78,0x5ec8e8,0x2a3f8f,0x7a4fbf,0xb83a8a,0xd23a3a,0xe8c04a,0x9ae0b0,0xf08ac0,0x1a1a22,0xe8e4dc];
const CLOTH=[0xb4552f,0x3d5a3a,0x2f4a6b,0xd8c9a3,0x6b3a5b,0xc9a13a,0x2b2b2e,0xe8e4dc,0x8a2f2f,0x5c7f9c];
const SHOEC=[0x4a3526,0x2b2420,0x7a5a3a,0xe8e4dc,0x2f4a6b,0x8a2f2f];
const HATC=[0x7a6142,0x3d5a3a,0x8a2f2f,0x2f4a6b,0xc9a13a,0xe8e4dc,0x2b2b2e];
// the colours offered for a garment or an outfit piece (the editor's colour rows; a signature piece is recoloured to one of them: outfit-tools.js ofTinter)
const GLOVEC=[0x5a3a22,0x2b2b2e,0xe8e4dc,0x8a2f2f,0x2f4a6b,0x3d5a3a,0xc9a13a,0x7a7e86];   // glove leathers and cloths
const TINTC=[0x2b2b2e,0x5c5c63,0xe8e4dc,0x8a2f2f,0xc23b2a,0xe59a2b,0xe3c04a,0x7a9a3c,0x3d5a3a,0x2f6f73,0x5c9fc7,0x2f4a6b,0x6b3f8f,0xc25a86,0x7a4a2c,0xd8b56e];
// every look field has a default here (old saves and other players' looks are merged onto them); the sliders start at the base model's reference setup (shared/character.js)
const LOOK_M=Object.assign({pupil:'round',eyes2:-1,capeColor:-1,capeTrim:-1,auraColor:-1,auraColor2:-1,shield:'',shieldColor:-1,shieldTrim:-1,deco1:'',deco2:'',deco3:'',decoColor1:-1,decoColor2:-1,decoColor3:-1,armor:'show',armorHat:'show',armorTop:'show',armorBottom:'show',armorShoes:'show',sex:'male',model:'base',face:'angular',eyes:EYEC[0],facial:'stubble',skin:SKINS[1],hair:'short',hairColor:HAIRC[1],ahoge:false,top:'jacket',topColor:CLOTH[0],bottom:'trousers',bottomColor:CLOTH[6],shoes:'boots',shoeColor:SHOEC[0],hat:'ranger',hatColor:HATC[0],pack:false,custom:false,cls:'warrior',faceItem:'',weaponItem:'',tintTop:-1,tintBottom:-1,tintShoes:-1,tintHat:-1,tintHair:-1,tintFace:-1,tintWeapon:-1,tintGloves:-1,gloves:'none',gloveColor:GLOVEC[0],aura:'',cape:'',hairGrad:'none',hairColor2:HAIRC[13],hairThird:false,hairColor3:HAIRC[12],lipColor:-1},SLIDER_DEFS,setupsOf(CHAR_MODELS.base,'male')[0].v);
const LOOK_F=Object.assign({pupil:'round',eyes2:-1,capeColor:-1,capeTrim:-1,auraColor:-1,auraColor2:-1,shield:'',shieldColor:-1,shieldTrim:-1,deco1:'',deco2:'',deco3:'',decoColor1:-1,decoColor2:-1,decoColor3:-1,armor:'show',armorHat:'show',armorTop:'show',armorBottom:'show',armorShoes:'show',sex:'female',model:'base',face:'oval',eyes:EYEC[2],facial:'none',skin:SKINS[1],hair:'ponytail',hairColor:HAIRC[3],ahoge:false,top:'flannel',topColor:CLOTH[8],bottom:'trousers',bottomColor:CLOTH[9],shoes:'boots',shoeColor:SHOEC[0],hat:'none',hatColor:HATC[1],pack:false,custom:false,cls:'warrior',faceItem:'',weaponItem:'',tintTop:-1,tintBottom:-1,tintShoes:-1,tintHat:-1,tintHair:-1,tintFace:-1,tintWeapon:-1,tintGloves:-1,gloves:'none',gloveColor:GLOVEC[0],aura:'',cape:'',hairGrad:'none',hairColor2:HAIRC[13],hairThird:false,hairColor3:HAIRC[12],lipColor:-1},SLIDER_DEFS,setupsOf(CHAR_MODELS.base,'female')[0].v);
// a character model that breaks the rules (no recommended setups, a setup outside its ranges) is reported once at load; tools/character-smoke.js fails on it
for(const m of Object.values(CHAR_MODELS)){ const bad=validateCharModel(m); if(bad.length&&typeof console!=='undefined') console.warn('character model "'+m.id+'": '+bad.join('; ')); }
// a look (from a save, the server or another player) with every missing field filled in: the sex's defaults, and any slider it does not carry at the neutral body
// (lookForNet leaves neutral sliders out, and an old save has none; only a brand-new hiker starts on the reference setup)
const fullLook=l=>ofMigrate(l,cosMigrateLook(Object.assign({},l&&l.sex==='female'?LOOK_F:LOOK_M,SLIDER_DEFS,l||{})));   // (ofMigrate: a look saved before outfit pieces existed)
// the old backpack switch (look.pack) is now the free cape 'pack' (a villager's pack stays the switch: see buildTorso)
function cosMigrateLook(L){ if(L.pack===true&&!L.cape&&L.custom){ L.cape='pack'; L.pack=false; } return L; }
// the model's scale for a look: the Height slider (clamped: a remote look is not sanitized) and the female body's 0.95
const lookScale=l=>sliderVal(l,'height')*(l&&l.sex==='female'?0.95:1);
function loadLook(){
  try{ const s=JSON.parse(localStorage.getItem('wildwood-look-v1')||'null'); if(s && (s.sex==='male'||s.sex==='female')) return fullLook(s); }catch(_){}
  return Object.assign({},LOOK_M);
}
/* A random look. rng: a function giving 0..1; villagers pass a seeded one so every player sees the same villagers, and the draw order of the lines
   below must not change (it would change every random villager): everything new draws AFTER them, and a villager's new sliders come from a hash of the look,
   not from rng. o.villager: the plainer pools of a villager (no shorts, mostly no hat, no backpack); otherwise the editor's "Surprise me", which starts from one of
   the base model's recommended setups. o.base: fields that override the result (a named NPC's fixed sex, colours...). */
function randomLook(rng,o){
  o=o||{}; const v=!!o.villager, rp=a=>a[Math.floor(rng()*a.length)], sex=(o.base&&o.base.sex)||(rng()<0.5?'male':'female'), f=sex==='female';
  const L={sex,height:+(0.92+rng()*0.14).toFixed(2),build:+(0.88+rng()*0.3).toFixed(2),skin:rp(SKINS),face:rp(['round','oval','angular']),eyes:rp(EYEC),
    facial:f?'none':rp(['none','stubble','stubble','mustache','beard']),
    hair:f?rp(['long','ponytail','bun','bob','curly','short']):rp(v?['short','buzz','curly','bald','short']:['short','buzz','curly','bald','short','bob']),
    hairColor:rp(HAIRC.slice(0,HAIRC_NATURAL)),top:rp(['tshirt','flannel','jacket','hoodie']),topColor:rp(CLOTH),
    bottom:f?rp(v?['trousers','skirt','skirt']:['trousers','shorts','skirt']):v?'trousers':rp(['trousers','trousers','shorts']),bottomColor:rp(CLOTH),
    shoes:rp(['boots','boots','sneakers']),shoeColor:rp(SHOEC),hat:rp(v?['none','none','none','beanie','cap']:['none','none','ranger','beanie','cap']),hatColor:rp(HATC),
    pack:v?false:rng()<0.25,
    chest:f?+(0.7+rng()*0.65).toFixed(2):1};   // women vary 0.7-1.35 (the model allows 0.5-1.6)
  if(v){   // a villager's own proportions: small steps inside the model's recommended ranges, from a hash of what was drawn above (no rng draws)
    const hr=mulberry32(Math.floor(L.height*1000)*7919+Math.floor(L.build*1000)*104729+(L.skin%99991)+(L.hairColor%7919)*31+(f?5:0)), jit=(a,b)=>+(a+(b-a)*hr()).toFixed(2);
    Object.assign(L,{legs:jit(0.98,1.1),shoulders:jit(0.94,1.06),waist:jit(0.9,1.04),hips:jit(0.94,1.1),arms:jit(0.9,1.1),thighs:jit(0.92,1.12),neck:jit(0.92,1.06),head:jit(0.98,1.06),eyeSize:jit(0.98,1.2),eyeTilt:jit(-0.1,0.4),brow:jit(-0.2,0.35),smile:jit(0,0.45),noseSize:jit(0.85,1.05),lips:jit(0.9,1.2),earSize:jit(0.92,1.15)});
  } else {
    const st=rp(setupsOf(CHAR_MODELS.base,sex)); Object.assign(L,st.v);   // one of the recommended setups, then a little individual variation
    for(const k of ['legs','shoulders','arms','thighs','eyeSize','eyeTilt','smile','head','chin']){ const s=SLIDER_BY_KEY[k], r=sliderRange(CHAR_MODELS.base,k), cur=L[k]===undefined?s.def:L[k]; L[k]=+clamp(cur+(rng()-0.5)*(r[1]-r[0])*0.2,r[0],r[1]).toFixed(2); }
    if(rng()<0.35) L.hair=rp(f?['twintail','braid','long','ponytail']:['spiky','messy','short']);
    L.ahoge=rng()<0.08;
  }
  return Object.assign(L,o.base||{});
}
// a logged-in account's own look (sent in welcome) replaces this browser's; not written to this browser's save
function adoptLook(l){
  if(!l||typeof l!=='object'||(l.sex!=='male'&&l.sex!=='female')) return;
  LOOK=fullLook(l); LOOK_SAVED=Object.assign({},LOOK); rebuildHiker();
}
function saveLookLocal(){ try{ localStorage.setItem('wildwood-look-v1',JSON.stringify(LOOK)); }catch(_){} }
/* Saving a look. While the editor shows a look that wears a crafted piece you have not made (a try-on, cosLocked in shared/cospieces.js) nothing is saved or sent: LOOK_SAVED stays the
   last complete look, the one the world sees, and the editor reverts to it on request (ui/character-editor.js edRevert). */
function saveLook(){ if(typeof edTrying==='function'&&edTrying()) return; LOOK_SAVED=Object.assign({},LOOK); saveLookLocal(); if(typeof netLookChanged==='function') netLookChanged(); }
let LOOK=loadLook(), LOOK_SAVED=Object.assign({},LOOK);

// how finely a character is drawn (the detail factor q: segment counts scale with it). The hiker is seen close, in the editor, so it gets the most; other players
// and villagers cost about what they did before the rework (about 24k and 16k triangles on a desktop, 1,000 instances in a village are never all in view); phones and light mode drop all of them.
function charDetail(kind){ const lite=typeof LITE!=='undefined'&&LITE, low=typeof LOW!=='undefined'&&LOW;
  return kind==='hero'?(lite?0.4:low?0.62:1.1):kind==='remote'?(lite?0.3:low?0.45:0.65):(lite?0.3:low?0.38:0.5); }

const anchorAt=(parent,name,x,y,z)=>{ const a=new THREE.Object3D(); a.name='a:'+name; a.position.set(x,y,z); parent.add(a); return a; };
/* buildCharacter(L, {q}): the rig {root, hips, spine, head, shL, elL, shR, elR, hipL, kneeL, hipR, kneeR, hipY} that poseRig animates, plus, for outfits:
   rig.dims (the measurements: shoulder / hip joint offsets, limb lengths, head scale...), rig.sliders (the clamped slider values) and rig.anchors (named empty
   nodes on the bones: head top, face, neck, chest, back, waist, hips, shoulders, wrists, ankles). q is the detail factor (see charDetail). */
function buildCharacter(L,opt){
  L=modestLook(L);   // the child-safe setting: bare crafted pieces become plain ones (character/modest.js)
  const PC=ofPieces(L), worn=Object.keys(PC).length>0;   // the slots that wear an item of a signature outfit (outfit-tools.js "mixing the pieces"): each one replaces the base item of that slot
  if(worn){ const o={}; if(PC.top){ o.top='outfit'; o.pack=false; if(L.cape==='pack') o.cape=''; } if(PC.bottom){ o.bottom='outfit'; o.bottomStyle=''; } if(PC.shoes) o.shoes='outfit'; if(PC.hat) o.hat='outfit'; if(PC.glove) o.gloves='outfit'; if(PC.hair){ o.hair='bald'; o.ahoge=false; } if(PC.face) o.facial='none'; L=Object.assign({},L,o); }
  const q=(opt&&opt.q)||1, sg=n=>Math.max(5,Math.round(n*q)), S=lookSliders(L), fem=L.sex==='female';
  const skin=new THREE.Color(L.skin).lerp(new THREE.Color(S.undertone>0?0xe39a5c:0xb8a0c8),0.16*Math.abs(S.undertone)), skinPaint=c=>c.copy(X.skin), hairCol=new THREE.Color(L.hairColor), {topPaint,botPaint}=clothPaints(L);
  const D=charDims(L,S,fem,faceShape(L)), X={L,S,fem,sg,q,skin,skinPaint,hairCol,topPaint,botPaint,D,kit:null,glove:null};
  if(worn){ X.kit=ofBuild(X,D,PC); const kh=X.kit.sl.hair, th=ofTintOf(L,'hair'); if(kh&&th>=0) X.hairCol=new THREE.Color(th); else if(kh&&kh.hairColor!==undefined) X.hairCol=new THREE.Color(kh.hairColor); 
    const kfs=X.kit.sl.face; if(kfs&&kfs.skin!==undefined) X.skin=new THREE.Color(kfs.skin).lerp(new THREE.Color(S.undertone>0?0xe39a5c:0xb8a0c8),0.16*Math.abs(S.undertone)); }   // a face item with its own skin tone (Ogden's drowned green-grey) overrides the wearer's
  X.glove=glPlan(X);   // the gloves (model-gloves.js): read by buildArm and buildFingers   // the hair item's own colour (the eyebrows and lashes follow it)
  const root=new THREE.Group(), hips=new THREE.Group(); hips.name='hips'; hips.position.y=D.hipY; root.add(hips);
  const spine=new THREE.Group(); spine.name='spine'; hips.add(spine);

  const torso=new THREE.Mesh(merge(buildTorso(X,D)),matChar); torso.castShadow=true; spine.add(torso);
  if(X.kit){ const ex=ofRun(X,'hips'); if(ex.length){ const hm=new THREE.Mesh(merge(ex),matChar); hm.castShadow=true; hips.add(hm); } }   // skirts and sashes, in the hips' frame
  if(L.bottom==='skirt'||L.bottom==='kilt'||L.bottom==='pleated'||gmxSkirtKind(L.bottom)){ const skirt=new THREE.Mesh(gmSkirt(X,D,L.bottom),matFlat); skirt.castShadow=true; hips.add(skirt); }   // a flared skirt, a tartan kilt or a pleated skirt (model-garments.js)
  { const ex=gmHips(X,D); if(ex.length){ const gm=new THREE.Mesh(merge(ex),matChar); gm.castShadow=true; hips.add(gm); } }   // belt, buckle, sporran, the tunic's flare
  /* head: the anime proportions come from its scale (about 5.9 heads tall: the skull is HEAD_TALL = 10% taller than a ball) */
  const head=new THREE.Group(); head.name='head'; head.position.y=D.headY; spine.add(head);
  const face=buildFace(X), hairParts=buildHair(X,face);
  const headMesh=new THREE.Mesh(merge(face.parts.concat(hairParts)),matChar); headMesh.castShadow=true; head.add(headMesh);
  head.scale.setScalar(D.hs);
  /* arms and legs */
  const [shL,elL]=buildArm(X,D,-1), [shR,elR]=buildArm(X,D,1); spine.add(shL,shR);
  if(L.top==='plate'){ const pm=new THREE.Mesh(merge([-1,1].map(sd=>pc(csph(0.078*D.lr,sg(16),sg(10)).scale(1.25,0.66,1.1).translate(sd*(D.shX+0.008),D.shY+0.03*D.TK,0),(x,y,z,c)=>c.set(L.topColor).multiplyScalar(0.9+clamp(y-D.shY)*4)))),matChar); pm.castShadow=true; spine.add(pm); }
  const [hipL,kneeL]=buildLeg(X,D,-1), [hipR,kneeR]=buildLeg(X,D,1); hips.add(hipL,hipR);

  const A={}, a=(name,parent,x,y,z)=>{ A[name]=anchorAt(parent,name,x,y,z); };
  a('headTop',head,0,0.11*face.fs[1],0); a('face',head,0,0,-0.1); a('neck',spine,0,0.6*D.TK,0); a('chest',spine,0,0.3*D.TK,-0.1*D.B); a('back',spine,0,0.3*D.TK,0.1*D.B); a('waist',hips,0,0.02,0);
  a('hipL',hips,-D.hx,0,0); a('hipR',hips,D.hx,0,0); a('shoulderL',spine,-D.shX,D.shY,0); a('shoulderR',spine,D.shX,D.shY,0);
  a('wristL',elL,0,-D.wrist,0); a('wristR',elR,0,-D.wrist,0); a('ankleL',kneeL,0,-D.shin,0); a('ankleR',kneeR,0,-D.shin,0);
  const rig={root,hips,spine,head,hipY:D.hipY,shL,elL,shR,elR,hipL,kneeL,hipR,kneeR,dims:Object.assign({},D,{faceScale:face.fs}),sliders:S,anchors:A,kit:X.kit,dress:X.kit?ofDress(X):null,anims:null};
  if(X.kit){ rig.anims=[];   // loose parts and motion that the merged meshes cannot carry (a ring that turns, a charm that swings): a kit builds them once per slot it owns, `has(slot)` is true for that slot only, and the meshes it added are tinted with that slot's colour
    for(const k of X.kit.kits) if(k.extras) for(const slot of ['top','bottom','shoes','hat','hair','glove']){ if(X.kit.sl[slot]!==k) continue;
      const f=X.kit.tr[slot], before=new Set(); if(f) rig.root.traverse(o=>before.add(o));
      k.extras(rig,X,s=>s===slot);
      if(f) rig.root.traverse(o=>{ if(o.isMesh&&!before.has(o)) ofTintGeo(o.geometry,f); }); }
    if(!rig.anims.length) rig.anims=null; }
  if(X.kit&&!X.L.aura) for(const k of X.kit.kits) if(k.aura&&X.kit.sl.top===k) cosBuildAura(rig,X,k.aura);   // a set's own aura (kit.aura, same fields as COS_AURAS), unless the wearer chose one
  shieldDress(rig,X);   // the optional shield of look.shield on the left forearm (character/model-shields.js)
  decoDress(rig,X);   // the up to three small decorations of look.deco1..3 (character/model-decos.js)
  cosDress(rig,X);   // cosmetics: the cape and the aura of look.cape / look.aura (character/cosmetics.js)
  return rig;
}

const hiker={g:new THREE.Group(),rig:null,scale:1};
let weaponsReady=false;
scene.add(hiker.g);
function rebuildHiker(q){   // q: a detail override (the editor drags at low detail)
  if(hiker.rig){ hiker.g.remove(hiker.rig.root); hiker.rig.root.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
  hiker.rig=buildCharacter(GEAR?effectiveLook():LOOK,{q:q||charDetail('hero')});
  hiker.scale=lookScale(LOOK);
  hiker.rig.root.scale.setScalar(hiker.scale);
  hiker.g.add(hiker.rig.root);
  if(weaponsReady) attachWeapons();
}
rebuildHiker();

