// Headless test of the child-safe setting (character/modest.js): with it on, NO look leaves the belly, the back or the shoulders bare, and the legs are covered to the knee, whatever the top, bottom, dress or signature set.
// How: the character is built with the skin painted a unique magenta; every magenta body vertex in those regions is then ray-cast outward, and it counts as covered only if cloth (a non-magenta triangle: a skirt, a sleeve, a sash) stands in front of it.
// It runs every base and crafted top and bottom (and the empty selection), every dress, every signature set's pieces and whole sets, on both bodies, at the shortest skirt length the slider allows. Off, the same test must find the bare ones (so it can fail).
// Usage: node tools/modest-smoke.js [--list]   (--list prints every uncovered look, not just the first few)
const patch=on=>code=>on?code.replace('getItem(){return null}',"getItem(k){return k==='wildwood-modest'?'1':null}"):code;
const On=require('./char-load')(patch(true)), Off=require('./char-load')(patch(false));
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&i!==''?'  ('+i+')':'')); if(!c) fails++; };
const LIST=process.argv.includes('--list');
const isSkin=(r,g,b)=>r>0.3&&g<0.2*r&&b>0.8*r&&b<1.25*r;   // the magenta skin, shaded a little (no cloth in any set is that colour)
// the uncovered parts of a built character: {belly, back, shoulders, thighs} counts
function bare(C,rig){
  rig.shL.rotation.z=-0.35; rig.shR.rotation.z=0.35;   // the arms away from the body, so the hands never count as bare thighs
  const t=C.tris(rig), n=t.length/9, H=rig.hipY, wp=o=>o.getWorldPosition(new THREE.Vector3()), SY=wp(rig.shL).y, KY=wp(rig.kneeL).y;
  const cloth=[]; const skinV=[];
  for(let i=0;i<n;i++){ const o=i*9, s=isSkin(t[o+3],t[o+4],t[o+5]); if(s) skinV.push(i); }
  const isS=new Uint8Array(n); for(const i of skinV) isS[i]=1;
  const tri=[]; for(let i=0;i+2<n;i+=3) if(!(isS[i]&&isS[i+1]&&isS[i+2])&&!(isS[i]||isS[i+1]||isS[i+2])&&true){ const a=[],ys=[]; for(let k=0;k<3;k++){ const o=(i+k)*9; a.push(t[o],t[o+1],t[o+2]); ys.push(t[o+1]); } tri.push({a,y0:Math.min(...ys),y1:Math.max(...ys)}); }
  const covered=(x,y,z)=>{ let dx=x,dz=z; const l=Math.hypot(dx,dz); if(l<0.03) return true; dx/=l; dz/=l;
    for(const T of tri){ if(T.y0>y+0.01||T.y1<y-0.01) continue; const a=T.a; const e1=[a[3]-a[0],a[4]-a[1],a[5]-a[2]], e2=[a[6]-a[0],a[7]-a[1],a[8]-a[2]], d=[dx,0,dz];
      const p=[d[1]*e2[2]-d[2]*e2[1],d[2]*e2[0]-d[0]*e2[2],d[0]*e2[1]-d[1]*e2[0]], det=e1[0]*p[0]+e1[1]*p[1]+e1[2]*p[2]; if(Math.abs(det)<1e-9) continue;
      const s=[x-a[0],y-a[1],z-a[2]], u=(s[0]*p[0]+s[1]*p[1]+s[2]*p[2])/det; if(u<0||u>1) continue;
      const q=[s[1]*e1[2]-s[2]*e1[1],s[2]*e1[0]-s[0]*e1[2],s[0]*e1[1]-s[1]*e1[0]], v=(d[0]*q[0]+d[1]*q[1]+d[2]*q[2])/det; if(v<0||u+v>1) continue;
      const tt=(e2[0]*q[0]+e2[1]*q[1]+e2[2]*q[2])/det; if(tt>0.001&&tt<0.8) return true; }
    return false; };
  const out={belly:0,back:0,shoulders:0,thighs:0}, seen={}; let step=Math.max(1,Math.floor(skinV.length/400));
  for(let k=0;k<skinV.length;k+=step){ const i=skinV[k], o=i*9, x=t[o], y=t[o+1], z=t[o+2], ax=Math.abs(x); let reg=null;
    if(y>H+0.03&&y<SY-0.04&&ax<0.11) reg=z<0?'belly':'back';
    else if(y>SY-0.1&&y<SY+0.02&&ax>0.08&&ax<0.3) reg='shoulders';
    else if(y>KY+0.04&&y<H-0.03&&ax>0.045&&ax<0.2) reg='thighs';
    if(!reg) continue; if(!covered(x,y,z)){ out[reg]++; if(typeof WHEREDUMP!=='undefined') console.log(reg,x.toFixed(3),y.toFixed(3),z.toFixed(3)); } }
  return out; }
