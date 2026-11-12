//@ Ogden's skill look (The Grave Shift): drops of grave-water, bubbles, bone shards and mould specks, a double wave line laid on the ground; the swell pulls in
/* Agent map. Outfit: game/outfits/ogden.js, docs/skillkits/looks/ogden.md (moss 0x6f8f6b, bone 0xe5e0c8, rot brown 0x5a4632, drowned teal 0x4fd0c0). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('ogden',{
  cols:[0x6f8f6b,0xe5e0c8,0x4fd0c0,0x5a4632,0x3a7a7a], hot:0x4fd0c0, hot2:0xe5e0c8, decal:'waves', arcCol:0x6f8f6b,
  vis:{   // the text: Open Grave is a sinking pit; Feeding Frenzy a wave of grave-water; Exhumation: geysers burst up and hands reach out of the mud
    '2':{zone:[{wave:{style:'dust',col:3,h:0.5,inward:true,life:0.9}},{wave:{style:'dust',col:3,h:0.4,inward:true,life:0.9,at:2}},{decal:{rk:1,life:4,keep:1,r0:1,spin:0.1,op:0.55}}]},
    '3':{cast:[{wave:{r:10,style:'water',col:2,h:1.1,life:0.9}},{wave:{r:10,style:'water',col:2,h:0.6,inward:true,life:0.8,at:0.4}},{prop:{kind:'hand',n:5,arr:'scatter',r:5,anim:'rise',stagger:0.08,at:0.5,size:0.9,life:5,cols:[3]}}],zone:[{decal:{rk:1,life:5,keep:1,r0:1,spin:0.1,op:0.5}}]},   // out, back to him (the mend), hands in the mud for the swell's 5 s
    ult:{cast:[{prop:{kind:'geyser',n:6,arr:'ring',r:5,anim:'rise',stagger:0.1,life:2.2,cols:[2],h3:4}},{prop:{kind:'hand',n:9,arr:'scatter',r:6.5,anim:'rise',stagger:0.07,at:0.4,size:1.4,life:3.4,cols:[3]}},{shake:0.4},{wave:{r:10,style:'water',col:2,h:1,life:1}}]}
  },
  mote:[{sh:'drop',c:2,s:0.16,w:4,add:1,g:3},{sh:'bubble',c:4,s:0.18,w:3,add:1,g:-0.6,sway:1},{sh:'shard',c:1,s:0.16,w:2,g:3},{sh:'chaff',c:0,s:0.14,w:3,g:-1,sway:2},{sh:'pebble',c:3,s:0.1,w:1,g:3}],
  proj:{sh:'bone',c:1,s:0.4,len:1,glow:0,trail:{sh:'drop',c:2,s:0.14,g:2,add:1}},
  zone:{mode:'in',rate:26},
  fxa:(L,o,kind,src)=>{ if(kind!=='heal'||src!=='ogden_1_warrior') return false;   // synergy: the sweep's mend: bubbles drift from the nearest rotted monster to him, more for the Rot near
    let best=null, bd=7; for(const [id,e] of SSV.marks){ const m=e.rot&&MON_BY_ID.get(id); if(!m||m.dead) continue; const d=Math.hypot(m.x-o.x,m.z-o.z); if(d<bd){ bd=d; best=m; } }
    if(!best) return; const n=Math.min(5,2+Math.floor(slfNear('rot',o.x,o.z,6)/2)), h=slfHead(best), y=(o.y||getH(o.x,o.z))+1;
    for(let i=0;i<sslN(n);i++){ const q=sslR(0,0.3); ssPart('bubble',L.cols[4],h.x+(o.x-h.x)*q,h.y,h.z+(o.z-h.z)*q,{v:[(o.x-h.x)*2,(y-h.y)*2+0.5,(o.z-h.z)*2],add:1,life:0.45,s:0.18,op:0.7,spin:0}); } }
});
