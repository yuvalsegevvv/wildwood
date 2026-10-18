//@ Faces, hair bits and slider setups for the signature sets: oxTune (a set's reference slider values), oxMarks (face decals: freckles, bags, scars, paint), oxHairBits (earrings, beads, sprigs, pins), oxEyes
/* oxTune(id, v): sets values of CHAR_MODELS.<id>.setups[0].v (the reference fit) and widens the model's recommended range to hold them (never beyond the slider's own range).
   oxMarks(F, list) -> painted geometries for a kit's `mark` hook (F = the face helpers, F.place puts a decal on the skull at (x, y)); list items {t, col, side?}: freckles, bags, scar, stripe, crow, cheek, mole, tear.
   oxHairBits(X, list) -> geometries in the head frame for a kit's `hair` hook; list items {t, col, side?}: ring (an earring), beads (a strand of beads from the temple), sprig (leaves tucked behind the ear), pin (a hair pin),
   tuft (a pair of upright hair tufts), locks (a strand down each temple, o.len), tail (a tail down the back with a tie, o.len). owns: oxTune, oxMarks, oxHairBits.   used by: game/outfits/*.js (the last lines); with oxPlus (outfit-extras.js), which also takes kit: {eyeColor, eyes}.   test: tools/cosmetic-items-smoke.js, tools/character-smoke.js */
function oxTune(id,v){
  const m=CHAR_MODELS[id]; if(!m) return; const s0=m.setups[0]; m.ranges=m.ranges||{};
  for(const k in v){ const s=SLIDER_BY_KEY[k]; if(!s) continue; s0.v[k]=v[k]; const r=m.ranges[k]; if(r) m.ranges[k]=[Math.max(s.min,Math.min(r[0],v[k]-0.05)),Math.min(s.max,Math.max(r[1],v[k]+0.05))]; }
}
function oxMarks(F,list){
  const out=[], sg=n=>Math.max(5,n>>1), dot=(rx,ry,x,y,col,rot)=>solid(F.place(csph(1,8,6).scale(rx,ry,0.0009).rotateZ(rot||0),x,y,0.0008),col);
  for(const o of list){ const col=o.col, sd=o.side||1;
    if(o.t==='freckles') for(const [x,y] of [[0.02,-0.028],[0.03,-0.034],[0.04,-0.026],[0.026,-0.04],[0.045,-0.038]]) for(const s of [-1,1]) out.push(dot(0.0032,0.0032,s*x,y,col));
    if(o.t==='bags') for(const s of [-1,1]) out.push(dot(0.024,0.0055,s*0.046,-0.02,col,s*0.12));
    if(o.t==='scar'){ out.push(dot(0.003,0.035,sd*0.05,0.0,col,sd*0.5)); for(const d of [-0.012,0.0,0.012]) out.push(dot(0.008,0.0016,sd*(0.05+d*0.5),0.0+d,col,sd*-0.5)); }
    if(o.t==='stripe') for(const s of [-1,1]) out.push(dot(0.04,0.006,s*0.052,-0.03,col,s*-0.08));
    if(o.t==='crow') for(const s of [-1,1]) for(const a of [-0.35,0,0.35]) out.push(dot(0.014,0.0013,s*0.083,-0.002+a*0.02,col,s*a));
    if(o.t==='cheek') for(const s of [-1,1]) out.push(dot(0.024,0.016,s*0.052,-0.036,col,0));
    if(o.t==='mole') out.push(dot(0.0036,0.0036,sd*0.03,-0.062,col,0));
    if(o.t==='tear') out.push(dot(0.0032,0.007,sd*0.046,-0.026,col,0)); }
  return out; }
function oxHairBits(X,list){
  const {sg}=X, out=[];
  for(const o of list){ const col=o.col, sd=o.side||1, col2=o.col2||col;
    if(o.t==='ring') for(const s of (o.both?[-1,1]:[sd])) out.push(solid(ofRingAt([s*0.101,-0.034,0.004],[1,0,0],0.013,0.0028,sg(6)),col));
    if(o.t==='beads') for(const s of (o.both?[-1,1]:[sd])){ out.push(solid(sweepTube([[s*0.097,0.03,-0.03],[s*0.1,-0.04,-0.034],[s*0.098,-0.12,-0.03]],[0.0016,0.0016,0.0016],4,{cap:'round',rings:8}),col2));
        for(let i=0;i<5;i++) out.push(solid(csph(0.0085,sg(7),sg(5)).translate(s*(0.099+0.001*i),-0.015-0.025*i,-0.032),i%2?col2:col)); }
    if(o.t==='sprig') { const x=sd*0.098; for(const [dy,rot] of [[0.0,0.7],[0.02,1.2],[-0.016,0.3]]) out.push(solid(csph(1,sg(7),sg(5)).scale(0.007,0.02,0.004).rotateZ(sd*rot).translate(x+sd*0.004,-0.002+dy,0.028),col)); out.push(solid(csph(0.007,sg(7),sg(5)).translate(x+sd*0.012,0.03,0.03),col2)); }
    if(o.t==='pin') out.push(solid(vbox(0.052,0.006,0.005,sd*0.075,0.062,-0.09),col),solid(csph(0.008,sg(7),sg(5)).translate(sd*0.1,0.062,-0.09),col2));
    if(o.t==='locks') for(const s of [-1,1]){ const L=o.len||0.2, P=[[s*0.1,0.03,-0.045],[s*0.108,-0.04*L/0.2-0.02,-0.05],[s*0.104,-L*0.8,-0.044],[s*0.1,-L,-0.04]]; out.push(solid(sweepTube(P,[0.012,0.011,0.008,0.002],sg(6),{cap:'point',rings:sg(12)}),X.hairCol.getHex())); }   // a lock down each temple
    if(o.t==='tail'){ const L=o.len||0.3, P=[[0,0.03,0.095],[0,-0.03,0.125],[0,-L*0.6,0.13],[0,-L,0.12]]; out.push(solid(sweepTube(P,[0.026,0.026,0.02,0.002],sg(7),{cap:'point',rings:sg(14)}),X.hairCol.getHex()), solid(ofRingAt([0,0.0,0.118],[0,1,0.15],0.027,0.005,sg(6)),col||0xc83a4a)); }   // a tail down the back with a tie
    if(o.t==='tuft') for(const s of [-1,1]) out.push(solid(new THREE.ConeGeometry(0.014,0.07,5).rotateZ(s*0.4).translate(s*0.03,0.145,-0.03),col)); }
  return out; }
