//@ The map's painter: the world as Eldmere's map draws it (the docs map's palette, shallows and a dark coast line, little pictures of trees, peaks and snow-pines); mapBuildStep paints MAP.canvas a few rows a frame
/* Agent map. What it owns: the picture MAP.canvas that the minimap and the land maps (ui/map.js) cut their view from, painted once, after the ground is ready, a few rows a frame, then the pictures.
   It is the world map's own look (assets/img/world-map.webp, docs/world-map.py: its colours, COL; the sea shading from turquoise shallows to deep blue; the coast a dark brown line; icons for
   trees, sakura, snow-pines, peaks and the villages), painted from the real ground: `mapPaintLand` / `mapPaintSea` give a pixel's colour from where it is and how high and steep (they do not call the 3D ground's
   terrainColor: the map's colours are the map's), `MAP.kind` (0 sea, 1 inland water, 2 land) is what the coast line is cut from, `mapPaintIcons` places the pictures on a jittered grid from the ground and
   the same land tests the 3D world uses (a tree where the forest is, a peak where the ground is high and steep), seeded, so every client draws the same map. mapEdgeAlpha fades the world into the
   canvas behind it along a wavy line (tests: client-smoke). Used by: ui/map.js (MAP, mapX / mapZ, the markers drawn over the picture), ui/world-map.js (nothing). Names: mapPaint..., MPC. */
