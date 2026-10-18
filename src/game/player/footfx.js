//@ Footstep dust, snow powder and wading splashes at the player's feet: a puff a step, a ring on landing, drops while you wade
/* Agent map. updateFootFx(dt) (main/loop.js, after updatePlayer) watches the walk phase P.walk the way the sound driver does (a step every half turn, audio/driver.js) but does not need
   the audio to be running; the puffs are fxpSmoke / fxpAdd particles (combat/fx-pool.js, one draw call for all of them). What the ground throws up follows the land (waLandId: soil, vale
   dust, snow, stone grit, sand, gloam ash) and surfaceAt (audio/ambience.js: 'snow', 'gravel' on paths and plazas, 'water' = wading). Only the player's own feet: nothing here is synced or
   saved, and phones (LITE / LOW) get fewer puffs through fxpN. Test: client-smoke (the loop runs it). */
const FF={lastI:0,wasGround:true,side:1,wadeT:0,vy:0};
const FF_DUST=[0x8a7a58,0xb89c98,0xf0f4f8,0x9a9690,0xd8b878,0x6e6478];   // by waLandId: home, vale, hoar, grey, sun, gloam
function ffColor(x,z,surf){ return surf==='snow'?0xf2f6fa:surf==='gravel'?0xb8ab92:(FF_DUST[waLandId(x,z)]||FF_DUST[0]); }
function ffStep(sp,surf){   // one footfall: a small puff thrown back from the foot that just landed, and a couple of specks
  const dx=P.vx/sp, dz=P.vz/sp, s=(FF.side=-FF.side)*0.11, run=clamp((sp-3)/5), col=ffColor(P.x,P.z,surf), snow=surf==='snow', wet=WX.inten>0.3&&WX.snow<0.3&&surf!=='snow';
  const x=P.x-dz*s-dx*0.12, z=P.z+dx*s-dz*0.12, y=P.y+0.05;
  fxpSmoke(x,y,z,-dx*0.5+AR(-0.15,0.15),0.35+0.4*run,-dz*0.5+AR(-0.15,0.15),col,0.3+0.22*run,0.55+0.3*run,{drag:2.2,grow:2.4,a:(snow?0.5:0.3)*(wet?0.35:1)+0.1*run});
  const n=fxpN(snow?3:2);
  for(let k=0;k<n;k++) fxpSmoke(x+AR(-0.06,0.06),y,z+AR(-0.06,0.06),-dx*AR(0.2,1.2)+AR(-0.5,0.5),AR(0.8,1.6)+run,-dz*AR(0.2,1.2)+AR(-0.5,0.5),snow?0xffffff:col,0.07+0.05*run,0.35+0.2*h3(k,P.walk,1),{g:7,drag:0.6,grow:0.5,a:0.7});
}
function ffLand(sp,surf){   // a ring of dust thrown out where you came down
  const col=ffColor(P.x,P.z,surf), n=fxpN(7), k=clamp(Math.abs(FF.vy)/12,0.4,1);   // (the fall speed of the frame before: updatePlayer has already zeroed P.vy)
  for(let i=0;i<n;i++){ const a=(i+AR(0,1))/n*TAU, v=1.3+AR(0,0.9)*k; fxpSmoke(P.x+Math.cos(a)*0.2,P.y+0.06,P.z+Math.sin(a)*0.2,Math.cos(a)*v,0.3+0.4*k,Math.sin(a)*v,col,0.38+0.2*k,0.6+0.3*k,{drag:2.6,grow:2.2,a:surf==='snow'?0.55:0.34}); }
}
function ffWade(sp,wy){   // drops flung up from the water round your legs
  const n=fxpN(3);
  for(let k=0;k<n;k++){ const a=AR(0,TAU), r=AR(0.15,0.5); fxpAdd(P.x+Math.cos(a)*r,wy+0.02,P.z+Math.sin(a)*r,Math.cos(a)*AR(0.2,1),AR(1.2,2.8)*(0.5+0.12*sp),Math.sin(a)*AR(0.2,1),0xcfe6f4,0.1,0.5,{g:9,drag:0.4,white:0.5,grow:0.35,a:0.8}); }
  fxpSmoke(P.x+AR(-0.3,0.3),wy+0.03,P.z+AR(-0.3,0.3),0,0.05,0,0xe8f2f8,0.45,0.7,{drag:1,grow:2.6,a:0.22});   // a puff of foam
}
function updateFootFx(dt){
  if(!started||customizing||PL.dead) return;
  const sp=Math.hypot(P.vx,P.vz), idx=Math.floor(P.walk/Math.PI), wsf=waterSurf(P.x,P.z), wet=getH(P.x,P.z)<wsf-0.1&&bridgeDeck(P.x,P.z)<wsf;
  if(wet){
    FF.wadeT-=dt; if(sp>0.8&&FF.wadeT<=0){ FF.wadeT=Math.max(0.1,0.34-sp*0.03); ffWade(sp,wsf); }
  } else if(P.ground&&sp>1.2&&idx!==FF.lastI) ffStep(sp,surfaceAt(P.x,P.z));
  if(P.ground&&!FF.wasGround&&!wet) ffLand(sp,surfaceAt(P.x,P.z));
  FF.lastI=idx; FF.wasGround=P.ground; FF.vy=P.vy;
}
