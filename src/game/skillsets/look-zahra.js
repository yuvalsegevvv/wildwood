//@ Zahra's skill look (The Hour of Glass): gold glints and falling sand drift, lapis flecks and light rays fly, a gold dial is laid on the ground
/* Agent map. Outfit: game/outfits/zahra.js, docs/skillkits/looks/zahra.md (gold 0xe8c050, lapis 0x2b6aa8, white 0xf4efe0, sand 0xd6b87a, glow 0xfff0b0). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('zahra',{
  cols:[0xe8c050,0x2b6aa8,0xf4efe0,0xd6b87a,0xfff0b0], hot:0xfff0b0, hot2:0xe8c050, decal:'dial', arcCol:0xe8c050,
  mote:[{sh:'glint',c:0,s:0.22,w:4,add:1},{sh:'chaff',c:3,s:0.12,w:4,g:2.0,sway:0.5},{sh:'ray',c:4,s:0.6,w:1,add:1},{sh:'shard',c:1,s:0.1,w:1,g:1.5}],
  proj:{sh:'ray',c:4,s:0.6,len:1.4,glow:1,trail:{sh:'glint',c:0,s:0.16,add:1}},
  zone:{mode:'out',rate:20}
});
