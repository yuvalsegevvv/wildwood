//@ Helpers for the signature outfits (game/outfits/*.js): the torso's size at a height, flat ribbons, lofts over an arc, rings round a path; and the mixing of their pieces (slots, which kit owns a hook)
/* ---------- outfit helpers (docs/CHARACTER.md section 9) ----------
   Every outfit part is a painted geometry (pc / solid) in the frame of the node it hangs from. These build the shapes a garment needs that the character helpers (limb, loftRings,
   sweepTube) do not: a flat cloth strip, a panel that covers only part of the body's circumference, a ring round a curve. */

// the torso's half-width and half-depth (metres, in the spine's frame) at design height yd (0 = the hips' line, 0.55 = the neck's base), with the sliders applied: where cloth lies on the body
function torsoSize(X,D,yd){
  const {S,fem}=X, B=D.B, r=profR(fem?TORSO_F:TORSO_M,yd), up=faceSm(0.22,0.4,yd), gw=faceG(yd,fem?0.215:0.15,0.11), gh=faceG(yd,-0.03,0.1), belly=faceG(yd,0.1,0.13)*(B-1)*1.4;
  const rz=r*(fem?0.66:0.62)*B*(1+(S.waist-1)*0.7*gw+(S.hips-1)*0.5*gh+(S.shoulders-1)*0.2*up);
  // rz is the front (the belly and the stomach pushed out, a woman's bust); rzBack the back (a third of the belly, the shoulder blades, the glutes): cloth on the back must clear these or the body shows through
  return {rx:r*B*(fem?1:1.04)*(1+(S.shoulders-1)*up+(S.waist-1)*gw+(S.hips-1)*gh+chestRibs(S.chest)*faceG(yd,0.32,0.1)), rz:rz*(1+belly)+0.008*faceG(yd,0.1,0.08)+(fem?0.034*D.lr*chestEff(S.chest)*faceG(yd,0.315-0.012*(chestEff(S.chest)-1),0.06):0.012*B*Math.min(Math.max(S.chest-1,0),1.2)*faceG(yd,0.34,0.07)),   // (a woman's front includes the bust)
    rzBack:rz*(1+belly*0.3)+0.012*B*faceG(yd,0.37,0.07)+(fem?0.034:0.022)*B*faceG(yd,0,0.055)};
}
/* A flat ribbon (sash, pennant, strap, feather, tail of a bow) along a smooth curve through pts ([x,y,z]); width: a number or a function of 0..1 along it; both faces are drawn
   (two thin sheets back to back), so it shows from either side. o.up = the direction the flat face looks at (default -z, the front); o.th = its thickness; o.seg = samples. */
