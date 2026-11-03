//@ Atuqa's skill look (The Terrace Wall): woven red and gold threads and stone flecks drift, sun glints flash, stepped terrace rings are laid on the ground
/* Agent map. Palette: woven red 0xb83a2a, sun gold 0xe8c860, terrace stone 0x8a8478, pale sun 0xfff0b0. Engine: game/skillsets/looks.js (data only). */
ssDefineLook('atuqa',{
  cols:[0xb83a2a,0xe8c860,0x8a8478,0xfff0b0], hot:0xfff0b0, hot2:0xe8c860, decal:'cords', arcCol:0xe8c860,
  vis:{   // the text: Raise the Terrace raises a stone terrace; Hold the Wall a ring of it; Wall of the Sun: a ghost terrace of gold light slams down in a cone
    '1':{hit:[{prop:{kind:'spear',anim:'plant',size:0.5,tilt:0.15,life:1.6,cols:[2,1,1]}}]},
    '2':{cast:[{prop:{kind:'terrace',n:3,arr:'arc',arc:0.8,r:2.9,anim:'rise',stagger:0.08,size:1.1,life:2.2,cols:[1,3,2]}}]},
    '3':{cast:[{prop:{kind:'terrace',n:6,arr:'ring',r:3.5,anim:'rise',stagger:0.05,size:1.4,life:2.8,cols:[1,3,2]}},{shake:0.4}]},
    ult:{cast:[{prop:{kind:'terrace',n:5,arr:'arc',arc:0.8,r:5,anim:'drop',fall:7,size:2.3,stagger:0.06,life:3,cols:[1,3,2]}},{shake:0.5},{wave:{shape:'arc',arc:0.8,r:8,style:'light',col:3,h:1,at:0.3}}]}
  },
  mote:[{sh:'streak',c:0,s:0.4,w:3,add:1},{sh:'pebble',c:2,s:0.22,w:3,g:0.7,sway:1},{sh:'glint',c:3,s:0.18,w:2,add:1},{sh:'feather',c:1,s:0.2,w:1,g:0.5,sway:1.5}],
  proj:{sh:'streak',c:1,s:0.5,len:1.2,glow:1,trail:{sh:'pebble',c:2,s:0.3}},
  zone:{mode:'orbit',rate:14}
});
