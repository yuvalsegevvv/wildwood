//@ Tamsin's skill look (The Rockbreaker): pebbles and grit tumble, dust motes and rope scraps drift, a ring of rivets is laid on the ground
/* Agent map. Outfit: game/outfits/tamsin.js, docs/skillkits/looks/tamsin.md (granite 0x8a8f96, dust 0xd2b48a, rope 0x9a7a4a, ochre 0xc2823a, glow 0xe8d9b8). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('tamsin',{
  cols:[0x8a8f96,0xd2b48a,0xe8d9b8,0xc2823a,0x9a7a4a], hot:0xd2b48a, hot2:0xe8d9b8, decal:'rivets', arcCol:0xc2823a,
  mote:[{sh:'pebble',c:0,s:0.14,w:5,g:2.2,sway:0.3},{sh:'slab',c:4,s:0.1,w:2,g:2.0},{sh:'chaff',c:1,s:0.16,w:4,g:-1.2,sway:2},{sh:'glint',c:2,s:0.14,w:1,add:1}],
  proj:{sh:'pebble',c:0,s:0.5,len:1.1,glow:0,trail:{sh:'chaff',c:1,s:0.14,g:-1}},
  zone:{mode:'in',rate:26}
});