function ofRibbon(pts,width,o){
  o=o||{}; const V=pts.map(p=>p.isVector3?p:new THREE.Vector3(p[0],p[1],p[2])), cv=new THREE.CatmullRomCurve3(V,false,'catmullrom',0.5), seg=o.seg||Math.max(6,V.length*5), th=(o.th||0.0025)/2;
  const wf=typeof width==='function'?width:()=>width, up=o.up?new THREE.Vector3(o.up[0],o.up[1],o.up[2]):new THREE.Vector3(0,0,-1);
  const pos=new Float32Array((seg+1)*4*3), nor=new Float32Array((seg+1)*4*3), idx=[], n=new THREE.Vector3(), b=new THREE.Vector3();
  for(let i=0;i<=seg;i++){ const u=i/seg, p=cv.getPoint(u), t=cv.getTangent(u).normalize(), w=wf(u)/2;
    n.copy(up).addScaledVector(t,-up.dot(t)); if(n.lengthSq()<1e-6) n.set(1,0,0).addScaledVector(t,-t.x); n.normalize(); b.crossVectors(t,n).normalize();
    const put=(k,sx,sn)=>{ const o3=(i*4+k)*3; pos[o3]=p.x+b.x*w*sx+n.x*th*sn; pos[o3+1]=p.y+b.y*w*sx+n.y*th*sn; pos[o3+2]=p.z+b.z*w*sx+n.z*th*sn; nor[o3]=n.x*sn; nor[o3+1]=n.y*sn; nor[o3+2]=n.z*sn; };
    put(0,1,1); put(1,-1,1); put(2,1,-1); put(3,-1,-1); }
  for(let i=0;i<seg;i++){ const a=i*4, c=a+4;
    // the sheet facing +n (vertices 0, 1) and the sheet facing -n (2, 3): the winding is chosen from the first segment's geometry so that each one's front side is the side its normal points to
    idx.push(a,c,a+1, a+1,c,c+1,  a+2,a+3,c+2, a+3,c+3,c+2); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.BufferAttribute(nor,3)); g.setIndex(idx);
  // check the winding of the first +n triangle against its normal and flip every triangle if it is the wrong way round (the curve's handedness decides it)
  { const p=g.attributes.position, ix=g.index.array, A=new THREE.Vector3().fromBufferAttribute(p,ix[0]), B2=new THREE.Vector3().fromBufferAttribute(p,ix[1]), C=new THREE.Vector3().fromBufferAttribute(p,ix[2]);
    const fn=new THREE.Vector3().crossVectors(B2.sub(A),C.sub(A)); if(fn.dot(new THREE.Vector3(nor[0],nor[1],nor[2]))<0) for(let i=0;i<ix.length;i+=3){ const t=ix[i+1]; ix[i+1]=ix[i+2]; ix[i+2]=t; } }
  return g;
}
/* loftRings over an arc: the same rings [{y, rx, rz, zc}] but only from angle a0 to a1 (a = 0 is the back, PI the front, +x at PI/2): a tabard's front panel is the arc PI +- 0.9, a cape the back's.
   An open strip, smooth normals; it is one-sided like loftRings, so it shows from outside only (the body is behind it). */
function ofLoft(rings,seg,a0,a1){
  const n=rings.length, pos=new Float32Array(n*(seg+1)*3), idx=[];
  for(let i=0;i<n;i++){ const r=rings[i]; for(let j=0;j<=seg;j++){ const a=a0+(a1-a0)*j/seg, o=(i*(seg+1)+j)*3; pos[o]=Math.max(1e-4,r.rx)*Math.sin(a); pos[o+1]=r.y; pos[o+2]=Math.max(1e-4,r.rz)*Math.cos(a)+(r.zc||0); } }
  for(let i=0;i<n-1;i++) for(let j=0;j<seg;j++){ const a=i*(seg+1)+j, b=a+1, c=a+seg+1, d=c+1; idx.push(a,c,b,b,c,d); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setIndex(idx); return smoothN(g);
}
/* A patch of fine grid on a surface, for an emblem, a badge or a buckle whose edges must be crisp (vertex colours blur over one cell, and the body's own mesh is coarse): the rectangle
   x0..x1, y0..y1 in nx x ny cells, each vertex at (x, y, surf(x, y)); front: true for a patch that faces -z. Paint it with pc / paint; put it a millimetre off the surface in surf. */
function ofPatch(x0,x1,y0,y1,nx,ny,surf,front){
  const pos=new Float32Array((nx+1)*(ny+1)*3), idx=[];
  for(let j=0;j<=ny;j++) for(let i=0;i<=nx;i++){ const x=lerp(x0,x1,i/nx), y=lerp(y0,y1,j/ny), o=(j*(nx+1)+i)*3; pos[o]=x; pos[o+1]=y; pos[o+2]=surf(x,y); }
  for(let j=0;j<ny;j++) for(let i=0;i<nx;i++){ const a=j*(nx+1)+i, b=a+1, c=a+nx+1, d=c+1; if(front) idx.push(a,c,b,b,c,d); else idx.push(a,b,c,b,d,c); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setIndex(idx); return smoothN(g);
}
// a torus (R = the ring's radius, r = the tube's) centred on point p with its axis along direction t: a cord, a band or a ring round a braid, a limb, a handle
function ofRingAt(p,t,R,r,seg){
  const g=new THREE.TorusGeometry(R,r,seg||6,seg?seg*3:18), q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(t[0],t[1],t[2]).normalize());
  g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q)); return g.translate(p[0],p[1],p[2]);
}
// a colour from a hex, cached (a paint function that runs once per vertex must not allocate)
const _ofC={}; const ofCol=h=>_ofC[h]||(_ofC[h]=new THREE.Color(h));

