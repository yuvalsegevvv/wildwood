//@ Hollis's skill look (The Wake Lantern): lantern sparks and fog wisps drift, black crape scraps and amber glints orbit, a ring of waves is laid on the ground
/* Agent map. Outfit: game/outfits/hollis.js, docs/skillkits/looks/hollis.md (crape black 0x2a2630, lamp amber 0xe8a84a, fog 0x9c9aa6, plum 0x3a3548, glow 0xffcf7a). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('hollis',{
  cols:[0x2a2630,0xe8a84a,0x9c9aa6,0xffcf7a,0x3a3548], hot:0xffcf7a, hot2:0xe8a84a, decal:'waves', arcCol:0xe8a84a,
  vis:{   // the text: Dusk Lent rolls the dusk over; The Long Night lights the lanterns all at once; All Souls' Night: a ring of lanterns rises round him and night falls inside
    '2':{cast:[{wave:{r:10,style:'dark',col:0,h:1,life:0.7}},{wave:{r:10,style:'dark',col:3,h:0.6,inward:true,life:0.7,at:0.45}},{rise:{at:0.9}}]},   // the dusk goes out dark and comes home amber
    '3':{cast:[{prop:{kind:'lantern',n:10,arr:'ring',r:6,anim:'rise',stagger:0.05,size:1.1,life:2.4,cols:[3,0,1]}},{wave:{r:12,style:'dark',col:0,h:0.8,life:0.9}},{prop:{kind:'moon',n:1,anim:'hover',h:7,size:1.2,life:2.4,cols:[2,0,3]}},{decal:{r:9,life:6,keep:1,r0:1,spin:0.1,op:0.5}}]},
    ult:{cast:[{prop:{kind:'lantern',n:14,arr:'ring',r:9,anim:'rise',stagger:0.04,size:1.3,life:3.4,cols:[3,0,1]}},{wave:{r:10,style:'dark',col:0,h:1.1,life:1}},{decal:{r:10,life:3}}]}
  },
  mote:[{sh:'wisp',c:2,s:0.55,w:3,g:-0.3,sway:2},{sh:'ribbon',c:0,s:0.6,w:2,g:-0.4,sway:2},{sh:'spark',c:1,s:0.18,w:3,add:1},{sh:'lantern',c:3,s:0.12,w:1,add:1,g:-0.4}],
  proj:{sh:'wisp',c:2,s:0.55,len:1.2,glow:1,trail:{sh:'spark',c:1,s:0.14,add:1}},
  zone:{mode:'orbit',rate:20},
  fxa:(L,o,kind,src,pid)=>{ const y=o.y||getH(o.x,o.z);   // a heal: small lanterns drift down onto the ally; a shield: a ring of fog wisps
    if(kind==='shield'){ slfOrbit(pid,'wisp',L.cols[2],7,{r:0.8,y:0.9,life:1.4,s:0.45,op:0.6}); return; }
    for(let i=0;i<sslN(4);i++) ssPart('lantern',L.cols[3],o.x+sslR(-0.5,0.5),y+sslR(2.2,2.8),o.z+sslR(-0.5,0.5),{v:[0,-1.2,0],add:1,life:1.2,s:0.14,spin:0.5,sway:0.6});
    spawnRingAt(o.x,y+0.1,o.z,0.9,L.hot); }
});
