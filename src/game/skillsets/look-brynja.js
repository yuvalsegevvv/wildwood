//@ Brynja's skill look (The Rime Run): ice shards and snow flurries fly, pale blue sparks and glints cross, a ring of wave lines is laid on the ground
/* Agent map. Outfit: game/outfits/brynja.js, docs/skillkits/looks/brynja.md (ice 0x6fb4e0, snow 0xeaf4fb, slate 0x3c4a5a, fur 0xb8a890, glow 0xb8e6ff). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('brynja',{
  cols:[0x6fb4e0,0xeaf4fb,0xb8e6ff,0x3c4a5a,0xb8a890], hot:0xb8e6ff, hot2:0xeaf4fb, decal:'waves', arcCol:0xb8e6ff,
  vis:{   // the text: Whiteout bursts a blizzard over a circle; Avalanche Run: a full circle of frost round the target that then shatters inward
    '3':{hit:[{wave:{r:6,style:'wind',col:1,h:0.9,life:0.8}},{prop:{kind:'icewall',n:6,arr:'ring',r:2.6,anim:'rise',stagger:0.05,size:0.8,life:1.3,cols:[2]}}]},
    ult:{cast:[{prop:{kind:'icewall',n:16,arr:'ring',r:8,where:'target',anim:'collapse',stagger:0.05,size:1.1,life:2.6,cols:[2]}},{ring:{where:'target',r:8,col:1}},{shake:{v:0.4,at:1.5}}]}
  },
  mote:[{sh:'shard',c:0,s:0.2,w:4,g:1.0,sway:0.4},{sh:'chaff',c:1,s:0.14,w:4,g:-1.4,sway:2},{sh:'glint',c:2,s:0.18,w:3,add:1},{sh:'streak',c:2,s:0.4,w:1,add:1}],
  proj:{sh:'shard',c:0,s:0.5,len:1.3,glow:1,trail:{sh:'chaff',c:1,s:0.12,g:-1}},
  zone:{mode:'rise',rate:24}
});
