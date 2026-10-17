//@ Genzo's skill look (The Gate Bell): bronze chimes and cloud-white wisps swirl outward, vermilion scraps and gold glints fly, a ring of rivets is laid on the ground
/* Agent map. Outfit: game/outfits/genzo.js, docs/skillkits/looks/genzo.md (lacquer red 0xb8452a, bronze 0xd2a24a, cloud white 0xf3ead2, dark 0x2a2020, glow 0xf3ead2). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('genzo',{
  cols:[0xb8452a,0xd2a24a,0xf3ead2,0x2a2020,0xe2c27a], hot:0xd2a24a, hot2:0xf3ead2, decal:'rivets', arcCol:0xd2a24a,
  mote:[{sh:'wisp',c:2,s:0.5,w:3,g:-0.3,sway:2},{sh:'glint',c:1,s:0.2,w:3,add:1},{sh:'pennant',c:0,s:0.3,w:1.5,g:-0.8,sway:1.6},{sh:'disc',c:4,s:0.12,w:2,add:1}],
  proj:{sh:'wisp',c:2,s:0.6,len:1.2,glow:1,trail:{sh:'glint',c:1,s:0.14,add:1}},
  zone:{mode:'out',rate:22}
});