const MPC={   // the docs map's colours (docs/world-map.py COL and its symbols), 0..1 RGB
  seaShallow:[.62,.89,.88], seaMid:[.25,.64,.80], seaDeep:[.09,.30,.50], foam:[.93,.98,.98], lake:[.45,.76,.91], lakeDeep:[.19,.45,.62], beach:[.94,.86,.64],
  grass:[.37,.58,.26], grassDry:[.60,.64,.30], forest:[.21,.44,.17], plateau:[.91,.78,.49], redrock:[.78,.45,.30], vale:[.64,.75,.47], pink:[.91,.73,.78],
  snow:[.94,.96,.98], frost:[.80,.88,.94], tundra:[.68,.66,.55], iceRock:[.58,.63,.68], ice:[.66,.83,.94], needle:[.27,.44,.40],
  alpine:[.46,.61,.35], scree:[.64,.62,.57], rock:[.60,.56,.50], rockHi:[.72,.69,.64], coast:[.17,.14,.09], heath:[.44,.47,.45]
};
const _mpc=[0,0,0];
const mapPaintSet=(o,c)=>{ o[0]=c[0]; o[1]=c[1]; o[2]=c[2]; };
const mapPaintMix=(o,c,t)=>{ if(t<=0) return; if(t>1) t=1; o[0]+=(c[0]-o[0])*t; o[1]+=(c[1]-o[1])*t; o[2]+=(c[2]-o[2])*t; };
// the sea: turquoise shallows, then blue, then deep, by how far from the coast (c: the waterline is about 21), with a pale line of foam along the shore
function mapPaintSea(c,o){
  const t=smoothstep(22,-140,c);
  if(t<0.4){ mapPaintSet(o,MPC.seaShallow); mapPaintMix(o,MPC.seaMid,t/0.4); } else { mapPaintSet(o,MPC.seaMid); mapPaintMix(o,MPC.seaDeep,(t-0.4)/0.6); }
  mapPaintMix(o,MPC.foam,smoothstep(15,20,c)*(1-smoothstep(21.5,23,c))*0.7);
}
// land: painted by the atlas's land (waLandId): the home forest and the vale (grass, forest, the vale's pink), the Reach (snow), the Greyspine (alpine, scree, snow), the Gloamhorn (a dim heath), the Sunscar (sand and red rock);
// within 18 m of a border the other side's painting is mixed in (half at the crest), so no line shows. Returns how much of the relief shading to keep (the Sunscar's mesas are drawn flat)
const _mpa=[0,0,0];
function mapPaintOne(l,x,z,h,g,o){
  const n1=noise2(x*0.02,z*0.02)*0.5+0.5, n3=noise2(x*0.045-30,z*0.045+12)*0.5+0.5, fd=forestDensity(x,z), steep=smoothstep(0.62,1.15,g);
  if(l===2){   // the Hoarfrost Reach: snow with a blue cast, tundra showing through, a needle floor on its southern fringe, bare rock where steep, blue-white ice on the frozen lakes
    mapPaintSet(o,MPC.snow); mapPaintMix(o,MPC.frost,n1*0.55); mapPaintMix(o,MPC.tundra,smoothstep(0.64,0.84,n3)*0.45*(1-smoothstep(0.9,1.4,g)));
    mapPaintMix(o,MPC.needle,smoothstep(0.5,0.85,fd)*smoothstep(-700,-570,z)*0.45*(1-steep)); mapPaintMix(o,MPC.iceRock,smoothstep(0.75,1.3,g)*0.85);
    { const id=iceDist(x,z); if(id<7) mapPaintMix(o,MPC.ice,smoothstep(7,-2,id)*0.95); }
    return 1;
  }
  if(l===3){   // the Greyspine: alpine meadow in the troughs, scree and bare rock on the slopes, snow above the snowline (about 115 m, 10 m lower in the north)
    mapPaintSet(o,MPC.alpine); mapPaintMix(o,MPC.forest,smoothstep(0.5,0.9,fd)*0.4*(1-smoothstep(82,108,h+n3*12)));
    mapPaintMix(o,MPC.grassDry,smoothstep(0.45,0.85,n1)*0.35*(1-smoothstep(55,95,h)));
    mapPaintMix(o,MPC.scree,smoothstep(72,118,h+n3*14)*0.85+smoothstep(0.45,0.8,g)*0.3); mapPaintMix(o,n1<0.5?MPC.rock:MPC.rockHi,steep*0.9);
    mapPaintMix(o,MPC.snow,smoothstep(112-(z<-860?10:0)+n1*14,128-(z<-860?10:0)+n1*14,h)*(1-smoothstep(0.85,1.4,g)));
    return 1;
  }
  if(l===5){   // the Gloamhorn: a dim heath under a dusk sky, dark rock on its crags
    mapPaintSet(o,MPC.heath); mapPaintMix(o,MPC.forest,smoothstep(0.5,0.9,fd)*0.3); mapPaintMix(o,MPC.scree,smoothstep(0.4,0.8,g)*0.5+smoothstep(60,110,h)*0.3); mapPaintMix(o,MPC.rock,steep*0.85);
    return 1;
  }
  if(l>=4){   // the Sunscar: sand, red rock on the steep ground and the mesas' flanks
    mapPaintSet(o,MPC.plateau); mapPaintMix(o,MPC.redrock,smoothstep(0.58,0.85,n3)*0.22+steep*0.8); mapPaintMix(o,MPC.rockHi,smoothstep(70,120,h)*0.3*(1-steep));
    return 0.6;
  }
  const village=vDist(x,z)<VR+10;
  mapPaintSet(o,MPC.grass); mapPaintMix(o,MPC.grassDry,smoothstep(0.45,0.85,n1)*0.55);
  mapPaintMix(o,MPC.forest,smoothstep(0.5,0.85,fd)*0.8*(1-smoothstep(1.2,2,g))*(village?0:1));
  if(l===1){ const v=(1-smoothstep(0.7,1.2,g))*(1-smoothstep(24,34,h)); mapPaintMix(o,MPC.vale,v*0.5); mapPaintMix(o,MPC.pink,v*smoothstep(0.35,0.8,fd)*0.5*(1-village)); }   // (the vale: fresher green, dusted pink)
  mapPaintMix(o,MPC.rock,steep*0.75); mapPaintMix(o,MPC.rockHi,smoothstep(26,40,h)*0.6);
  mapPaintMix(o,MPC.snow,smoothstep(42,54,h)*(1-steep*0.9));   // (snow on the high ground)
  return 1;
}
function mapPaintLand(x,z,h,g,c,o){
  const l=waLandId(x,z), d=waLandBorderDist(x,z);
  let keep=mapPaintOne(l,x,z,h,g,o);
  if(d<18){
    let b=l; for(let r=d+10;r<=d+40&&b===l;r+=15) for(let k=0;k<8;k++){ const a=k*0.7854, q=waLandId(x+Math.sin(a)*r,z+Math.cos(a)*r); if(q!==l){ b=q; break; } }
    if(b!==l){ const kb=mapPaintOne(b,x,z,h,g,_mpa), t=0.5*smoothstep(18,0,d); mapPaintMix(o,_mpa,t); keep=keep+(kb-keep)*t; }
  }
  mapPaintMix(o,MPC.beach,smoothstep(46,32,c)*(1-smoothstep(3.2,5.5,h)));   // (a beach where the land meets the sea)
  return keep;
}
// the picture: terrain rows (a few a frame), then the coast line, the zones' dashed borders and the villages; then the little pictures, a few rows of their grid a frame
function mapBuildStep(rows){
  if(MAP.done) return; if(!MAP.canvas) mapInit();
  const N=MAP.w, NZ=MAP.h, d=MAP.img.data, cell=1/MAP.k;
  if(!MAP.kind) MAP.kind=new Uint8Array(N*NZ);
  for(let r=0;r<rows&&MAP.row<NZ;r++,MAP.row++){
    const iz=MAP.row, z=WZ0+(iz+0.5)*cell;
    for(let ix=0;ix<N;ix++){
      const x=WX0+(ix+0.5)*cell, h=getH(x,z), i=(iz*N+ix)*4;
      const dhx=getH(x+cell,z)-getH(x-cell,z), dhz=getH(x,z+cell)-getH(x,z-cell), g=Math.hypot(dhx,dhz)/(2*cell)*2;
      const ws=waterSurf(x,z), c=coastDist(x,z), o=_mpc; let kind=2;
      if(h<ws-0.35){
        if(c<24){ mapPaintSea(c,o); kind=0; }
        else { const k=clamp((ws-h)/(ws>1?1.6:2.6)); mapPaintSet(o,MPC.lake); mapPaintMix(o,MPC.lakeDeep,k); kind=1; }
      } else {
        const keep=mapPaintLand(x,z,h,g,c,o);
        const sh=lerp(1,clamp(1-(dhx+dhz)*0.9/cell*0.35,0.62,1.35),0.7*keep);   // (the relief, softer than the 3D ground's: it is a painting)
        o[0]*=sh; o[1]*=sh; o[2]*=sh;
      }
      MAP.kind[iz*N+ix]=kind;
      const zn=zoneAt(x,z); MAP.zone[iz*N+ix]=zn?ZONES.indexOf(zn)+1:0;
      d[i]=clamp(o[0])*255; d[i+1]=clamp(o[1])*255; d[i+2]=clamp(o[2])*255; d[i+3]=mapEdgeAlpha(x,z);
    }
  }
  if(MAP.row<NZ) return;
  if(!MAP.ink){   // the coast line and the zones' borders, cut from the masks, then the picture goes to the canvas
    const K=MAP.kind, coast=MPC.coast;
    for(let iz=1;iz<NZ-1;iz++) for(let ix=1;ix<N-1;ix++){
      const k=iz*N+ix, a=K[k]; if(a===0) continue;
      const sea=K[k-1]===0||K[k+1]===0||K[k-N]===0||K[k+N]===0||K[k-N-1]===0||K[k-N+1]===0||K[k+N-1]===0||K[k+N+1]===0, lakeEdge=a===2&&(K[k-1]===1||K[k+1]===1||K[k-N]===1||K[k+N]===1);
      const i=k*4;
      if(a===2&&sea){ d[i]=coast[0]*255; d[i+1]=coast[1]*255; d[i+2]=coast[2]*255; }
      else if(lakeEdge){ d[i]*=0.5; d[i+1]*=0.6; d[i+2]*=0.72; }   // (a dark blue bank round a lake and a river)
      else if(a===1&&(K[k-1]===2||K[k+1]===2||K[k-N]===2||K[k+N]===2)){ d[i]*=0.62; d[i+1]*=0.74; d[i+2]*=0.86; }
    }
    for(let iz=0;iz<NZ-1;iz++) for(let ix=0;ix<N-1;ix++){ const k=iz*N+ix, a=MAP.zone[k]; if(MAP.kind[k]===2&&(a!==MAP.zone[k+1]||a!==MAP.zone[k+N])&&((ix+iz)&2)===0){ const i=k*4; d[i]*=0.72; d[i+1]*=0.72; d[i+2]*=0.66; } }   // (dashed, like the docs map's region borders)
    MAP.ctx.putImageData(MAP.img,0,0); MAP.ink=true; MAP.ic=0; return;
  }
  const x=MAP.ctx, s=MAP.k;
  if(MAP.ic===0){   // villages: the houses as the plan has them, a ring on the teleport circle, a dashed ring round each boss arena
    for(const V of VILS){
      for(const H of V.houses){ x.save(); x.translate(mapX(H.x),mapZ(H.z)); x.rotate(-H.rot); x.fillStyle=V===VIL2?'#4a5058':V===VIL3?'#5a4636':V===VIL4?'#5a5c62':colHex(H.roof); x.strokeStyle='#2a1d10'; x.lineWidth=0.9; x.fillRect(-H.w/2*s,-H.d/2*s,H.w*s,H.d*s); x.strokeRect(-H.w/2*s,-H.d/2*s,H.w*s,H.d*s); x.restore(); }
      x.fillStyle='#f1e5c8'; for(const st of V.stalls){ x.beginPath(); x.arc(mapX(st.x),mapZ(st.z),Math.max(1.2,1.6*s),0,TAU); x.fill(); }
      x.strokeStyle='#e8f6ff'; x.lineWidth=Math.max(1.2,1.4*s); x.beginPath(); x.arc(mapX(V.tele.x),mapZ(V.tele.z),Math.max(2,V.tele.r*s),0,TAU); x.stroke();
    }
    x.strokeStyle='#5a3d1e'; x.lineWidth=Math.max(1,1.2*s); x.setLineDash([2,2]);
    for(const A of ARENAS){ x.beginPath(); x.arc(mapX(A.x),mapZ(A.z),A.r*s,0,TAU); x.stroke(); }
    x.setLineDash([]); MAP.ic=1; MAP.icz=WZ0+4; return;
  }
  mapPaintIcons(x,rows>16?10:3);
  if(MAP.icz>=WZ1-4) MAP.done=true;
}
/* the little pictures, on a jittered grid (a cell is about 7 px of the map: 11 m), north to south so a lower one stands in front of the one above it: a round tree in the home forest, sakura (and a few green
   ones) in the vale, snow-pines on the Reach's southern fringe, pines on the Greyspine's lower slopes, and a peak (grey, with a snow cap) wherever the ground is high and steep. Not on a road,
   a village, an arena, the water or the beach. rows: grid rows done in this call. */
