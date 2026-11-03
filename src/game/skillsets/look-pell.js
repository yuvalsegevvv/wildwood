//@ Pell's skill look (The Lantern Spear): embers and flame tongues drift up, reed flecks and river-cream glints fly, a ring of lens rings is laid on the ground
/* Agent map. Outfit: game/outfits/pell.js, docs/skillkits/looks/pell.md (tar 0x2a2420, torch orange 0xe0762a, cream 0xe9dfc4, reed 0x8a7a44, ember glow 0xffb45a). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('pell',{
  cols:[0xe0762a,0xe9dfc4,0xffb45a,0x8a7a44,0x2a2420], hot:0xffb45a, hot2:0xffd9a0, decal:'lens', arcCol:0xffb45a,
  vis:{   // the text: Dim the Lamp swings the lantern low; the Night Pool spear is thrown and stands where it lands; Lantern Flood: the spear in the ground and a pool of fire
    '2':{cast:[{prop:{kind:'lantern',where:'front',d:1,anim:'rise',size:1.3,life:0.6,cols:[2,4,1]}}]},
    '3':{hit:[{prop:{kind:'spear',anim:'plant',size:0.9,tilt:0.35,life:2.4,cols:[3,1,0]}},{wave:{r:3.5,style:'fire',col:'hot',h:0.8}}]},
    ult:{cast:[{prop:{kind:'spear',where:'target',anim:'plant',fall:11,size:1.5,tilt:0.3,life:3.4,cols:[3,1,0]}},{wave:{where:'target',r:8,style:'fire',col:'hot',h:0.6,at:0.3,life:1.3}},{rise:{where:'target',n:16,r:6,at:0.4}}]}
  },
  mote:[{sh:'ember',c:2,s:0.12,w:5,add:1,g:2.0,sway:0.6},{sh:'flame',c:0,s:0.26,w:2,add:1,g:1.4,sway:0.8},{sh:'reed',c:3,s:0.3,w:2,g:-1,sway:1.4},{sh:'glint',c:1,s:0.16,w:2,add:1}],
  proj:{sh:'ember',c:2,s:0.5,len:1.3,glow:1,trail:{sh:'flame',c:0,s:0.18,g:1.5,add:1}},
  zone:{mode:'rise',rate:22}
});
