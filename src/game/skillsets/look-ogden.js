//@ Ogden's skill look (The Grave Shift): drops of grave-water, bubbles, bone shards and mould specks, a double wave line laid on the ground; the swell pulls in
/* Agent map. Outfit: game/outfits/ogden.js, docs/skillkits/looks/ogden.md (moss 0x6f8f6b, bone 0xe5e0c8, rot brown 0x5a4632, drowned teal 0x4fd0c0). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('ogden',{
  cols:[0x6f8f6b,0xe5e0c8,0x4fd0c0,0x5a4632,0x3a7a7a], hot:0x4fd0c0, hot2:0xe5e0c8, decal:'waves', arcCol:0x6f8f6b,
  mote:[{sh:'drop',c:2,s:0.16,w:4,add:1,g:3},{sh:'bubble',c:4,s:0.18,w:3,add:1,g:-0.6,sway:1},{sh:'shard',c:1,s:0.16,w:2,g:3},{sh:'chaff',c:0,s:0.14,w:3,g:-1,sway:2},{sh:'pebble',c:3,s:0.1,w:1,g:3}],
  proj:{sh:'bone',c:1,s:0.4,len:1,glow:0,trail:{sh:'drop',c:2,s:0.14,g:2,add:1}},
  zone:{mode:'in',rate:26}
});
