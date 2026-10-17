//@ Pell's skill look (The Lantern Spear): embers and flame tongues drift up, reed flecks and river-cream glints fly, a ring of lens rings is laid on the ground
/* Agent map. Outfit: game/outfits/pell.js, docs/skillkits/looks/pell.md (tar 0x2a2420, torch orange 0xe0762a, cream 0xe9dfc4, reed 0x8a7a44, ember glow 0xffb45a). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('pell',{
  cols:[0xe0762a,0xe9dfc4,0xffb45a,0x8a7a44,0x2a2420], hot:0xffb45a, hot2:0xffd9a0, decal:'lens', arcCol:0xffb45a,
  mote:[{sh:'ember',c:2,s:0.12,w:5,add:1,g:2.0,sway:0.6},{sh:'flame',c:0,s:0.26,w:2,add:1,g:1.4,sway:0.8},{sh:'reed',c:3,s:0.3,w:2,g:-1,sway:1.4},{sh:'glint',c:1,s:0.16,w:2,add:1}],
  proj:{sh:'ember',c:2,s:0.5,len:1.3,glow:1,trail:{sh:'flame',c:0,s:0.18,g:1.5,add:1}},
  zone:{mode:'rise',rate:22}
});
