//@ Sabir's skill look (The Caravan Raid): embers and flame tongues, crimson cloth scraps and coin glints fly, a three-tongued flame ring is laid on the ground
/* Agent map. Outfit: game/outfits/sabir.js, docs/skillkits/looks/sabir.md (crimson 0xa8322a, sand 0xd2b27a, indigo 0x23233a, brass 0xc89a3c, ember glow 0xff8a3a). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('sabir',{
  cols:[0xa8322a,0xd2b27a,0xff8a3a,0xc89a3c,0x23233a], hot:0xff8a3a, hot2:0xffd070, decal:'flames', arcCol:0xff8a3a,
  vis:{
    '2':{cast:[{dust:{n:8,r:1.6}},{wave:{shape:'arc',arc:0.4,r:9,style:'fire',col:'hot',h:0.5,life:0.45}},{swing:{n:1,r:3.4,col:'hot',at:0.25}},{decal:{r:3.4,life:4,keep:1,r0:1,spin:0.1,op:0.5,at:0.25}}]},   // the raid: a dash of dust, a raider's arc, the flames lie for the 4 s blaze
    // the text: Powder Keg is a keg that bursts; The Whole Caravan drops five kegs in a row that go off one after another
    '3':{hit:[{prop:{kind:'keg',anim:'drop',fall:1.2,fallT:0.1,size:1.2,life:0.4,cols:[4,2]}},{wave:{r:6,style:'fire',col:'hot',h:1.4,life:0.7}},{burst:{n:16,spd:6}}]},
    ult:{cast:[{prop:{kind:'keg',n:5,arr:'line',len2:9,anim:'drop',fall:1.4,fallT:0.12,stagger:0.13,size:1.3,life:1.5,cols:[4,2]}},
      {ring:{where:'front',d:1.8,r:3.5,at:0.6,col:'hot'}},{burst:{where:'front',d:1.8,n:8,spd:5,at:0.6}},{ring:{where:'front',d:3.6,r:3.5,at:0.76,col:'hot'}},{burst:{where:'front',d:3.6,n:8,spd:5,at:0.76}},
      {ring:{where:'front',d:5.4,r:3.5,at:0.92,col:'hot'}},{burst:{where:'front',d:5.4,n:8,spd:5,at:0.92}},{ring:{where:'front',d:7.2,r:3.5,at:1.08,col:'hot'}},{burst:{where:'front',d:7.2,n:8,spd:5,at:1.08}},
      {ring:{where:'front',d:9,r:3.5,at:1.24,col:'hot'}},{burst:{where:'front',d:9,n:8,spd:5,at:1.24}},{shake:{v:0.35,at:1.24}}]}
  },
  mote:[{sh:'ember',c:2,s:0.12,w:5,add:1,g:2.2,sway:0.6},{sh:'flame',c:2,s:0.28,w:2,add:1,g:1.4,sway:0.8},{sh:'pennant',c:0,s:0.3,w:1.5,g:-1,sway:1.6},{sh:'glint',c:3,s:0.18,w:2,add:1},{sh:'chaff',c:1,s:0.14,w:2,g:-1.5,sway:2}],
  proj:{sh:'ember',c:2,s:0.55,len:1.4,glow:1,trail:{sh:'flame',c:2,s:0.2,g:1.5,add:1}},
  zone:{mode:'rise',rate:24},
  proc:(L,o,row,mon)=>{   // Quick Fingers: one coin flicked home; Fence the Goods: a ring of coins and a fire crest 6 m
    const m=mon||o, h=mon?slfHead(mon):{x:o.x,y:(o.y||getH(o.x,o.z))+1,z:o.z}, y=(o.y||getH(o.x,o.z))+1.1;
    if(row.name==='Quick Fingers'){ slfCord(h,{x:o.x,y,z:o.z},L.cols[3],{sh:'disc',n:1,s:0.22,life:0.3}); return true; }
    if(row.name!=='Fence the Goods') return false; sslRingMotes(L,m.x,m.z,3,sslN(12),{sh:'disc',c:3}); skvWave(m.x,m.z,{r:6,style:'fire',col:L.hot,h:0.7,life:0.5}); return true; },
  spent:(L,mon)=>{ if(!P||P.dead) return; const h=slfHead(mon); slfCord(h,{x:P.x,y:P.y+1.1,z:P.z},L.cols[3],{sh:'disc',n:7,s:0.24,life:0.4,sag:0.8}); }   // the Loot spills home as gold coins
});
