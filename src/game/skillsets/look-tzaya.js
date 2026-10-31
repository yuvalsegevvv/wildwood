//@ Tzaya's skill look (The Long Count): jade flecks and cinder sparks rise and fall, gold glints flash, a ring of calendar marks is laid on the ground
/* Agent map. Palette: jade 0x2f8a5a, calendar gold 0xd8b040, cinder red 0xb83a28, flame 0xff7a3a. Engine: game/skillsets/looks.js (data only). */
ssDefineLook('tzaya',{
  cols:[0x2f8a5a,0xd8b040,0xb83a28,0xff7a3a], hot:0xff7a3a, hot2:0xd8b040, decal:'flames', arcCol:0xd8b040,
  mote:[{sh:'ember',c:3,s:0.3,w:3,g:-0.4,sway:1},{sh:'pebble',c:0,s:0.22,w:3,g:0.6,sway:1.5},{sh:'glint',c:1,s:0.16,w:2,add:1},{sh:'streak',c:2,s:0.4,w:1,add:1}],
  proj:{sh:'ember',c:3,s:0.5,len:1.2,glow:1,trail:{sh:'pebble',c:1,s:0.3}},
  zone:{mode:'orbit',rate:18}
});
