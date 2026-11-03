//@ Sabir's skill look (The Caravan Raid): embers and flame tongues, crimson cloth scraps and coin glints fly, a three-tongued flame ring is laid on the ground
/* Agent map. Outfit: game/outfits/sabir.js, docs/skillkits/looks/sabir.md (crimson 0xa8322a, sand 0xd2b27a, indigo 0x23233a, brass 0xc89a3c, ember glow 0xff8a3a). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('sabir',{
  cols:[0xa8322a,0xd2b27a,0xff8a3a,0xc89a3c,0x23233a], hot:0xff8a3a, hot2:0xffd070, decal:'flames', arcCol:0xff8a3a,
  vis:{   // the text: Powder Keg is a keg that bursts; The Whole Caravan drops five kegs in a row that go off one after another
    '3':{hit:[{prop:{kind:'keg',anim:'drop',fall:1.2,fallT:0.1,size:1.2,life:0.4,cols:[4,2]}},{wave:{r:6,style:'fire',col:'hot',h:1.4,life:0.7}},{burst:{n:16,spd:6}}]},
    ult:{cast:[{prop:{kind:'keg',n:5,arr:'line',len2:9,anim:'drop',fall:1.4,fallT:0.12,stagger:0.13,size:1.3,life:1.5,cols:[4,2]}},
      {ring:{where:'front',d:1.8,r:3.5,at:0.6,col:'hot'}},{burst:{where:'front',d:1.8,n:8,spd:5,at:0.6}},{ring:{where:'front',d:3.6,r:3.5,at:0.76,col:'hot'}},{burst:{where:'front',d:3.6,n:8,spd:5,at:0.76}},
      {ring:{where:'front',d:5.4,r:3.5,at:0.92,col:'hot'}},{burst:{where:'front',d:5.4,n:8,spd:5,at:0.92}},{ring:{where:'front',d:7.2,r:3.5,at:1.08,col:'hot'}},{burst:{where:'front',d:7.2,n:8,spd:5,at:1.08}},
      {ring:{where:'front',d:9,r:3.5,at:1.24,col:'hot'}},{burst:{where:'front',d:9,n:8,spd:5,at:1.24}},{shake:{v:0.35,at:1.24}}]}
  },
  mote:[{sh:'ember',c:2,s:0.12,w:5,add:1,g:2.2,sway:0.6},{sh:'flame',c:2,s:0.28,w:2,add:1,g:1.4,sway:0.8},{sh:'pennant',c:0,s:0.3,w:1.5,g:-1,sway:1.6},{sh:'glint',c:3,s:0.18,w:2,add:1},{sh:'chaff',c:1,s:0.14,w:2,g:-1.5,sway:2}],
  proj:{sh:'ember',c:2,s:0.55,len:1.4,glow:1,trail:{sh:'flame',c:2,s:0.2,g:1.5,add:1}},
  zone:{mode:'rise',rate:24}
});
