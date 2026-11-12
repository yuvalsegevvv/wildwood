//@ Brynja's skill look (The Rime Run): ice shards and snow flurries fly, pale blue sparks and glints cross, a ring of wave lines is laid on the ground
/* Agent map. Outfit: game/outfits/brynja.js, docs/skillkits/looks/brynja.md (ice 0x6fb4e0, snow 0xeaf4fb, slate 0x3c4a5a, fur 0xb8a890, glow 0xb8e6ff). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('brynja',{
  cols:[0x6fb4e0,0xeaf4fb,0xb8e6ff,0x3c4a5a,0xb8a890], hot:0xb8e6ff, hot2:0xeaf4fb, decal:'waves', arcCol:0xb8e6ff,
  vis:{   // the text: Whiteout bursts a blizzard over a circle; Avalanche Run: a full circle of frost round the target that then shatters inward
    '2':{cast:[{wave:{shape:'arc',arc:0.3,r:9,style:'water',col:2,h:0.4,life:0.45}},{prop:{kind:'icewall',n:5,arr:'ring',r:3.4,anim:'rise',size:0.5,life:4,cols:[2]}},{decal:{r:3.4,life:4,keep:1,r0:1,spin:0.2,op:0.55}}]},   // combo: the skate trail, then a low ring of ice that stands for the 4 s chill (the window to shatter)
    brynja_2_any_h:{cast:[{wave:{shape:'arc',arc:0.22,r:12,style:'water',col:2,h:0.5,life:0.6}},{slabs:{where:'front',d:4,r:1,n:3,col:2}},{slabs:{where:'front',d:8,r:1,n:3,col:2,at:0.1}},{slabs:{where:'front',d:11,r:1,n:3,col:2,at:0.2}}]},   // Frost Line: ice heaves up along the line
    '3':{hit:[{wave:{r:6,style:'wind',col:1,h:0.9,life:0.8}},{prop:{kind:'icewall',n:8,arr:'ring',r:2.6,anim:'collapse',stagger:0.04,size:1.0,life:1.3,cols:[2]}},{flash:{}}]},
    ult:{cast:[{prop:{kind:'icewall',n:16,arr:'ring',r:8,where:'target',anim:'collapse',stagger:0.05,size:1.1,life:2.6,cols:[2]}},{ring:{where:'target',r:8,col:1}},{shake:{v:0.4,at:1.5}}]}
  },
  mote:[{sh:'shard',c:0,s:0.2,w:4,g:1.0,sway:0.4},{sh:'chaff',c:1,s:0.14,w:4,g:-1.4,sway:2},{sh:'glint',c:2,s:0.18,w:3,add:1},{sh:'streak',c:2,s:0.4,w:1,add:1}],
  proj:{sh:'shard',c:0,s:0.5,len:1.3,glow:1,trail:{sh:'chaff',c:1,s:0.12,g:-1}},
  zone:{mode:'rise',rate:24},
  proc:(L,o,row,mon)=>{   // Shatter: the chilled target bursts into shards with a wave closing on it; Cold Read: the default streak
    if(row.name!=='Shatter'||!mon) return false; const h=slfHead(mon);
    sslBurst(L,h.x,h.y,h.z,16,6,{sh:'shard',c:2}); fxpFlare(h.x,h.y,h.z,L.hot,1.6,0.3); skvWave(mon.x,mon.z,{r:3,style:'water',col:L.cols[2],h:0.7,life:0.4,inward:true});
    if(Math.hypot(P.x-mon.x,P.z-mon.z)<25) camShake=Math.max(camShake,0.25); return true; }
});
