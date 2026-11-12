//@ Zahra's skill look (The Hour of Glass): gold glints and falling sand drift, lapis flecks and light rays fly, a gold dial is laid on the ground
/* Agent map. Outfit: game/outfits/zahra.js, docs/skillkits/looks/zahra.md (gold 0xe8c050, lapis 0x2b6aa8, white 0xf4efe0, sand 0xd6b87a, glow 0xfff0b0). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('zahra',{
  cols:[0xe8c050,0x2b6aa8,0xf4efe0,0xd6b87a,0xfff0b0], hot:0xfff0b0, hot2:0xe8c050, decal:'dial', arcCol:0xe8c050,
  vis:{   // the text: Long Noon turns a mirror on your friends; The Sandglass is planted at your feet; Shattered Hour: a giant sandglass breaks over the target and rains glass
    '2':{cast:[{prop:{kind:'mirror',where:'front',d:1.5,anim:'rise',size:1.5,life:1.3,cols:[4,3]}},{rays:{n:9,arc:1.2,len:10,col:4}}]},
    '3':{zone:[{prop:{kind:'sandglass',anim:'rise',size:1.4,cols:[3,0]}},{decal:{rk:1,life:8,keep:1,r0:1,spin:0.1,op:0.55}},{rays:{n:6,arc:2.9,len:9,col:4,at:0.2}},{rays:{n:6,arc:2.9,len:9,col:4,at:4}}]},   // the dial lies for the 8 s and the glass flashes all round twice
    ult:{cast:[{prop:{kind:'sandglass',where:'target',anim:'hover',h:8,size:3.3,life:1.5,cols:[3,0]}},{burst:{where:'target',y:6,n:30,spd:7,at:1.1}},{wave:{where:'target',r:9,style:'light',col:4,h:0.8,at:1.1}},{shake:{v:0.4,at:1.1}}]}
  },
  mote:[{sh:'glint',c:0,s:0.22,w:4,add:1},{sh:'chaff',c:3,s:0.12,w:4,g:2.0,sway:0.5},{sh:'ray',c:4,s:0.6,w:1,add:1},{sh:'shard',c:1,s:0.1,w:1,g:1.5}],
  proj:{sh:'ray',c:4,s:0.6,len:1.4,glow:1,trail:{sh:'glint',c:0,s:0.16,add:1}},
  zone:{mode:'out',rate:20},
  zoneTick:(L,A)=>{ if(A.src!=='zahra_3_any') return; const b=Math.floor(A.t); if(b===A.glare) return; A.glare=b; let n=0;   // synergy: the dazzle: a glare at the eyes of each monster in the glass, every second
    for(const m of MON_BY_ID.values()){ if(n>=8) break; if(!m.dead&&Math.hypot(m.x-A.x,m.z-A.z)<A.r){ slfGlare(m,L.cols[0]); n++; } } },
  ally:(L,o,kind,dur,src,v)=>{ if(kind==='guard'&&v>0.10+1e-6){ const y=o.y||getH(o.x,o.z); spawnRingAt(o.x,y+0.1,o.z,1.7,L.cols[1]); } }   // synergy: a thicker guard (the Grain near): a second, wider lapis ring
});