/* ---------- mixing the pieces of the outfits (docs/CHARACTER.md section 9, "Pieces") ----------
   An outfit is seven items, one per slot, and any slot may wear any outfit's item. A look names them in its own fields (a base value like 'tshirt' or an outfit id like 'tansy'):
   top, bottom, shoes, hat, hair and the two new ones, faceItem (the face marks, eye style and facial hair / glasses) and weaponItem (the weapon dressing). buildCharacter builds the kit of every outfit
   that supplies at least one slot (X.kit = {sl: kit per slot or null, kits: the distinct kits}) and each consumer asks for its slot's kit (X.kit.sl.top ...) or runs a hook through ofRun / ofShin below.
   Which kit owns what: the paint of the 'upperArm' / 'foreArm' is the top's, 'thigh' the bottom's, 'foot' the shoes', 'torso' is cut at OF_WAIST (above: top, below: bottom), 'shin' at the shoes' boot top (kit.bootTop);
   the geometry hooks torso / shoulder / forearm are the top's, hips / thigh the bottom's (a kit may say otherwise: kit.own = {thigh:'top'}), shin is split by ofShin. Used by model*.js; tested by tools/outfit-smoke.js (mix). */
const OF_SLOTS=['top','bottom','shoes','hat','hair','face','weapon','glove'];
const OF_FIELD={top:'top',bottom:'bottom',shoes:'shoes',hat:'hat',hair:'hair',face:'faceItem',weapon:'weaponItem',glove:'gloves'};   // the look field of each slot
const OF_HOOK_SLOT={torso:'top',shoulder:'top',forearm:'top',hips:'bottom',thigh:'bottom',glove:'glove'};
const OF_WAIST=0.03;   // the design height where the top ends and the bottoms begin on the torso (the base T-shirt's hem)
// the slots of a look that wear an outfit's item: {slot: outfit id}. OUTFITS has no prototype, so a remote look's 'constructor' finds nothing
// (a set wears a glove only when it has one: CHAR_MODELS.<id>.items.glove; a look wearing a set's id in `gloves` for a set without gloves is bare-handed)
function ofPieces(L){ const p={}; for(const s of OF_SLOTS){ const v=L[OF_FIELD[s]]; if(typeof v==='string'&&OUTFITS[v]&&(s!=='glove'||ofHasGlove(v))) p[s]=v; } return p; }
const ofHasGlove=id=>{ const m=CHAR_MODELS[id]; return !!(m&&m.items&&m.items.glove); };
// one kit per distinct outfit worn (a kit is built for this body: X, D)
function ofBuild(X,D,pieces){ const built={}, sl={}, tr={}; for(const s of OF_SLOTS) sl[s]=null; for(const s in pieces){ const id=pieces[s]; sl[s]=built[id]||(built[id]=OUTFITS[id](X,D)); }
  // recolouring: a slot with a tint gets a transform (see ofTinter) from the piece's main colour to the player's colour
  for(const s of OF_SLOTS){ const k=sl[s], T=ofTintOf(X.L,s); if(!k||T<0||s==='face') continue;
    const M=s==='hair'?k.hairColor:s==='weapon'?(k.dress&&k.dress.accent):(k.main&&k.main[s]); if(M!==undefined) tr[s]=ofTinter(M,T); }
  // the other colours of a piece: a vertex colour near one of the piece's palette colours follows that colour's tint (a colour with none follows the main one, as before)
  for(const s of ['top','bottom','shoes','hat','hair','glove']){ const k=sl[s]; if(!k) continue; const id=pieces[s], P=ofPalOf(id,s), Ts=[ofTintOf(X.L,s)]; let any=false;
    for(let i=1;i<P.length;i++){ Ts.push(ofTintX(X.L,s,i)); if(Ts[i]>=0) any=true; }
    if(!any) continue;
    const M0=s==='hair'?k.hairColor:k.main&&k.main[s]; if(M0!==undefined) P[0]=M0; if(!P.length) continue;
    const tin=P.map((m,i)=>Ts[i]>=0?ofTinter(m,Ts[i]):null), pc=P.map(ofHsl), h={h:0,s:0,l:0};
    tr[s]=c=>{ c.getHSL(h); let bi=-1, bd=0.34; for(let i=0;i<pc.length;i++){ const d=ofHsd(h,pc[i]); if(d<bd){ bd=d; bi=i; } }
      const f=bi>=0&&tin[bi]?tin[bi]:tin[0]; if(f) f(c); }; }
  return {sl,kits:Object.values(built),tr,eye:ofTintOf(X.L,'face')}; }
