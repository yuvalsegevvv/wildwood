//@ Meleni's skill look (The Tide Chant): turquoise spray and foam wisps drift and drop, shell glints rise, rippling rings are laid on the ground
/* Agent map. Palette: lagoon turquoise 0x2fb4b0, pale cyan 0x7fe8ff, shell cream 0xf2e6c8, deep sea 0x16607a. Engine: game/skillsets/looks.js (data only). */
ssDefineLook('meleni',{
  cols:[0x2fb4b0,0x7fe8ff,0xf2e6c8,0x16607a], hot:0x7fe8ff, hot2:0xf2e6c8, decal:'waves', arcCol:0x7fe8ff,
  mote:[{sh:'wisp',c:1,s:0.5,w:3,g:-0.2,sway:2},{sh:'drop',c:0,s:0.3,w:3,g:0.8},{sh:'glint',c:2,s:0.16,w:2,add:1},{sh:'bubble',c:2,s:0.2,w:1,g:0.5,sway:1.5}],
  proj:{sh:'wisp',c:1,s:0.5,len:1.2,glow:1,trail:{sh:'drop',c:3,s:0.25}},
  zone:{mode:'orbit',rate:16}
});
