//@ Sefi's skill look (The Long Run): sky wisps and gold streaks stream past, feathers and pale glints fly, scalloped wind lines are laid on the ground
/* Agent map. Outfit: game/outfits/sefi.js, docs/skillkits/looks/sefi.md (sand gold 0xe0b040, sky 0xbfe6ff, deep sky 0x5aa0d0, cream 0xf2e6c8). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('sefi',{
  cols:[0xe0b040,0xbfe6ff,0x5aa0d0,0xf2e6c8], hot:0xbfe6ff, hot2:0xe0b040, decal:'scallop', arcCol:0xbfe6ff,
  vis:{   // the text: a gust carries her; Photo Finish: three dashes back and forth through the target, each faster
    '2':{cast:[{wave:{shape:'arc',arc:0.35,r:10,style:'wind',col:'hot',h:0.6,life:0.5}}]},
    '3':{cast:[{wave:{shape:'arc',arc:0.15,r:12,style:'wind',col:1,h:0.7,life:0.5}}]},
    ult:{cast:[{wave:{where:'target',shape:'arc',arc:0.12,r:10,style:'wind',col:'hot',h:0.8,life:0.45}},{wave:{where:'target',shape:'arc',arc:0.12,r:10,rot:3.14,style:'wind',col:'hot2',h:0.8,life:0.4,at:0.4}},{wave:{where:'target',shape:'arc',arc:0.12,r:10,style:'wind',col:'hot',h:0.8,life:0.3,at:0.7}},{burst:{where:'target',n:18,spd:6,at:0.7}}]}
  },
  mote:[{sh:'wisp',c:1,s:0.5,w:3,g:-0.2,sway:2},{sh:'streak',c:0,s:0.5,w:3,add:1},{sh:'feather',c:3,s:0.2,w:2,g:0.6,sway:1.5},{sh:'glint',c:1,s:0.16,w:2,add:1}],
  proj:{sh:'streak',c:1,s:0.5,len:1.4,glow:1,trail:{sh:'wisp',c:2,s:0.3}},
  zone:{mode:'orbit',rate:20}
});