// the geometry that a hook (torso, shoulder, forearm, hips, thigh) adds, from the kits whose piece owns that hook
function ofRun(X,hook,sd){ const out=[]; for(const k of X.kit.kits){ if(!k[hook]) continue; const slot=(k.own&&k.own[hook])||OF_HOOK_SLOT[hook]; if(X.kit.sl[slot]!==k) continue; const ex=k[hook](sd); if(ex&&ex.length) out.push(...ofTintGeos(X,slot,ex)); } return out; }
// the shin hook holds both the bottoms' pieces (straps, wraps, a knee guard) and the shoes' (the boot's cuff, laces, welt, toe cap): told apart by where each geometry sits along the shin
// (kit.shinCut: below that fraction of the shin it belongs to the bottoms; default just above the boot top). A whole outfit keeps all of it.
function ofShin(X,sd,shin){ const kb=X.kit.sl.bottom, ks=X.kit.sl.shoes, out=[];
  const take=(k,low)=>{ if(!k.shin) return; const cut=k.shinCut!==undefined?k.shinCut:(k.bootTop!==undefined?k.bootTop-0.02:0.58);   // (a whole outfit keeps all of it, each geometry tinted by the slot it belongs to)
    for(const g of k.shin(sd)||[]){ g.computeBoundingBox(); const t=-(g.boundingBox.min.y+g.boundingBox.max.y)/2/shin, isLow=t<cut; if(kb===ks||isLow===low){ ofTintGeos(X,isLow?'bottom':'shoes',[g]); out.push(g); } } };
  if(kb) take(kb,true); if(ks&&ks!==kb) take(ks,false); return out; }
/* Recolouring (the owner's "recolour your outfit parts even if it is a signature"): a look carries one colour per slot (tintTop ... tintWeapon, -1 = as designed). A kit names the main colour of each
   of its pieces (kit.main = {top, bottom, shoes, hat}; the hair's is kit.hairColor, the weapon's dress.accent) and ofTinter(main, target) is a transform of one vertex colour that moves the main colour to the
   target and everything else with it: coloured vertices turn by the same hue and scale by the same saturation and lightness (so a design of five colours stays five colours), greys and creams take the target's
   tone at half strength. The paint of a body part goes through ofPaint, a geometry through ofTintGeos, loose parts (extras) by comparing the rig before and after, the weapon's meshes in weaponsOn. */
