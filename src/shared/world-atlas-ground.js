//@ The ground of the atlas (waGround, which baseHeight returns): the smoothed target height + each land's own landform + the borders as ridges / ravines / broken bands (never a cliff line) + rivers, lakes, coast and beaches. Pure.
/* Agent map. waGround(x,z) is the whole shared height function before the villages' and arenas' flattening (rawHeight, terrain-height.js). Reads shared/world-atlas.js only for WHERE things are;
   the shapes are made here from noise (hillShape, erodeFbm, ridged, crest of shared/terrain.js and noise.js), so the ground is landforms guided by the atlas, never the atlas's own terraces.
   Nothing finer than 8-16 m is put in (the server samples this on a 4 m grid; fine detail is the client's ground shading).
   - Landform per land (waForm): rolling hills (home, vale), white domes (Reach), ridged mountains (Greyspine: the most extreme), mesas and dunes (Sunscar), crags (Gloamhorn), a long gentle swell (Amber Reach, land 6). Each fades to nothing
     over the last ~90 m before a land border, where the border's own range stands instead (waLandRidge).
   - A land border is a range of ridges with saddles (WA_SADDLE: a third of its length is low) and no range at all on a road (the roads cross through the saddles); a zone border inside a land is,
     by a slow noise along it, a low ridge with saddles, a ravine, or a band of broken ground (waZoneEdge). All of these are rises of 10-40 m over 60-150 m, not a step.
   - Water: a lake or river is carved from the atlas's signed distance to its bank (waWaterDist) to its surface (waWaterSurf); a river is a ford (at most ~1.1 m deep), a lake up to ~2.5 m, a frozen
     lake (the Reach) is flat ice. The sea is the one plane at WATER; a river or lake that stands higher is a carved bed whose surface only waterSurf (greyspine.js) knows: the client draws no mesh for it yet.
   - Coast: the atlas's signed distance (waCoast, metres inland) wobbled by noise; a beach 0.35 m at the waterline rising 2.4 m over 60 m, the land's own ground from 100 m inland (75 m in the Greyspine and the Gloamhorn:
     cliffs and fjords); the sea floor goes down to -5.5 m over 50 m.
   Tuning knobs are the WA_* constants below. Used by: baseHeight (terrain.js). Test: tools/atlas-smoke.js; see it: node tools/atlas-preview.js out.png. Names: wa..., WA_... */
