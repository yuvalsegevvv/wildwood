//@ Sabir's skill look (The Caravan Raid): embers and flame tongues, crimson cloth scraps and coin glints fly, a three-tongued flame ring is laid on the ground
/* Agent map. Outfit: game/outfits/sabir.js, docs/skillkits/looks/sabir.md (crimson 0xa8322a, sand 0xd2b27a, indigo 0x23233a, brass 0xc89a3c, ember glow 0xff8a3a). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('sabir',{
  cols:[0xa8322a,0xd2b27a,0xff8a3a,0xc89a3c,0x23233a], hot:0xff8a3a, hot2:0xffd070, decal:'flames', arcCol:0xff8a3a,
  mote:[{sh:'ember',c:2,s:0.12,w:5,add:1,g:2.2,sway:0.6},{sh:'flame',c:2,s:0.28,w:2,add:1,g:1.4,sway:0.8},{sh:'pennant',c:0,s:0.3,w:1.5,g:-1,sway:1.6},{sh:'glint',c:3,s:0.18,w:2,add:1},{sh:'chaff',c:1,s:0.14,w:2,g:-1.5,sway:2}],
  proj:{sh:'ember',c:2,s:0.55,len:1.4,glow:1,trail:{sh:'flame',c:2,s:0.2,g:1.5,add:1}},
  zone:{mode:'rise',rate:24}
});
