//@ Glasswell's Bowl as a height function: the rim's radii, the three gates and the Weir cut through it, the floors of the cracks (gwRimH). In the city's own frame. Pure.
/* Everything is in metres from the Bowl's centre (GLASSWELL in sunscar.js), y up from the city's floor (0). The rim is a ring of red rock: its inner foot stands
   about 81 m out, its crest 110 m out and crestH above the floor, its skirt slopes down to the plateau at about 140 m (skirtH above the floor). The wobble of each
   radius is a sum of three sines (phases in GLASSWELL.rim), the same one docs/glasswell-plan.py draws. Three cracks (and the Weir) are cut through it:
   the River Gate's floor climbs from the Bowl up to the plateau, the Weir's gorge runs down to the Bight. The model (game/village/sun-rim.js) draws this
   height; when the Sunscar is built, `gwRimH` can be the Bowl's carve in `rawHeight` (like `passCarve`) and the server can use it for the rim's collision. */
function gwRimR(a,k){ const q=GLASSWELL.rim[k], ph=q[2]; return q[0]*(1+q[1]*(Math.sin(3*a+ph[0])*0.5+Math.sin(7*a+ph[1])*0.3+Math.sin(13*a+ph[2])*0.2)); }
// the three gates and the Weir: bearing a, half width hw at the floor
function gwGateList(){ const G=GLASSWELL; return G.gates.map(g=>({id:g.id,a:g.a,hw:G.gateW/2})).concat([{id:'weir',a:G.weir.a,hw:4,weir:true}]); }
// the floor of a crack r metres from the centre: the River Gate's road climbs onto the plateau, the Weir's gorge falls away toward the Bight
function gwCrackY(r,g){ const G=GLASSWELL, k=smoothstep(G.r,G.foot,r); return g.weir?-6*k:G.skirtH*k; }
function gwRimH(x,z){
  const G=GLASSWELL, a=Math.atan2(x,z), r=Math.hypot(x,z), f=gwRimR(a,'foot'), c=gwRimR(a,'crest'), s=gwRimR(a,'skirt');
  if(r<=f) return 0;
  let h;
  if(r<c){ const t=(r-f)/(c-f); h=G.crestH*(1-Math.pow(1-t,2.2)); }   // a cliff: steep at the foot, easing to the crest
  else h=G.skirtH+(G.crestH-G.skirtH)*Math.pow(1-smoothstep(c,s,r),1.3);
  h+=Math.min(smoothstep(f,f+5,r),1-smoothstep(s-8,s+2,r))*(noise2(x*0.06+3,z*0.06)*1.9+noise2(x*0.17,z*0.17-5)*0.5);   // crags, none at the foot or on the plateau
  for(const g of gwGateList()){
    const sa=Math.sin(g.a), ca=Math.cos(g.a); if(x*sa+z*ca<=0) continue;   // only on the gate's own side
    const lat=Math.abs(x*ca-z*sa), hw=g.hw-(g.weir?0:1.5*smoothstep(f,c,r));   // a crack pinches a little at the crest
    h=lerp(Math.min(h,gwCrackY(r,g)),h,smoothstep(hw,hw+4.5,lat));
  }
  return h;
}
