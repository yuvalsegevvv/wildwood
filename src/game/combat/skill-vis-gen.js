//@ The visuals that follow the text, for the generic skills (the shop's and the bosses'): waves of arrows in the number the text says, pulls and shoves as travelling waves, a gate, a thundercloud, beams that hit twice
/* Agent map. Same engine as the sets (combat/skill-vis.js, skill-props.js), driven from the skill row instead of a look: skgCast (from fxVisuals, skill-fx.js) runs a skill's 'cast' recipe from SKG_BY_ID and remembers the cast;
   skgZone (from onArea) matches the zone the server then starts to that cast (same radius, within 3.5 s) and runs its 'zone' recipe, adds a wave front for every pull (kb < 0, inward) or shove (kb > 0) and a pulse for every tick;
   skgWaveGate (from the rain / hail / blizzard loops) lets arrows fall in the SKG_WAVES the text counts. SKG_BY_ID holds the recipes (the same verbs and options as a look's `vis`). A pseudo-look in the skill's element colour
   stands in for L. Test: client-smoke (every generic skill is cast; every recipe is checked). */
const SKG_WAVES={rain:5, hail:8, blizzard:10};   // "5 waves over 2.5 seconds", "8 waves over 4 seconds", "10 waves of ice"
const SKG_BY_ID={
  gate:{zone:[{prop:{kind:'gate',anim:'rise',size:1.5,life:1.6,cols:[0,6,'hot']}},{shake:{v:0.3,at:1.5}}]},   // Demon Gate: a gate stands over the area and slams shut
  thunderhead:{zone:[{prop:{kind:'cloud',anim:'hover',h:7,size:2.4,life:4.9,cols:[0,'hot']}}]},   // a thundercloud over the area
  nightfall:{zone:[{prop:{kind:'moon',anim:'hover',h:11,size:2.2,life:5.9,cols:[3,'hot']}}]},   // night falls: a pale moon comes up over it
  glassstorm:{zone:[{prop:{kind:'mirror',n:5,arr:'ring',rk:0.55,anim:'rise',stagger:0.08,size:1.3,life:4.8,cols:[5,6]}}]},   // a storm of black glass: mirrors stand round it
  avalanche:{zone:[{prop:{kind:'terrace',n:9,arr:'scatter',rk:0.8,anim:'drop',fall:9,stagger:0.45,size:0.9,life:2.2,cols:[4]}}]},   // a slide of rock
  herdrain:{zone:[{prop:{kind:'terrace',n:10,arr:'scatter',rk:0.8,anim:'drop',fall:11,stagger:0.4,size:0.7,life:2.2,cols:[4]}}]},   // grey stones fall
  mirrorbreak:{cast:[{prop:{kind:'mirror',n:6,arr:'ring',r:3,anim:'collapse',stagger:0.03,size:1.1,life:1.1,cols:[5,6]}},{shake:0.4}]},   // a black mirror smashed at your feet
  anvilstrike:{cast:[{prop:{kind:'anvil',anim:'drop',fall:9,size:2.2,life:1.4,cols:[0,1]}},{shake:{v:0.45,at:0.25}}]},   // the whole storm comes down at once
  snare:{cast:[{prop:{kind:'spear',n:8,arr:'ring',r:3.6,anim:'rise',stagger:0.04,size:0.9,life:1.4,cols:[4,3]}}]},   // thorned roots lash out
  quakeslam:{cast:[{prop:{kind:'fissure',anim:'rise',len:8,life:1.6,cols:[3]}},{shake:0.4}]},
  stonebind:{cast:[{prop:{kind:'spear',n:10,arr:'ring',r:4,anim:'rise',stagger:0.03,size:0.8,life:2.2,cols:[4]}}]},   // stone closes round the feet
  eclipse:{cast:[{prop:{kind:'sun',anim:'hover',h:4,size:1.6,life:0.9,cols:[0x120c1c,0x7a4aa0]}},{flash:{col:0x20102c,a:0.3}}]}   // the light goes out for a heartbeat
};
const skgMix=(c,w)=>new THREE.Color(c).lerp(new THREE.Color(0xffffff),w).getHex();
function skgLook(col){   // the stand-in for a look: the skill's colour, a paler one, and a few earth tones for props
  return {id:'gen',hot:col,hot2:skgMix(col,0.5),cols:[skgMix(col,0.1)&0x7f7f7f|0x303030,col,skgMix(col,0.5),0x2a2230,0x8a8070,0xfff0d0,0x7a2a3a,0xffd36b],pal:{},vis:SKG_BY_ID};
}
function skgCast(s,x,y,z,face,sc,mine){   // a generic skill is cast: its recipe, a beam's repeated hits, and a note for the zone the server starts a moment later
  if(!s||!s.fx||s.set) return;
  const f=s.fx, L=skgLook(elCol(elOf(s)));
  if(f.zone) SKV.cast={s,t:performance.now(),mine};
  skvRunRecipe(L,s,'cast',{x,y,z,face,sc,mine,r:f.ring?f.ring.r:undefined});
  if(f.beam&&f.beam.hits>1){   // "3 hits each": the line of light flares again for every hit after the first
    const B=f.beam, fx=-Math.sin(face), fz=-Math.cos(face), n=Math.min(4,B.hits);
    for(let i=1;i<n;i++) fxpLater(i*0.13,()=>{ fxpLine(x+fx*1.2,y+1.2*sc,z+fz*1.2,x+fx*B.len,y+1.2*sc,z+fz*B.len,L.hot,fxpN(14),0.2); fxpFlare(x+fx*B.len*0.5,y+1.2*sc,z+fz*B.len*0.5,L.hot,1.4,0.2); if(mine) camShake=Math.max(camShake,0.12); });
  }
}
function skgZone(A){   // a generic zone started: pulls and shoves travel as waves, every tick pulses, and its recipe runs
  const c=SKV.cast; if(!c||performance.now()-c.t>3500) return;
  const Z=c.s.fx&&c.s.fx.zone; if(!Z||Math.abs(Z.r-A.r)>0.05) return; SKV.cast=null;
  const el=elOf(c.s), L=skgLook(A.col), pull=Z.kb<0;
  skvRunRecipe(L,c.s,'zone',{x:A.x,y:A.y,z:A.z,face:0,sc:1,mine:c.mine,r:A.r,dur:A.dur});
  if(Z.kb&&!A.follow&&!A.once){ const n=Math.min(8,Math.floor(A.dur/0.8)); for(let i=0;i<n;i++) fxpLater(i*0.8,()=>skvWaveAt(el,A.x,A.z,{shape:'ring',r:A.r,h:0.7,life:0.8,inward:pull,col:A.col})); }   // "drags everything toward the middle" / "shoves it away"
  if(Z.every&&!A.once){ const n=Math.min(12,Math.floor(A.dur/Z.every)), step=A.dur/Math.max(1,n); for(let i=0;i<n;i++) fxpLater(0.1+i*step,()=>fxpRingSparks(A.x,A.y,A.z,A.r*0.8,A.col,fxpN(10),0.35,pull)); }   // "again and again": a pulse for each hit
}
function skgWaveGate(A){   // rain, hail and blizzard fall in waves, as many as the text says; true while a wave is falling
  const n=SKG_WAVES[A.kind]; if(!n) return true;
  const per=A.dur/n, i=Math.floor(A.t/per);
  if(A.wv!==i){ A.wv=i; fxpRingSparks(A.x,A.y,A.z,A.r*0.9,A.col,fxpN(18),0.45,false); fxpFlare(A.x,A.y+1,A.z,A.col,Math.max(2,A.r*0.5),0.25); }
  return (A.t-i*per)/per<0.5;
}
skvCheckVis({id:'gen',vis:SKG_BY_ID});   // (a bad recipe of this table is listed in SKV.bad, which client-smoke fails on)
