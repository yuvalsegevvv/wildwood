//@ Pell's skill look (The Lantern Spear): embers and flame tongues drift up, reed flecks and river-cream glints fly, a ring of lens rings is laid on the ground
/* Agent map. Outfit: game/outfits/pell.js, docs/skillkits/looks/pell.md (tar 0x2a2420, torch orange 0xe0762a, cream 0xe9dfc4, reed 0x8a7a44, ember glow 0xffb45a). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('pell',{
  cols:[0xe0762a,0xe9dfc4,0xffb45a,0x8a7a44,0x2a2420], hot:0xffb45a, hot2:0xffd9a0, decal:'lens', arcCol:0xffb45a,
  vis:{   // the text: Dim the Lamp swings the lantern low; the Night Pool spear is thrown and stands where it lands; Lantern Flood: the spear in the ground and a pool of fire
    '2':{cast:[{prop:{kind:'lantern',where:'front',d:1,anim:'rise',size:1.3,life:0.6,cols:[2,4,1]}}],hit:[{decal:{r:2.4,life:4,keep:1,r0:1,spin:0.1,op:0.5}},{rise:{n:8,r:1.2}}]},   // the flare's lens lies for the 4 s burn
    '3':{hit:[{prop:{kind:'spear',anim:'plant',size:0.9,tilt:0.35,life:2.4,cols:[3,1,0]}},{wave:{r:3.5,style:'fire',col:'hot',h:0.8}}]},
    ult:{cast:[{prop:{kind:'spear',where:'target',anim:'plant',fall:11,size:1.5,tilt:0.3,life:3.4,cols:[3,1,0]}},{wave:{where:'target',r:8,style:'fire',col:'hot',h:0.6,at:0.3,life:1.3}},{rise:{where:'target',n:16,r:6,at:0.4}}]}
  },
  mote:[{sh:'ember',c:2,s:0.12,w:5,add:1,g:2.0,sway:0.6},{sh:'flame',c:0,s:0.26,w:2,add:1,g:1.4,sway:0.8},{sh:'reed',c:3,s:0.3,w:2,g:-1,sway:1.4},{sh:'glint',c:1,s:0.16,w:2,add:1}],
  proj:{sh:'ember',c:2,s:0.5,len:1.3,glow:1,trail:{sh:'flame',c:0,s:0.18,g:1.5,add:1}},
  zone:{mode:'rise',rate:22},
  proc:(L,o,row,mon)=>{   // The Pool Burns: a fire wave 6 m round the target and flames rising
    if(row.name!=='The Pool Burns') return false; const m=mon||o; skvWave(m.x,m.z,{r:6,style:'fire',col:L.hot,h:0.8,life:0.7});
    for(let i=0;i<sslN(10);i++){ const a=sslR(0,TAU), d=Math.sqrt(Math.random())*5, x=m.x+Math.sin(a)*d, z=m.z+Math.cos(a)*d; ssEmit(L,x,getH(x,z)+0.2,z,{sh:'flame',c:0,add:1,v:[0,sslR(1.5,3),0],life:sslR(0.6,1)}); } return true; },
  spent:(L,mon)=>{ const h=slfHead(mon); for(let i=0;i<sslN(4);i++) ssPart('lantern',L.hot,h.x+sslR(-0.4,0.4),h.y,h.z+sslR(-0.4,0.4),{v:[0,sslR(1.5,2.5),0],s:0.3,life:1.1,add:1,spin:1}); }   // the Lures lift off the target as lantern lights
});
