//@ Class flair for the generic skills (the shop's and the bosses'): steel and dust for the warrior, wind lines and feathers for the archer, an arcane spiral for the mage, on top of the skill's own effects
/* Agent map. skfCast(gs,x,y,z,face,sc,mine) runs from attackVisuals (combat/attacks.js, for the shop skills) and from fxVisuals (combat/skill-fx.js, for a skill with generic fx and no set look: a set piece wears its set's look instead).
   gs is the skill row (ACT_SKILL[kind]): gs.cls picks the flair, gs.el its colour, a ring / dash / big multiplier makes it heavy. Body movement of the same skills: combat/skill-move.js. Test: client-smoke. */
function skfCast(gs,x,y,z,face,sc,mine){
  if(!gs||gs.set||!gs.cls) return;
  const f=gs.fx||{}, g=getH(x,z), col=elCol(elOf(gs)), fx_=-Math.sin(face), fz_=-Math.cos(face), cls=gs.cls, heavy=!!(f.ring||f.dash)||(gs.mult||0)>=2, hy=y+1.1*sc;
  if(cls==='warrior'){   // steel: a clash of sparks where the weapon is, dust kicked up by the stance, a heavy blow cracks and scorches the ground in front
    const hx=x+fx_*1.1, hz=z+fz_*1.1;
    fxxDust(x,g,z,heavy?9:4,heavy?3.5:2,0x9a8a70);
    fxpFlare(hx,hy,hz,0xfff0c8,heavy?1.8:1.2,0.18); fxpSparks(hx,hy,hz,0xffd890,heavy?10:5,4.5,{size:0.14,life:0.35});
    if(heavy){ fxxScorch(x+fx_*1.6,z+fz_*1.6,1.6+(f.ring?Math.min(3,f.ring.r*0.2):0),0x3a2a1a); fxxDebris(x,g,z,fxpN(8),4,0x6a5030); if(mine) camShake=Math.max(camShake,0.2); }
  } else if(cls==='archer'){   // wind: streaks stream back past the shoulders, a glint where the string was drawn, feathers drift down behind
    for(let i=0,n=fxpN(5);i<n;i++){ const s=AR(-0.5,0.5), hh=AR(0.7,1.6)*sc, bx=x-fx_*0.3-fz_*s, bz=z-fz_*0.3+fx_*s, l=AR(1.2,2.2); fxpLine(bx,y+hh,bz,bx-fx_*l,y+hh,bz-fz_*l,0xe8f6d8,5,0.1); }
    fxpFlare(x+fx_*0.5,hy+0.1,z+fz_*0.5,0xf4ffe0,0.9,0.15);
    for(let i=0,n=fxpN(4);i<n;i++) fxpAdd(x-fx_*0.4+AR(-0.4,0.4),y+AR(1.0,1.8)*sc,z-fz_*0.4+AR(-0.4,0.4),AR(-0.3,0.3)-fx_*0.4,0.2,AR(-0.3,0.3)-fz_*0.4,i%2?0xdfe8c8:0xb8d89a,0.12,AR(0.7,1.1),{g:-1.2,drag:1.5});
    if(f.zone||f.proj&&f.proj.n>2) spawnRingAt(x,g,z,1.6,0xcfe8b8);   // (an area or a fan: a gust ring too)
  } else if(cls==='mage'){   // arcane: motes spiral up round the caster in the skill's colour, a flare at the hand
    for(let i=0;i<8;i++) fxpLater(i*0.035,()=>{ const a=face+i*0.8, r=0.85-i*0.045; fxpAdd(x+Math.sin(a)*r,g+0.2+i*0.22*sc,z+Math.cos(a)*r,0,0.6,0,i%2?0xffffff:col,0.22,0.5,{grow:-0.2}); });
    fxpFlare(x+fx_*0.55,hy+0.1,z+fz_*0.55,col,1.1,0.2);
  }
}