const WA_SEA_FLOOR=-5.5, WA_BEACH_W=100, WA_CLIFF_W=75, WA_ISLE_W=55;   // (WA_ISLE_W: the Emberwake Isles are small, 400-500 m across: the beach hands over to the island's ground within 55 m)
const waSmax=(a,b,k)=>{ const h=clamp(0.5+0.5*(a-b)/k); return lerp(b,a,h)+k*h*(1-h); };   // smooth max (k: how many metres round the corner)
const waSmin=(a,b,k)=>-waSmax(-a,-b,k);
// each land's own landform, about zero on average (the target height is the average): metres above or below the target
function waForm(L,x,z){
  switch(L){
    case 0: return (hillShape(x,z,HILL_HOME)-9)*0.5;                                  // the home forest: rolling hills +-12 m
    case 1: return (hillShape(x,z,HILL_VALE)-10)*0.55;                                // the vale: softer
    case 2: return erodeFbm(x*0.0055+13.7,z*0.0055-4.1,5,0.2)*19+Math.pow(1-Math.abs(noise2(x*0.011+61,z*0.011-9)),2)*5-3;   // the Reach: broad white domes
    case 3: { const wx=x+noise2(x*0.0031+4,z*0.0031-1)*75, wz=z+noise2(x*0.0031-9,z*0.0031+6)*75;   // (warped: simplex ridges run in straight diagonals otherwise)
      return (ridged(wx*0.0042+3,wz*0.0042-6,4)-0.33)*150+erodeFbm(wx*0.006-8,wz*0.006+4,4,0.15)*34; }                    // the Greyspine: ridged mountains and deep glens, the most extreme land
    case 4: { const mn=noise2(x*0.0035+21,z*0.0035-8)*0.5+0.5, mesa=smoothstep(0.5,0.63,mn)*24;                           // the Sunscar: flat-topped mesas with long flanks, dunes between
      const dune=Math.sin((x*0.8+z*0.6)*0.05+3*noise2(x*0.004,z*0.004))*4.5*(1-mesa/24);
      return mesa-6+dune+erodeFbm(x*0.012,z*0.012,3,0.3)*6; }
    case 5: { const wx=x+noise2(x*0.0034+4,z*0.0034-1)*55, wz=z+noise2(x*0.0034-9,z*0.0034+6)*55;
      return (ridged(wx*0.0078+9,wz*0.0078+2,4)-0.3)*58+erodeFbm(wx*0.009+2,wz*0.009-6,3,0.2)*12; }                      // the Gloamhorn: crags
    case 6: return (hillShape(x+613,z-287,HILL_VALE)-10)*0.32;                                                       // Amber Reach: the savanna's long gentle swell, +-4 m (its terraces and rocks are the zones' own: shared/savannazones.js)
    case 7: return erodeFbm(x*0.011+5.3,z*0.011-2.2,4,0.2)*5+noise2(x*0.03+3,z*0.03-1)*1.2;                            // the Emberwake Isles: low rolling island ground +-5 m (each zone's target height does the rest)
    default: return 0;
  }
}
const WA_ZONE_EDGE_LAND=[0.55,0.6,0.8,1.2,0.7,1.0,0.6,0.5];   // how much a zone border shows, by land (the Greyspine most)
// the range along a border between two lands: ridges with saddles, none on a road, none where a river is the border. d: metres from the border, T: the target height there
function waLandRidge(x,z,d,T,rd,wd,cr){
  if(d>130) return 0;
  const amp=10+0.28*Math.max(T,0), sdl=smoothstep(-0.35,0.25,noise2(x*0.0055+8,z*0.0055+2)), rf=0.06+0.94*smoothstep(10,70,rd), wf=smoothstep(12,70,wd);
  return amp*Math.exp(-(d/36)*(d/36))*(0.65+0.7*cr)*(0.16+0.84*sdl)*rf*wf;
}
// a border between two zones of one land: by a slow noise along it a low ridge with saddles, a ravine, or a band of broken steep ground
function waZoneEdge(x,z,d,T,L,rd,wd,cr,dl){
  if(d>110) return 0;
  const A=(4+0.1*Math.max(T,0))*WA_ZONE_EDGE_LAND[L]*smoothstep(30,90,dl)*smoothstep(10,60,wd)*(0.07+0.93*smoothstep(8,60,rd));
  if(A<0.05) return 0;
  const sel=noise2(x*0.0042+11,z*0.0042-7), wr=smoothstep(0.02,0.22,sel), wv=smoothstep(-0.12,-0.32,sel), wb=Math.max(0,1-wr-wv);
  const sad=0.2+0.8*smoothstep(-0.3,0.2,noise2(x*0.0075-4,z*0.0075+9));   // saddles: the ridge and the ravine give out
  let h=0;
  if(wr>0) h+=wr*A*1.15*Math.exp(-(d/26)*(d/26))*sad*(0.7+0.6*cr);
  if(wv>0) h-=wv*A*1.25*Math.exp(-(d/17)*(d/17))*sad;
  if(wb>0) h+=wb*A*0.9*(ridged(x*0.03+2,z*0.03-5,2)-0.35)*smoothstep(80,14,d);
  return h;
}
// the bed of a lake or river: wd metres from its bank (negative inside), S its surface. Inside: a ford at most ~1.1 m deep for a river, a lake deepens towards its middle; the banks rise from S
function waBed(wd,S,ice){
  if(wd<0){ if(ice) return S-0.15; return S-0.5-0.6*smoothstep(0,10,-wd)-1.9*smoothstep(10,28,-wd); }
  return S-(ice?0.15:0.5)+1.1*smoothstep(0,4,wd)+0.45*wd+0.02*wd*wd;   // (a bank steepening away from the water: it trims only the first ~40 m, the valley's shape is the landform's fade)
}
function waGround(x,z){
  let c=waCoast(x,z);
  if(c<-64) return WA_SEA_FLOOR;   // the open sea
  c+=noise2(x*0.018+3.1,z*0.018-7.7)*6;
  if(c<=0) return lerp(0.35,WA_SEA_FLOOR,smoothstep(0,50,-c));   // the sea floor, from the waterline down
  const L=waLandId(x,z), T=waTarget(x,z), dl=waLandBorderDist(x,z), dz=waBorderDist(x,z), rd=waRoadDist(x,z), wd=waWaterDist(x,z);
  const cr=(dl<130||dz<110)?crest(x,z):0;
  // the shore: a beach, then the land's own ground (cliffs where the land is high). The target is shaped by it first (waterlines of rivers and lakes are levelled against the shaped target: docs/world-atlas.py TC6), the landform and the borders fade with it
  const W=((L===3||L===5)?WA_CLIFF_W:L===7?WA_ISLE_W:WA_BEACH_W)+1.1*Math.max(T-25,0), bh=0.35+2.4*smoothstep(0,60,c), k=smoothstep(0,W,c), Tc=lerp(bh,T,k);
  // a river's valley: the target height sinks towards the river's surface (a river falls to the sea faster than the land does), over ~140 m (200 in the Greyspine), so no river is cut through high ground
  let T0=Tc, S=0;
  if(wd<200){ S=waWaterSurf(x,z); const gap=Tc-(S+2.5); if(gap>0) T0=Tc-gap*(1-smoothstep(0,L===3?200:140,wd)); }
  // towards a river or lake the landform gives way to gentle rolling ground (a valley floor, its walls rising away from it), and towards a road and an anchor too (a road keeps to gentle ground, in the Greyspine along its glens;
  // a village, a gate, a boss's ground, a camp stands in a clearing)
  const ff=smoothstep(8,95,dl)*(0.12*smoothstep(10,60,wd)+0.88*smoothstep(4,L===3?170:120,wd+noise2(x*0.008+5,z*0.008-2)*42*smoothstep(0,40,wd)+noise2(x*0.021-6,z*0.021+3)*14*smoothstep(0,40,wd)))
    *(0.04+0.96*smoothstep(5,64,rd+noise2(x*0.013-1,z*0.013+4)*18*smoothstep(0,30,rd)))*(0.1+0.9*smoothstep(10,60,waAnchorDist(x,z)));
  const lf=ff>0.995?waForm(L,x,z):ff<0.005?erodeFbm(x*0.009+3,z*0.009-5,3,0.3)*10*smoothstep(4,70,wd):lerp(erodeFbm(x*0.009+3,z*0.009-5,3,0.3)*10*smoothstep(4,70,wd),waForm(L,x,z),ff);   // (only the one that shows is computed)
  let h=T0+(lf+noise2(x*0.021-3,z*0.021+8)*0.7*smoothstep(0,25,wd)
    +waLandRidge(x,z,dl,T,rd,wd,cr)+waZoneEdge(x,z,dz,T,L,rd,wd,cr,dl))*k;
  h=waSmax(h,0.35+1.0*smoothstep(0,40,c),1.5);
  if(wd<70){   // a lake or river: the bed inside, a bank that trims the ground beside it (fading out, so it never leaves a step)
    const ice=wd<0&&waWater(x,z)===WA_ICE;
    if(wd<0) h=Math.max(waBed(wd,S,ice),ice?-1e9:S-0.5-1.9*smoothstep(3,18,rd));   // (a road crosses a lake on a shallow ford)
    else{ h=lerp(h,waSmin(h,waBed(wd,S,false),3),smoothstep(70,40,wd)); if(wd<36) h=lerp(h,waSmax(h,S+0.25+0.04*wd,1),smoothstep(36,10,wd));   // the bank trims the ground beside the water, which never stands below the water's surface (no river perched above its banks)
    }
  }
  return h;
}