const OF_TINT={top:'tintTop',bottom:'tintBottom',shoes:'tintShoes',hat:'tintHat',hair:'tintHair',face:'tintFace',weapon:'tintWeapon',glove:'tintGloves'};   // face: the eye colour (the marks keep their own)
// more colours on one piece (OF_PAL, character/outfit-palettes.js: the main colours a piece is drawn in, most vertices first): look.tint<Slot> recolours the first, tint<Slot>2 / 3 / 4 the next ones
const OF_TINTX={top:['tintTop2','tintTop3','tintTop4'],bottom:['tintBottom2','tintBottom3','tintBottom4'],shoes:['tintShoes2','tintShoes3','tintShoes4'],hat:['tintHat2','tintHat3','tintHat4'],hair:['tintHair2','tintHair3','tintHair4'],glove:['tintGloves2','tintGloves3','tintGloves4']};
const OF_PAL_N=4;
const ofPalOf=(id,slot)=>{ const a=OF_PAL[id]&&OF_PAL[id][slot]; return Array.isArray(a)?a.slice(0,OF_PAL_N):[]; };   // (id is a worn outfit: a key of OUTFITS)
const ofTintX=(L,slot,i)=>{ const f=OF_TINTX[slot]; const v=f?L[f[i-1]]:undefined; return typeof v==='number'&&v>=0&&v<=0xffffff?Math.floor(v):-1; };
const ofTintOf=(L,slot)=>{ const v=L[OF_TINT[slot]]; return typeof v==='number'&&v>=0&&v<=0xffffff?Math.floor(v):-1; };   // (a remote look is not sanitized: anything else is "as designed")
function ofTinter(M,T){ const m={h:0,s:0,l:0}, t={h:0,s:0,l:0}; new THREE.Color(M).getHSL(m); new THREE.Color(T).getHSL(t);
  const neutral=m.s<0.12, dh=neutral?0:t.h-m.h, gs=neutral?1:clamp((t.s+0.05)/(m.s+0.05),0.3,2.5), gl=Math.pow(clamp((t.l+0.05)/(m.l+0.05),0.45,1.9),0.85), ns=Math.min(0.5,t.s*0.45), h={h:0,s:0,l:0}, a=new THREE.Color(), b=new THREE.Color();
  return c=>{ c.getHSL(h); const w=smoothstep(0.04,0.22,h.s), l=clamp(h.l*gl); a.setHSL(((h.h+dh)%1+1)%1,clamp(h.s*gs),l); b.setHSL(t.h,ns,l); c.copy(b).lerp(a,w); }; }
const ofHsl=m=>{ const o={h:0,s:0,l:0}; new THREE.Color(m).getHSL(o); return o; };
// how far a colour is from a palette colour (hue counts with the colour's saturation; the lightness counts less, as the vertex colours carry shading)
const ofHsd=(a,b)=>{ let dh=Math.abs(a.h-b.h); dh=Math.min(dh,1-dh); return dh*2*Math.min(a.s,b.s)+Math.abs(a.s-b.s)*0.7+Math.abs(a.l-b.l)*0.5; };
// every vertex colour of one painted geometry through a transform
function ofTintGeo(g,f){ const a=g.attributes.color; if(!a) return g; const c=new THREE.Color(); for(let i=0;i<a.count;i++){ c.setRGB(a.getX(i),a.getY(i),a.getZ(i)); f(c); a.setXYZ(i,c.r,c.g,c.b); } a.needsUpdate=true; return g; }
function ofTintGeos(X,slot,geos){ const f=X.kit.tr[slot]; if(f) for(const g of geos) ofTintGeo(g,f); return geos; }
// the same for the geometries a hook pushed onto a list (the hair and hat items add to the head's own list)
function ofTintFrom(X,slot,list,from){ const f=X.kit.tr[slot]; if(f) for(let i=from;i<list.length;i++) ofTintGeo(list[i],f); }
// a kit's body paint for a slot, tinted
function ofPaint(X,slot,part,c,x,y,z,sd){ X.kit.sl[slot].paint(part,c,x,y,z,sd); const f=X.kit.tr[slot]; if(f) f(c); }
// the weapon dressing of a look: the kit's, with the tint for weaponsOn to lay over the weapon's meshes (and the mage's orb colour, which is not a vertex colour)
function ofDress(X){ const k=X.kit.sl.weapon; if(!k||!k.dress) return null; const f=X.kit.tr.weapon; if(!f) return k.dress;
  const o=Object.assign({},k.dress,{tint:f}); if(typeof o.glow==='number'){ const c=new THREE.Color(o.glow); f(c); o.glow=c.getHex(); } return o; }
