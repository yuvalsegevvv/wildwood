//@ Hollis's skill look (The Wake Lantern): lantern sparks and fog wisps drift, black crape scraps and amber glints orbit, a ring of waves is laid on the ground
/* Agent map. Outfit: game/outfits/hollis.js, docs/skillkits/looks/hollis.md (crape black 0x2a2630, lamp amber 0xe8a84a, fog 0x9c9aa6, plum 0x3a3548, glow 0xffcf7a). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('hollis',{
  cols:[0x2a2630,0xe8a84a,0x9c9aa6,0xffcf7a,0x3a3548], hot:0xffcf7a, hot2:0xe8a84a, decal:'waves', arcCol:0xe8a84a,
  vis:{   // the text: Dusk Lent rolls the dusk over; The Long Night lights the lanterns all at once; All Souls' Night: a ring of lanterns rises round him and night falls inside
    '2':{cast:[{wave:{r:10,style:'dark',col:0,h:1,life:0.9}}]},
    '3':{cast:[{prop:{kind:'lantern',n:10,arr:'ring',r:6,anim:'rise',stagger:0.05,size:1.1,life:2.4,cols:[3,0,1]}},{wave:{r:12,style:'dark',col:0,h:0.8,life:0.9}}]},
    ult:{cast:[{prop:{kind:'lantern',n:14,arr:'ring',r:9,anim:'rise',stagger:0.04,size:1.3,life:3.4,cols:[3,0,1]}},{wave:{r:10,style:'dark',col:0,h:1.1,life:1}},{decal:{r:10,life:3}}]}
  },
  mote:[{sh:'wisp',c:2,s:0.55,w:3,g:-0.3,sway:2},{sh:'ribbon',c:0,s:0.6,w:2,g:-0.4,sway:2},{sh:'spark',c:1,s:0.18,w:3,add:1},{sh:'lantern',c:3,s:0.12,w:1,add:1,g:-0.4}],
  proj:{sh:'wisp',c:2,s:0.55,len:1.2,glow:1,trail:{sh:'spark',c:1,s:0.14,add:1}},
  zone:{mode:'orbit',rate:20}
});
