//@ Sazanka's skill look (The Night Run): crossed moon-grey crescents, ink wisps and vermilion cord flicks, a violet edge; a delivery tag drops where she lands
/* Agent map. Outfit: game/outfits/sazanka.js, docs/skillkits/looks/sazanka.md (ink 0x1b1f2a, indigo 0x2f3f6b, vermilion 0xc23b2a only as cords, moon-grey 0xc9ccd6; glow: dark violet 0x5a4cc0 with white-blue wisps 0xdfe8ff).
   Engine: game/skillsets/looks.js. The motes are dark and drawn with normal blending (additive would hide ink); the arcs and rings are additive in the violet and the white-blue. Dusk Flurry whirls crescents round her. */
ssDefineLook('sazanka',{
  cols:[0x2f3f6b,0xc23b2a,0x1b1f2a,0xc9ccd6,0x5a4cc0,0xdfe8ff], hot:0x7a6cf0, hot2:0xdfe8ff, decal:'cords', arcCol:0xdfe8ff,
  mote:[{sh:'wisp',c:2,s:0.34,w:4,g:0.4,sway:1.0,op:0.85},{sh:'spark',c:3,s:0.2,w:2,add:1},{sh:'streak',c:1,s:0.55,w:2.5,face:true,spin:0},{sh:'wisp',c:5,s:0.22,w:2,add:1,g:0.8,sway:1.2}],
  proj:{sh:'ray',c:3,s:0.9,len:1.2,glow:4,trail:{sh:'wisp',c:2,s:0.2,g:0.3,sway:0.8}},
  zone:{mode:'orbit',rate:44},
  cone:c=>{ const {L,x,y,z,face,sc}=c, C=c.f.cone, n=C.hits||1;   // crescents that cross: white-blue, then violet the other way
    for(let h=0;h<n;h++) spawnArcAt(x,y+(0.8+0.22*h)*sc,z,face+(h-(n-1)/2)*0.5,L.arcCol,C.r/2.4);
    spawnArcAt(x,y+1.0*sc,z,face+0.45,L.hot,C.r/2.6); spawnArcAt(x,y+0.9*sc,z,face-0.45,L.hot,C.r/2.6); sslSector(L,x,y+0.4*sc,z,face,C.arc,C.r,10+C.r*3); },
  dash:c=>{ const {L,x,z,fx,fz,hy}=c;   // the slip: an ink streak behind her and her delivery tag dropping where she lands
    sslLine(L,x-fx*7,hy,z-fz*7,x,hy,z,24); sslBurst(L,x,hy-0.3,z,8,3); spawnRingAt(x,c.gy,z,2.2,L.hot);
    ssPart('tag',0x9a6a3a,x+fx*0.4,hy+0.6,z+fz*0.4,{v:[fx*1.2,2.2,fz*1.2],g:-9,life:0.8,s:0.26,spin:5,floor:true}); },
  zoneTick:(L,A,dt)=>{ A.fl=(A.fl||0)-dt; if(A.fl<=0){ A.fl=0.12; spawnArcAt(A.x,getH(A.x,A.z)+sslR(0.6,1.5),A.z,sslR(0,TAU),Math.random()<0.5?L.arcCol:L.hot,A.r/2.1); } }   // the flurry: crescents whirl round her
});
