//@ Corvin's skill look (The Lamplight): a fan of lamp-white rays, brass dust and plumb lines, a measuring dial laid on the ground, a column of noon light, shutter bars sweeping the field
/* Agent map. Outfit: game/outfits/corvin.js, docs/skillkits/looks/corvin.md (brass 0xc9a13a, charcoal 0x2b2b2e, lamp white 0xfff1c9, verdigris 0x5f8f7f). Engine: game/skillsets/looks.js.
   Flash Lens fans rays; Open the Shutter lays the dial and sweeps parallel light bars with plumb lines dropping; Noon raises the column and a ring of rays. */
ssDefineLook('corvin',{
  cols:[0xc9a13a,0x5f8f7f,0xfff1c9,0x2b2b2e,0xffffff], hot:0xfff1c9, hot2:0xe6c86a, decal:'dial', arcCol:0xfff1c9,
  mote:[{sh:'spark',c:2,s:0.25,w:4,add:1,g:0.3},{sh:'glint',c:4,s:0.2,w:1.5,add:1},{sh:'ember',c:0,s:0.1,w:3,add:1,g:0.8,sway:0.6},{sh:'tick',c:0,s:0.28,w:1.5,g:-2}],
  proj:{sh:'ray',c:0,s:0.9,len:1.1,glow:2,trail:{sh:'ember',c:2,s:0.1,g:0.5,add:1}},
  zone:{rate:20},
  cone:c=>{ const {L,x,y,z,face,sc}=c, C=c.f.cone;   // the flash: lamp-white spikes fan out from the lantern shield
    spawnArcAt(x,y+0.9*sc,z,face,L.arcCol,C.r/2.6); sslRays(L,x-Math.sin(face)*0.7,y+1.0*sc,z-Math.cos(face)*0.7,face,C.arc*0.9,5,C.r*1.2,L.hot); sslBurst(L,x-Math.sin(face)*(C.r*0.8),y+1.0*sc,z-Math.cos(face)*(C.r*0.8),6,2.4,{sh:'glint',c:4,add:1}); },
  muzzle:c=>{ const {L,hx,hy,hz}=c; ssPart('glint',L.hot,hx,hy,hz,{s:0.9,s1:0.2,add:1,life:0.3,spin:2}); sslBurst(L,hx,hy,hz,4,1.6); },   // a lens flare at the hand
  ring:c=>{ const {L,x,z,f}=c, R=f.ring;   // Noon: the dial, a column of light and a ring of rays on the ground
    sslDecal(L,x,z,R.r,{life:0.9,spin:0.5}); sslShaft(L,x,z,22,L.hot); for(let i=0;i<14;i++) sslRays(L,x,c.gy+0.3,z,i/14*TAU,0,1,R.r*0.8,L.hot,{life:0.5});
    spawnRingAt(x,c.gy,z,R.r*0.85,L.hot); spawnRingAt(x,c.gy,z,R.r*0.5,L.hot2); sslRingMotes(L,x,z,R.r,R.r*2.5); },
  fxa:(L,o)=>{ sslBurst(L,o.x,(o.y||getH(o.x,o.z))+1,o.z,6,1.8); },
  zoneTick:(L,A,dt)=>{ A.fl=(A.fl||0)-dt; if(A.fl<=0){ A.fl=0.09;   // the shutter: parallel bars of light across the field, and plumb lines dropping
      const off=sslR(-A.r*0.8,A.r*0.8), px=A.x+off*0.7, pz=A.z+off*0.7;
      ssPart('ray',L.hot,px,getH(px,pz)+0.5,pz,{s:A.r*1.7,add:1,life:0.35,spin:0,op:0.5,rot:[Math.PI/2,Math.PI*0.75,0,'YXZ']});
      if(Math.random()<0.5){ const a=sslR(0,TAU), d=Math.sqrt(Math.random())*A.r, qx=A.x+Math.sin(a)*d, qz=A.z+Math.cos(a)*d; ssPart('tick',0xc9a13a,qx,getH(qx,qz)+6,qz,{v:[0,-16,0],life:0.4,s:0.55,spin:0,floor:true,fout:0.5,rot:[0,0,0]}); } } }
});
