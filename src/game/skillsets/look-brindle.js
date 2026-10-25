//@ Brindle's skill look (The Sun-Glass Belt): amber glints and embers drift, glass shards and light rays fly, a lens is laid on the ground
/* Agent map. Outfit: game/outfits/brindle.js, docs/skillkits/looks/brindle.md (amber 0xd98a2b, rust 0x7a3b1c, brass 0xc9a24a, sun-glass 0xffd27a). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('brindle',{
  cols:[0xd98a2b,0x7a3b1c,0xc9a24a,0xffd27a], hot:0xffd27a, hot2:0xd98a2b, decal:'lens', arcCol:0xffd27a,
  mote:[{sh:'glint',c:3,s:0.22,w:4,add:1},{sh:'ember',c:0,s:0.12,w:3,g:-0.6},{sh:'shard',c:2,s:0.1,w:1,g:1.2},{sh:'ray',c:3,s:0.5,w:1,add:1}],
  proj:{sh:'ember',c:3,s:0.3,len:1.0,glow:1,trail:{sh:'glint',c:0,s:0.14,add:1}},
  zone:{mode:'rise',rate:20}
});
