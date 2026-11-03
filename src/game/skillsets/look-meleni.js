//@ Meleni's skill look (The Tide Chant): turquoise spray and foam wisps drift and drop, shell glints rise, rippling rings are laid on the ground
/* Agent map. Palette: lagoon turquoise 0x2fb4b0, pale cyan 0x7fe8ff, shell cream 0xf2e6c8, deep sea 0x16607a. Engine: game/skillsets/looks.js (data only). */
ssDefineLook('meleni',{
  cols:[0x2fb4b0,0x7fe8ff,0xf2e6c8,0x16607a], hot:0x7fe8ff, hot2:0xf2e6c8, decal:'waves', arcCol:0x7fe8ff,
  vis:{   // the text: the chant brings a surge of water; Call the Tide calls the tide up round your feet; The Great Swell: a wall of green water rises over the target and breaks
    '2':{cast:[{wave:{r:8,style:'water',col:0,h:1,life:0.8}}]},
    '3':{zone:[{wave:{style:'water',col:0,h:0.9,life:1}}]},
    ult:{cast:[{wave:{where:'target',r:8,h:3.2,style:'water',col:0,life:1.2}},{wave:{where:'target',r:8,h:2,style:'water',col:1,inward:true,at:0.55,life:0.9}},{shake:{v:0.4,at:0.6}}]}
  },
  mote:[{sh:'wisp',c:1,s:0.5,w:3,g:-0.2,sway:2},{sh:'drop',c:0,s:0.3,w:3,g:0.8},{sh:'glint',c:2,s:0.16,w:2,add:1},{sh:'bubble',c:2,s:0.2,w:1,g:0.5,sway:1.5}],
  proj:{sh:'wisp',c:1,s:0.5,len:1.2,glow:1,trail:{sh:'drop',c:3,s:0.25}},
  zone:{mode:'orbit',rate:16}
});
