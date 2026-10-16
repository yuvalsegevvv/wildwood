//@ Ottoline's skill look (The Porcelain Hour): black ribbons and lace scraps, violet sparks and thread streaks, cords looped round a ring on the ground; porcelain-white glints
/* Agent map. Outfit: game/outfits/ottoline.js, docs/skillkits/looks/ottoline.md (black 0x1c1822, porcelain 0xf3eee8, blood rose 0x8a1f3d, violet glow 0xb06ad8). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('ottoline',{
  cols:[0x2a2234,0xf3eee8,0x8a1f3d,0xb06ad8,0xb9b6c4], hot:0xb06ad8, hot2:0xf3eee8, decal:'cords', arcCol:0xb06ad8,
  mote:[{sh:'ribbon',c:0,s:0.7,w:3,g:-0.4,sway:2},{sh:'ribbon',c:2,s:0.55,w:2,g:-0.4,sway:2},{sh:'spark',c:3,s:0.2,w:3,add:1},{sh:'chaff',c:1,s:0.16,w:3,g:-1.4,sway:2},{sh:'streak',c:3,s:0.5,w:1,add:1}],
  proj:{sh:'streak',c:3,s:0.5,len:1.4,glow:1,trail:{sh:'spark',c:3,s:0.14,add:1}},
  zone:{mode:'orbit',rate:20}
});