const base=(C,sex,o)=>Object.assign({},sex==='female'?C.LOOK_F:C.LOOK_M,{sex,skin:0xff00ff,topColor:0xc03030,bottomColor:0x303090,shoeColor:0x4a3526,hat:'none',hair:'buzz',skirtLen:0.6,gloves:'none'},o);
const wear=(C,id,sex)=>{ const m=C.CHAR_MODELS[id]; const L0=Object.assign({},sex==='female'?C.LOOK_F:C.LOOK_M,{sex}); const F=C.charSexFit?C.charSexFit(C.ofWear(C.applySetup(L0,C.setupsOf(m,sex)[0]||{}),id),sex):C.ofWear(L0,id); return Object.assign({},F,{skin:0xff00ff,skirtLen:0.6}); };
const tops=C=>C.GM_TOPS.map(r=>r[0]).concat(C.GMX_TOPS.map(r=>r[0]).filter(i=>!C.GM_TOPS.some(r=>r[0]===i))), bottoms=C=>C.GM_BOTTOMS.map(r=>r[0]).concat(C.GMX_BOTTOMS.map(r=>r[0]).filter(i=>!C.GM_BOTTOMS.some(r=>r[0]===i)));
const outfitIds=C=>Object.keys(C.OUTFITS).filter(id=>C.CHAR_MODELS[id]);
function cases(C){ const cs=[];
  for(const sex of ['male','female']){
    for(const id of tops(C)) cs.push([sex+' top '+id,base(C,sex,{top:id,bottom:'trousers'})]);
    for(const id of bottoms(C)) cs.push([sex+' bottom '+id,base(C,sex,{top:'tunic',bottom:id})]);
    for(const id of outfitIds(C)){ const m=C.CHAR_MODELS[id]; if(!m.sexes.includes(sex)) continue; cs.push([sex+' set '+id,wear(C,id,sex)]);
      if(m.items&&m.items.top) cs.push([sex+' top piece '+id,base(C,sex,{top:id,bottom:'trousers'})]);
      if(m.items&&m.items.bottom) cs.push([sex+' bottom piece '+id,base(C,sex,{top:'tunic',bottom:id})]); } }
  for(const sex of ['male','female']) for(const id of ['skirt','kilt','pleated','mpskirt']) cs.push([sex+' long-legged '+id,base(C,sex,{top:'tunic',bottom:id,legs:1.2})]);   // a long leg lengthens the thigh, the skirt must follow
  return cs; }
const run=C=>{ const bad=[], errs=[]; for(const [name,L] of cases(C)){ let rig; try{ rig=C.buildCharacter(L,{q:0.4}); }catch(e){ errs.push(name+': '+e.message); continue; }
    const b=bare(C,rig), n=b.belly+b.back+b.shoulders+b.thighs; if(n>=3) bad.push(name+' ['+Object.entries(b).filter(e=>e[1]).map(e=>e[0]+' '+e[1]).join(', ')+']'); } return {bad,errs}; };
const WHERE=process.argv.indexOf('--where')>0?process.argv[process.argv.indexOf('--where')+1]:null;
if(WHERE){ const c=cases(On).find(x=>x[0]===WHERE); if(!c){ console.log('no such case'); process.exit(2); } const rig=On.buildCharacter(c[1],{q:0.4}); WHEREDUMP=true; console.log(WHERE,bare(On,rig)); process.exit(0); }
const off=run(Off);
ok('the test can fail: with the setting off, bare looks are found (the empty top, the empty bottom, short shorts)',['male top none','female top none','male bottom none','male bottom shortshorts'].every(n=>off.bad.some(b=>b.startsWith(n+' '))),off.bad.slice(0,3).join('; '));
const on=run(On);
ok('on: every look builds',!on.errs.length,on.errs.slice(0,3).join('; '));
ok('on: no top, bottom, dress or set leaves the belly, back or shoulders bare, or the thighs above the knee ('+on.bad.length+' uncovered)',!on.bad.length,(LIST?on.bad:on.bad.slice(0,8)).join('; '));
console.log(fails?'\nFAILED':'\nall passed'); process.exit(fails?1:0);
