//@ Brindle's skill look (The Sun-Glass Belt): amber glints and embers drift, glass shards and light rays fly, a lens is laid on the ground
/* Agent map. Outfit: game/outfits/brindle.js, docs/skillkits/looks/brindle.md (amber 0xd98a2b, rust 0x7a3b1c, brass 0xc9a24a, sun-glass 0xffd27a). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('brindle',{
  cols:[0xd98a2b,0x7a3b1c,0xc9a24a,0xffd27a], hot:0xffd27a, hot2:0xd98a2b, decal:'lens', arcCol:0xffd27a,
  vis:{   // the text: Sun-Glass Burst cracks a glass charge into a burst of focused light; Noon Charge throws the whole belt; High Noon: a huge lens and a sunbeam 30 m long
    '2':{cast:[{wave:{where:'target',r:5,style:'light',col:3,h:0.7,life:0.6}},{rays:{where:'target',n:8,arc:3.14,len:5,col:3,y:0.8}},{decal:{where:'target',r:5,life:3,keep:1,r0:1,spin:0.1,op:0.45}}]},   // the lens lies for the 3 s blaze
    '3':{hit:[{wave:{r:6,style:'fire',col:'hot',h:1.1,life:0.8}},{shaft:{h:6}},{burst:{n:14,spd:6}}]},
    ult:{cast:[{prop:{kind:'lens',where:'front',d:2.6,anim:'hover',h:0.6,size:2,life:2.2,cols:[3,2]}},{wave:{shape:'arc',arc:0.07,r:30,h:0.9,style:'light',col:3,life:0.7,at:0.35}},{flash:{a:0.2}}]}
  },
  mote:[{sh:'glint',c:3,s:0.22,w:4,add:1},{sh:'ember',c:0,s:0.12,w:3,g:-0.6},{sh:'shard',c:2,s:0.1,w:1,g:1.2},{sh:'ray',c:3,s:0.5,w:1,add:1}],
  proj:{sh:'ember',c:3,s:0.3,len:1.0,glow:1,trail:{sh:'glint',c:0,s:0.14,add:1}},
  zone:{mode:'rise',rate:20},
  proc:(L,o,row,mon)=>{   // Fuse Lit: a fuse of sparks runs to the target and a little fire ring goes up; Warm Lenses (every 3 s): one glint, no ring
    if(row.name==='Warm Lenses'){ ssPart('glint',L.hot,o.x,(o.y||getH(o.x,o.z))+2,o.z,{s:0.3,life:0.4,add:1}); return true; }
    if(row.name!=='Fuse Lit'||!mon) return false; const y=(o.y||getH(o.x,o.z))+1.1, h=slfHead(mon);
    sslLine(L,o.x,y,o.z,h.x,h.y,h.z,8,{sh:'spark',c:3,add:1}); skvWave(mon.x,mon.z,{r:5,style:'fire',col:L.hot2,h:0.6,life:0.5}); fxpFlare(h.x,h.y,h.z,L.hot,1,0.25); return true; },
  spent:(L,mon)=>{ const h=slfHead(mon); sslBurst(L,h.x,h.y,h.z,8,3,{sh:'glint',c:3,add:1}); fxpFlare(h.x,h.y+0.3,h.z,L.hot,1.2,0.3); },   // the Glints burst off the target as sun-glass
  ally:(L,o,kind)=>{ if(kind!=='crit'&&kind!=='might') return; const pid=o===P?NET.pid:o.id; slfOrbit(pid,'glint',kind==='crit'?L.hot:L.hot2,6,{add:1,r:0.8,y:1.3,life:1.4}); }   // his aim and his noon: lens glints circle the ally
});
