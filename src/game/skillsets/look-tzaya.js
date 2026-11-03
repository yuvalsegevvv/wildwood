//@ Tzaya's skill look (The Long Count): jade flecks and cinder sparks rise and fall, gold glints flash, a ring of calendar marks is laid on the ground
/* Agent map. Palette: jade 0x2f8a5a, calendar gold 0xd8b040, cinder red 0xb83a28, flame 0xff7a3a. Engine: game/skillsets/looks.js (data only). */
ssDefineLook('tzaya',{
  cols:[0x2f8a5a,0xd8b040,0xb83a28,0xff7a3a], hot:0xff7a3a, hot2:0xd8b040, decal:'flames', arcCol:0xd8b040,
  vis:{   // the text: Fire Pit is a pit of coals; The Reckoning a wave of fire; The Fifth Sun: fire geysers burst up and hands of ash reach out of the ground
    '2':{zone:[{wave:{style:'fire',col:'hot',h:0.5,inward:true,life:0.9}}]},
    ult:{cast:[{prop:{kind:'geyser',n:6,arr:'ring',r:5,anim:'rise',stagger:0.1,life:2.2,cols:[3],h3:4.5}},{prop:{kind:'hand',n:9,arr:'scatter',r:6.5,anim:'rise',stagger:0.07,at:0.4,size:1.4,life:3.4,cols:[0x55504a]}},{shake:0.4},{wave:{r:10,style:'fire',col:'hot',h:1,life:1}}]}
  },
  mote:[{sh:'ember',c:3,s:0.3,w:3,g:-0.4,sway:1},{sh:'pebble',c:0,s:0.22,w:3,g:0.6,sway:1.5},{sh:'glint',c:1,s:0.16,w:2,add:1},{sh:'streak',c:2,s:0.4,w:1,add:1}],
  proj:{sh:'ember',c:3,s:0.5,len:1.2,glow:1,trail:{sh:'pebble',c:1,s:0.3}},
  zone:{mode:'orbit',rate:18}
});
