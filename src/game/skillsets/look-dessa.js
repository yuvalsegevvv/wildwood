//@ Dessa's skill look (The Anvil in the Road): orange sparks and grey chips fly, slate dust falls, a ring of rivets is laid on the ground
/* Agent map. Outfit: game/outfits/dessa.js, docs/skillkits/looks/dessa.md (slate 0x6b6f78, forge orange 0xd9742a, iron 0x3a3d44, glow 0xffb36b). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('dessa',{
  cols:[0x6b6f78,0xd9742a,0x3a3d44,0xffb36b], hot:0xffb36b, hot2:0xd9742a, decal:'rivets', arcCol:0xd9742a,
  mote:[{sh:'spark',c:3,s:0.2,w:4,add:1,g:1.0},{sh:'pebble',c:0,s:0.1,w:3,g:2.0},{sh:'shard',c:2,s:0.1,w:1,g:1.5},{sh:'ember',c:1,s:0.12,w:2,g:-0.4,add:1}],
  proj:{sh:'pebble',c:2,s:0.3,len:1.0,glow:0,trail:{sh:'spark',c:3,s:0.14,add:1}},
  zone:{mode:'in',rate:20}
});
