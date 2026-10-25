//@ Sefi's skill look (The Long Run): sky wisps and gold streaks stream past, feathers and pale glints fly, scalloped wind lines are laid on the ground
/* Agent map. Outfit: game/outfits/sefi.js, docs/skillkits/looks/sefi.md (sand gold 0xe0b040, sky 0xbfe6ff, deep sky 0x5aa0d0, cream 0xf2e6c8). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('sefi',{
  cols:[0xe0b040,0xbfe6ff,0x5aa0d0,0xf2e6c8], hot:0xbfe6ff, hot2:0xe0b040, decal:'scallop', arcCol:0xbfe6ff,
  mote:[{sh:'wisp',c:1,s:0.5,w:3,g:-0.2,sway:2},{sh:'streak',c:0,s:0.5,w:3,add:1},{sh:'feather',c:3,s:0.2,w:2,g:0.6,sway:1.5},{sh:'glint',c:1,s:0.16,w:2,add:1}],
  proj:{sh:'streak',c:1,s:0.5,len:1.4,glow:1,trail:{sh:'wisp',c:2,s:0.3}},
  zone:{mode:'orbit',rate:20}
});
