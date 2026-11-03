//@ Genzo's skill look (The Gate Bell): bronze chimes and cloud-white wisps swirl outward, vermilion scraps and gold glints fly, a ring of rivets is laid on the ground
/* Agent map. Outfit: game/outfits/genzo.js, docs/skillkits/looks/genzo.md (lacquer red 0xb8452a, bronze 0xd2a24a, cloud white 0xf3ead2, dark 0x2a2020, glow 0xf3ead2). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('genzo',{
  cols:[0xb8452a,0xd2a24a,0xf3ead2,0x2a2020,0xe2c27a], hot:0xd2a24a, hot2:0xf3ead2, decal:'rivets', arcCol:0xd2a24a,
  vis:{   // the text: Ring the Hour strikes the bell; Hold the Hour sounds the great bell; Thousand Tolls: the great bell drops over him and rings three times, a gust each
    '2':{cast:[{prop:{kind:'bell',where:'front',d:1.9,anim:'drop',fall:5,size:1.4,life:2,cols:[0,1]}},{wave:{r:12,style:'wind',col:'hot',h:0.7,at:0.3}}]},
    '3':{cast:[{prop:{kind:'bell',anim:'drop',fall:8,size:2.4,life:2.8,cols:[0,1]}},{wave:{r:8,style:'wind',col:'hot',h:1,at:0.35}},{shake:0.45}]},
    ult:{cast:[{prop:{kind:'bell',anim:'drop',fall:12,size:3.4,life:3.4,cols:[0,1]}},{wave:{r:9,style:'wind',col:'hot',h:1.2,at:0.4}},{wave:{r:9,style:'wind',col:'hot2',h:1.2,at:0.9}},{wave:{r:9,style:'wind',col:'hot',h:1.2,at:1.4}},{shake:{v:0.5,at:0.4}},{shake:{v:0.5,at:0.9}},{shake:{v:0.5,at:1.4}}]}
  },
  mote:[{sh:'wisp',c:2,s:0.5,w:3,g:-0.3,sway:2},{sh:'glint',c:1,s:0.2,w:3,add:1},{sh:'pennant',c:0,s:0.3,w:1.5,g:-0.8,sway:1.6},{sh:'disc',c:4,s:0.12,w:2,add:1}],
  proj:{sh:'wisp',c:2,s:0.6,len:1.2,glow:1,trail:{sh:'glint',c:1,s:0.14,add:1}},
  zone:{mode:'out',rate:22}
});
