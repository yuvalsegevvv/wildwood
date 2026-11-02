//@ Pictures for the character editor: every hair style, hat, garment, set, cape and aura drawn once on a small off-screen target and cached as an image
/* ---------- editor thumbnails (version 3) ----------
   cthTile(spec) returns a button-sized tile whose picture is made on demand: the character is built at low detail in a neutral setting
   (default body, plain clothes, the item in YOUR colour), framed for what the item is (head, chest, legs, feet, whole body, back), rendered into a
   WebGLRenderTarget with the game's own renderer and read back into a data URL. One job per timer tick, so the editor never stalls; a picture is made once
   per (kind, item, colour, sex, skin) and kept for the session. spec = {kind, id, ...}; kinds and what each shows are in cthLookFor.
   used by: ui/character-editor.js. test: tools/editor-smoke.js (the headless build has no GL: tiles stay empty there and the editor still works). */
const CTH_W=168, CTH_H=168, CTH_COLS=2, CTH_CACHE={}, CTH_PENDING={}, CTH_QUEUE=[];
let cthWarm=false, cthRT=null, cthScene=null, cthCam=null, cthTimer=0, cthBuf=null, cthCv=null;
// neutral clothes under the item being shown, so only the item varies: a plain grey tee and brown trousers (the item itself is never neutral)
const CTH_TEE=0x8c9096, CTH_TROUSERS=0x5a4a3c;
function cthBase(sex,skin){
  const d=sex==='female'?LOOK_F:LOOK_M;
  return Object.assign({},d,{skin,custom:true,armor:'hide',hat:'none',pack:false,gloves:'none',aura:'',cape:'',faceItem:'',weaponItem:'',model:'base',facial:'none',top:'tshirt',topColor:CTH_TEE,bottom:'trousers',bottomColor:CTH_TROUSERS,shoes:'boots',shoeColor:SHOEC[0],tintTop:-1,tintBottom:-1,tintShoes:-1,tintHat:-1,tintHair:-1,tintFace:-1,tintWeapon:-1});
}
// the look and the framing of a tile: view = head | chest | legs | feet | body | back; spin = a quarter turn so a side or back shows
function cthLookFor(sp){
  const sex=sp.sex||LOOK.sex, skin=sp.skin!==undefined?sp.skin:LOOK.skin, L=cthBase(sex,skin), id=sp.id;   // (a decoration: DECOS in character/model-decos.js)
  L.hairColor=LOOK.hairColor; L.hair=LOOK.hair; L.face=LOOK.face; L.eyes=LOOK.eyes;
  let view='body', spin=0.35;
  switch(sp.kind){
    case 'hair': L.hair=id; view='head'; break;
    case 'hat': L.hat=id; L.hatColor=sp.col!==undefined?sp.col:LOOK.hatColor; view='head'; break;
    case 'face': L.face=id; L.hair='bald'; view='head'; break;
    case 'facial': L.facial=id; view='head'; break;
    case 'faceItem': L.faceItem=id; view='head'; break;
    case 'top': L.top=id; L.topColor=sp.col!==undefined?sp.col:LOOK.topColor; view='chest'; break;
    case 'bottom': L.bottom=id; L.bottomColor=sp.col!==undefined?sp.col:LOOK.bottomColor; view='legs'; break;
    case 'shoes': L.shoes=id; L.shoeColor=sp.col!==undefined?sp.col:LOOK.shoeColor; view='feet'; break;
    case 'gloves': L.gloves=id; L.gloveColor=sp.col!==undefined?sp.col:LOOK.gloveColor; L.top='tshirt'; view='hands'; spin=0.55; break;
    case 'pupil': L.pupil=id; L.hair='bald'; L.eyes=LOOK.eyes; L.eyes2=LOOK.eyes2; view='eyes'; break;
    case 'pack': L.pack=true; view='back'; spin=Math.PI-0.35; break;
    case 'cape': L.cape=id; view='back'; spin=Math.PI-0.35; break;
    case 'aura': L.aura=id; view='body'; break;
    case 'shield': L.shield=id; view='body'; spin=-Math.PI/2+0.35; break;
    case 'strongItem': L.strongItem=id; view='body'; spin=0.5; break;   // (the silly hand items: model-silly.js; the shield's view for the weak hand)
    case 'weakItem': L.weakItem=id; view='body'; spin=-Math.PI/2+0.35; break;
    case 'deco': { L.deco1=id; if(sp.col!==undefined&&sp.col>=0) L.decoColor1=sp.col; const an=DECOS[id]?DECOS[id].anchor:'headTop'; view=an==='headTop'||an==='face'?'head':an==='neck'||an==='chest'||an==='shoulderR'?'chest':an==='back'?'back':an==='waist'||an==='hipL'||an==='hipR'?'hips':an==='wristL'||an==='wristR'?'hands':an==='ankleL'||an==='ankleR'?'feet':'body'; if(view==='back'||id==='tail') spin=Math.PI-0.35; break; }
    case 'kinEars': L.kinEars=id; L.hair='short'; L.furColor=LOOK.furColor; L.furColor2=LOOK.furColor2; view='head'; break;   // (kin: the part in your own fur colours)
    case 'kinMuzzle': L.kinMuzzle=id; L.furColor=LOOK.furColor; L.furColor2=LOOK.furColor2; view='head'; break;
    case 'kinTail': L.kinTail=id; L.furColor=LOOK.furColor; L.furColor2=LOOK.furColor2; view='hips'; spin=Math.PI-0.35; break;
    case 'sex': L.hair=sex==='female'?'ponytail':'short'; L.top='tshirt'; view='body'; break;
    case 'weapon': L.weaponItem=id; L.top='jacket'; view='body'; break;
    case 'outfit': { const M=CHAR_MODELS[id]; const sx=(M.sexes&&M.sexes[0])||sex; const B=cthBase(sx,skin); Object.assign(L,ofWear(B,id)); L.sex=sx; const st=setupsOf(M,sx)[0]; if(st) Object.assign(L,applySetup(L,st)); L.armor='hide'; view='body'; break; }
    case 'slot': Object.assign(L,sp.look); L.armor='hide'; view='body'; break;
  }
  if(sp.kind!=='outfit'&&sp.kind!=='slot'){ const st=setupsOf(CHAR_MODELS.base,sex)[0]; if(st) Object.assign(L,applySetup(L,st)); }
  return {L,view,spin};
}
// what a picture depends on: the item and its colour, the sex and skin; a hat also on the hair, a hair or beard on the hair colour, a face shape on the eyes, a weapon dressing on the weapon held
function cthKey(sp){
  const k=sp.kind, cx=[];
  if(k==='hair'||k==='face') cx.push(LOOK.face,LOOK.eyes);
  if(k==='pupil') cx.push(LOOK.eyes,LOOK.eyes2,LOOK.face);
  if(k==='hair'||k==='facial'||k==='hat') cx.push(LOOK.hairColor);
  if(k==='hat') cx.push(LOOK.hair);
  if(k.startsWith('kin')) cx.push(LOOK.furColor,LOOK.furColor2);   // kin: the fur colours show on the tile
  if(k==='weapon') cx.push(GEAR&&GEAR.eq&&GEAR.eq.weapon);
  if(k==='slot') cx.push(JSON.stringify(sp.look));
  return [k,sp.id,sp.sex||LOOK.sex,sp.skin!==undefined?sp.skin:LOOK.skin,sp.col].concat(cx).join('|');
}
function cthInit(){
  if(cthRT) return true;
  try{
    cthRT=new THREE.WebGLRenderTarget(CTH_W*CTH_COLS,CTH_H*CTH_COLS,{format:THREE.RGBAFormat,depthBuffer:true,stencilBuffer:false}); cthRT.scissorTest=true;   // (an atlas of CTH_COLS x CTH_COLS pictures: one read-back for the batch)
    cthScene=new THREE.Scene();
    cthScene.add(new THREE.HemisphereLight(0xe6eef6,0x6a6350,0.85));
    const key=new THREE.DirectionalLight(0xfff2dc,0.9); key.position.set(-1.2,2.2,-2.4); cthScene.add(key);
    const fill=new THREE.DirectionalLight(0xbcd0ff,0.3); fill.position.set(2,0.6,1.5); cthScene.add(fill);
    cthCam=new THREE.PerspectiveCamera(26,CTH_W/CTH_H,0.05,20);
    cthBuf=new Uint8Array(CTH_W*CTH_H*4*CTH_COLS*CTH_COLS); cthCv=document.createElement('canvas'); cthCv.width=CTH_W; cthCv.height=CTH_H;
    return true;
  }catch(e){ cthRT=null; return false; }
}
// build one spec's character and draw it into slot n of the atlas (nothing is read back here)
function cthDraw(sp,n){
  const {L,view,spin}=cthLookFor(sp), rig=buildCharacter(L,{q:view==='head'||view==='eyes'?0.8:0.35});   // (a 168 px picture of a body needs no fine tessellation: 0.35 looks the same as 0.5 and builds a third faster)
  if((sp.kind==='aura'||sp.kind==='deco')&&rig.anims) for(let i=0;i<40;i++) for(const f of rig.anims){ try{ f(1+i*0.05,0.05,0); }catch(_){} }   // run the motion first: an aura's particles rest out of sight until its first frame
  const root=rig.root; root.rotation.y=spin; cthScene.add(root);
  if(sp.kind==='weapon'&&typeof weaponsOn==='function'){ try{ weaponsOn(rig,GEAR&&GEAR.eq&&GEAR.eq.weapon||'sword1',L.build); }catch(_){} }
  const H=rig.hipY, D=rig.dims;
  // [centre height, half the height shown, distance factor]
  const F={head:[H+D.headY,0.17*D.hs+0.03,1],chest:[H+0.25*D.TK,0.34,1],legs:[H*0.62,0.5,1],feet:[0.1,0.2,1],body:[H+0.33,0.98,1],hands:[H-0.15,0.3,1],eyes:[H+D.headY+0.004,0.052*D.hs+0.012,1],back:[H+0.3,0.62,1],hips:[H+0.02,0.42,1]}[view];
  const half=F[1]*(sp.kind==='deco'?0.62:1), dist=half/Math.tan(cthCam.fov*Math.PI/360)*1.0;
  cthCam.position.set(0,F[0],-dist); cthCam.lookAt(0,F[0],0); cthCam.updateMatrixWorld();
  const x=(n%CTH_COLS)*CTH_W, y=Math.floor(n/CTH_COLS)*CTH_H;
  cthRT.viewport.set(x,y,CTH_W,CTH_H); cthRT.scissor.set(x,y,CTH_W,CTH_H); renderer.setRenderTarget(cthRT);   // (r128 reads the target's viewport and scissor when it is set)
  renderer.clear(); renderer.render(cthScene,cthCam);
  cthScene.remove(root); root.traverse(o=>{ if(o.geometry) o.geometry.dispose(); });
}
// make a batch of pictures (one read-back for all of them); done(job,url) gets a blob URL of each PNG, '' where one failed. false: the target cannot be made.
function cthRenderBatch(next,done){
  if(!cthInit()) return false;
  const jobs=[], t0=performance.now();
  const old=renderer.getRenderTarget(), oc=new THREE.Color(), oa=renderer.getClearAlpha(), ot=renderer.shadowMap.enabled, ok=[];
  renderer.getClearColor(oc); renderer.shadowMap.enabled=false; renderer.setClearColor(0x000000,0);
  try{
    while(jobs.length<CTH_COLS*CTH_COLS&&(!jobs.length||performance.now()-t0<40)){ const j=next(); if(!j) break; const n=jobs.push(j)-1; try{ cthDraw(j.sp,n); ok[n]=true; }catch(e){ ok[n]=false; } }   // (40 ms of building at most, so the first pictures appear soon)
    if(!jobs.length) return true;
    renderer.readRenderTargetPixels(cthRT,0,0,CTH_W*CTH_COLS,CTH_H*CTH_COLS,cthBuf);
  }finally{ renderer.setRenderTarget(old); renderer.setClearColor(oc,oa); renderer.shadowMap.enabled=ot; }
  const AW=CTH_W*CTH_COLS*4, ctx=cthCv.getContext('2d'), img=ctx.createImageData(CTH_W,CTH_H), blobs=typeof cthCv.toBlob==='function'&&window.URL&&URL.createObjectURL;
  for(let n=0;n<jobs.length;n++){
    if(!ok[n]){ done(jobs[n],''); continue; }
    const x0=(n%CTH_COLS)*CTH_W*4, y0=Math.floor(n/CTH_COLS)*CTH_H;
    for(let y=0;y<CTH_H;y++){ const s=(y0+CTH_H-1-y)*AW+x0; img.data.set(cthBuf.subarray(s,s+CTH_W*4),y*CTH_W*4); }
    ctx.putImageData(img,0,0);
    // encoding the PNG off the main thread: toBlob takes its snapshot now, so the canvas is free for the next picture at once (toDataURL held the page for several ms a picture)
    if(blobs){ const j=jobs[n]; cthCv.toBlob(b=>done(j,b?URL.createObjectURL(b):''),'image/png'); }
    else done(jobs[n],cthCv.toDataURL('image/png'));
  }
  return true;
}
// which waiting picture to make next: one a viewer can see (its tile is on screen), then one that exists but is out of sight (another tab, scrolled away), never one whose tiles are gone
// (the editor rebuilds its tiles on every click; a FIFO queue used to make the old tab's pictures first, so a quick click through the tabs waited for all of them)
function cthPick(){
  let bi=-1, bp=9;
  for(let i=0;i<CTH_QUEUE.length&&bp>0;i++){
    const cbs=CTH_PENDING[CTH_QUEUE[i].key]||[]; let p=9;
    for(const f of cbs){ const e=f.pic; if(!e){ p=0; break; } if(!e.isConnected) continue; p=Math.min(p,e._vis===false?1:0); }
    if(p<bp){ bp=p; bi=i; }
  }
  // the dead ones in front of the pick (all their tiles gone) are dropped; a tile made later asks again
  const dead=[]; for(let i=0;i<CTH_QUEUE.length;i++){ if(i===bi) continue; const cbs=CTH_PENDING[CTH_QUEUE[i].key]||[]; if(!cbs.some(f=>!f.pic||f.pic.isConnected)) dead.push(i); }
  for(let k=dead.length-1;k>=0;k--){ const j=CTH_QUEUE.splice(dead[k],1)[0]; delete CTH_PENDING[j.key]; if(dead[k]<bi) bi--; }
  return bi<0?null:CTH_QUEUE.splice(bi,1)[0];
}
function cthDone(job,url){   // (job is {key,sp})
  CTH_CACHE[job.key]=url; const cbs=CTH_PENDING[job.key]||[]; delete CTH_PENDING[job.key];
  try{ for(const f of cbs) f(url); }catch(e){}   // a tile that went away must never stop the queue: the last tiles of a long list (the newest signature outfits) stayed blank when one callback threw
}
// a batch: the next pictures, up to CTH_COLS squared or 40 ms of building (building a character is the cost; the read-back is shared)
function cthPump(){
  cthTimer=0; let ok=false, n=0;
  try{ ok=cthRenderBatch(()=>{ n++; return cthPick(); },cthDone); }catch(e){ ok=false; }
  if(!ok){ for(let j=cthPick();j;j=cthPick()) cthDone(j,''); }   // no target (no GL): every waiting tile shows its plain fallback
  if(CTH_QUEUE.length) cthTimer=setTimeout(cthPump,n?0:50);
}
function cthGet(sp,cb,pic){
  if(pic) cb.pic=pic;
  const key=cthKey(sp); if(CTH_CACHE[key]!==undefined){ cb(CTH_CACHE[key]); return; }
  if(CTH_PENDING[key]){ CTH_PENDING[key].push(cb); return; }
  CTH_PENDING[key]=[cb]; CTH_QUEUE.push({key,sp}); if(!cthTimer) cthTimer=setTimeout(cthPump,0);
}
// a tile's visibility, kept by one observer (it accounts for scrolling and clipping); without the API every tile counts as seen
// the editor's first screens are drawn ahead of time (edWarm, ui/character-editor.js): their tiles ask with this stand-in, which is alive but never seen, so a tile the viewer can see always goes first
const CTH_WARM_PIC={isConnected:true,_vis:false};
const cthSeen=typeof IntersectionObserver==='function'?new IntersectionObserver(es=>{ for(const e of es){ e.target._vis=e.isIntersecting; if(!e.target.isConnected) cthSeen.unobserve(e.target); } }):null;
// a tile has a picture (drawn here) or, for a "nothing" choice, a crossed circle; the caption is optional and small
function cthTile(sp,o){
  o=o||{};
  const b=document.createElement('button'); b.className='ctile'+(o.sig?' sig':''); b.setAttribute('aria-pressed',!!o.on);
  if(o.title){ b.title=o.title; b.setAttribute('aria-label',o.title); }
  const pic=document.createElement('span'); pic.className='ctile-pic';
  if(sp===null){ pic.classList.add('none'); }
  else { pic.classList.add('wait'); const im=document.createElement('img'); im.alt=''; im.draggable=false; pic.append(im);
    if(cthSeen&&!cthWarm){ pic._vis=false; cthSeen.observe(pic); }
    cthGet(sp,url=>{ if(url){ im.src=url; pic.classList.remove('wait'); } else { pic.classList.remove('wait'); pic.classList.add('nopic'); } },cthWarm?CTH_WARM_PIC:pic); }
  b.append(pic);
  if(o.cap){ const c=document.createElement('span'); c.className='ctile-cap'; c.textContent=o.cap; b.append(c); }
  return b;
}