// where the boots begin along the shin (a fraction from the knee): the kit's own, else a base boot's 0.6, else no boot at all
const ofBootTop=k=>k?(k.bootTop!==undefined?k.bootTop:(k.boot!==false?0.6:1.1)):1.1;
// the items the outfits offer for a slot, as [outfit id, label, tooltip] for the editor's rows: CHAR_MODELS.<id>.items.<slot>
const ofItems=slot=>Object.keys(OUTFITS).map(id=>{ const m=CHAR_MODELS[id], it=m&&m.items&&m.items[slot]; return it?[id,it,m.name+'\'s '+slot+' (from the '+m.name+' set)']:null; }).filter(Boolean);   // [id, label, tooltip]
// a look wearing a whole outfit: its item in every slot and `model` (the editor's reference body and ranges follow it); id 'base' takes the outfit items off (each such slot back to the sex's default)
function ofWear(L,id){ const o=Object.assign({},L), d=L.sex==='female'?LOOK_F:LOOK_M, w=ofPieces(L);
  for(const s of OF_SLOTS){ const f=OF_FIELD[s]; if(id!=='base'){ if(s!=='glove'||ofHasGlove(id)) o[f]=id; } else if(w[s]) o[f]=d[f]; o[OF_TINT[s]]=-1; if(OF_TINTX[s]) for(const f of OF_TINTX[s]) o[f]=-1; }   // (a set without gloves leaves the wearer's own)   // (a whole set is worn in the colours it was designed in)
  { const g=id!=='base'&&CHAR_MODELS[id]&&CHAR_MODELS[id].hairGrad; if(g){ o.hairGrad=g.mode; o.hairColor2=g.c2; o.hairThird=g.c3!==undefined; if(g.c3!==undefined) o.hairColor3=g.c3; } else if(w.hair||id!=='base'){ o.hairGrad='none'; o.hairThird=false; } }   // a set's own hair gradient (CHAR_MODELS.<id>.hairGrad = {mode, c2, c3}); taking a set off, or a set without one, clears it
  ofKinSwap(o,L.model,id);   // kin: a Kin set brings (and takes away) its own ears, tail, muzzle and fur
  o.model=id; return o; }
// kin: the Kin outfits (CHAR_MODELS.<id>.kin = {ears, tail, muzzle, fur, fur2, mark}) write their parts onto the look as ordinary look fields, so the editor's Kin rows keep working on top of them. Going back to the base model, or to another set, removes only what the old set had put there.
const OF_KIN_FIELDS=[['ears','kinEars',''],['tail','kinTail',''],['muzzle','kinMuzzle',''],['fur','furColor',-1],['fur2','furColor2',-1],['mark','furMark','']];
function ofKinSwap(o,from,to){
  const a=from!=='base'&&Object.prototype.hasOwnProperty.call(CHAR_MODELS,from)&&CHAR_MODELS[from].kin, b=to!=='base'&&Object.prototype.hasOwnProperty.call(CHAR_MODELS,to)&&CHAR_MODELS[to].kin;
  if(a) for(const [k,f,d] of OF_KIN_FIELDS) if(a[k]!==undefined&&o[f]===a[k]) o[f]=d;
  if(b) for(const [k,f] of OF_KIN_FIELDS) if(b[k]!==undefined) o[f]=b[k];
}
// `model` names the set whose body and ranges the editor shows: once none of its items is worn any more it is the base model again
function ofTidy(L){ if(L.model!=='base'&&!Object.values(ofPieces(L)).includes(L.model)) L.model='base'; return L; }
// a look saved before pieces existed wore a whole outfit through `model` alone (it has neither new field): give it that outfit's items
function ofMigrate(raw,L){ const m=L.model; if(raw&&raw.faceItem===undefined&&raw.weaponItem===undefined&&typeof m==='string'&&OUTFITS[m]&&!Object.keys(ofPieces(L)).length) return ofWear(L,m); return L; }
// a set's own cape and aura (the Lodge's parts, drawn in the set's colours): o = {cape: {col, trim, len, pat, mantle}, aura: {col, col2, style, ring, n, shape, deco}}; both come with the set's top (the cloth), `has` is the kit's extras guard
function ofCosmetics(rig,X,has,o){ if(!has('top')) return; if(o.cape) cosBuildCape(rig,X,o.cape); if(o.aura) cosBuildAura(rig,X,o.aura); }