function mapPaintIcons(x,rows){
  const s=MAP.k, cell=7/s;
  for(let r=0;r<rows&&MAP.icz<WZ1-4;r++,MAP.icz+=cell){
    const rng=mulberry32(60821+Math.round(MAP.icz));
    for(let gx=WX0+4;gx<WX1-4;gx+=cell){
      const px=gx+(rng()-0.5)*cell*0.9, pz=MAP.icz+(rng()-0.5)*cell*0.9, roll=rng(), roll2=rng();
      if(mapEdgeAlpha(px,pz)<250) continue;
      const h=getH(px,pz); if(h<3) continue;
      const fd=forestDensity(px,pz); if(fd<0.42&&h<80) continue;   // (no peak is shown on low ground, no tree in the open)
      if(vDist(px,pz)<VR+8||arenaDist(px,pz)<ARENA.r+8||nearPath(px,pz,4)) continue;
      const g=grad(px,pz)*2, hoar=inHoar(px,pz), grey=waLandId(px,pz)===3, vale=inVale(px,pz)&&!hoar, ax=mapX(px), az=mapZ(pz);
      if(h>108&&g>0.7&&(grey||(!hoar&&!vale&&h>90&&!inSun(px,pz)&&!inGloam(px,pz)))){ if(roll<0.24) mapPaintPeak(x,ax,az,5+roll2*6); continue; }   // peaks: the Greyspine's, and the home forest's snowy north rim
      if(g>0.9||h>96||coastDist(px,pz)<44||waterSurf(px,pz)>h) continue;
      if(hoar){ if(fd>0.55&&pz>-700&&roll<0.55) mapPaintPine(x,ax,az,3.6,true); }
      else if(grey){ if(h<96&&fd>0.5&&roll<0.5) mapPaintPine(x,ax,az,3.4,false); }
      else if(vale){ if(fd>0.45&&roll<0.6) mapPaintTree(x,ax,az,3.2,roll2<0.62); }
      else if(!inSun(px,pz)&&!inGloam(px,pz)&&fd>0.5&&roll<0.7) mapPaintTree(x,ax,az,3.3,false);
    }
  }
}
// a round tree (the docs map's #tree and #sakura): a dark outline, a canopy and a lit patch on top
function mapPaintTree(x,ax,az,r,pink){
  x.fillStyle='rgba(20,34,12,.28)'; x.beginPath(); x.ellipse(ax+1,az+r*0.55,r*0.95,r*0.4,0,0,TAU); x.fill();
  x.fillStyle=pink?'#ee94b3':'#3b752a'; x.strokeStyle=pink?'#a45672':'#1f3f15'; x.lineWidth=0.9; x.beginPath(); x.arc(ax,az,r,0,TAU); x.fill(); x.stroke();
  x.fillStyle=pink?'#ffd2e2':'#67a547'; x.beginPath(); x.arc(ax-r*0.3,az-r*0.35,r*0.42,0,TAU); x.fill();
}
// a pine (the docs map's #pine and #snowpine): a dark triangle, with a white cap in the cold lands
function mapPaintPine(x,ax,az,r,snowy){
  x.fillStyle=snowy?'#2f5a4a':'#2f6a3c'; x.strokeStyle=snowy?'#163a30':'#163822'; x.lineWidth=0.8; x.beginPath(); x.moveTo(ax,az-r*1.7); x.lineTo(ax-r*0.95,az+r*0.5); x.lineTo(ax+r*0.95,az+r*0.5); x.closePath(); x.fill(); x.stroke();
  if(snowy){ x.fillStyle='#fff'; x.beginPath(); x.moveTo(ax,az-r*1.7); x.lineTo(ax-r*0.45,az-r*0.7); x.lineTo(ax,az-r*0.9); x.lineTo(ax+r*0.45,az-r*0.7); x.closePath(); x.fill(); }
}
// a peak (the docs map's #mtn): grey, the shaded side darker, a snow cap
function mapPaintPeak(x,ax,az,r){
  x.fillStyle='#a39988'; x.strokeStyle='#3e352c'; x.lineWidth=0.9; x.beginPath(); x.moveTo(ax-r,az+r*0.6); x.lineTo(ax-r*0.18,az-r*1.15); x.lineTo(ax+r*0.2,az-r*0.85); x.lineTo(ax+r*0.4,az-r); x.lineTo(ax+r,az+r*0.6); x.closePath(); x.fill(); x.stroke();
  x.fillStyle='#6d6356'; x.beginPath(); x.moveTo(ax-r*0.18,az-r*1.15); x.lineTo(ax+r*0.2,az-r*0.85); x.lineTo(ax+r*0.4,az-r); x.lineTo(ax+r,az+r*0.6); x.lineTo(ax+r*0.1,az+r*0.6); x.lineTo(ax-r*0.05,az-r*0.3); x.closePath(); x.fill();
  x.fillStyle='#fdfeff'; x.beginPath(); x.moveTo(ax-r*0.18,az-r*1.15); x.lineTo(ax-r*0.5,az-r*0.65); x.lineTo(ax-r*0.3,az-r*0.7); x.lineTo(ax-r*0.12,az-r*0.5); x.lineTo(ax+r*0.05,az-r*0.75); x.lineTo(ax+r*0.2,az-r*0.85); x.closePath(); x.fill();
}
