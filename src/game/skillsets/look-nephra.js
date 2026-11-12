//@ Nephra's skill look (The Linen Rite): linen strips and dust drift and swirl, lapis flecks and gold glints fly, a gold-and-lapis dial is laid on the ground; a shield is a linen-cream bubble
/* Agent map. Outfit: game/outfits/nephra.js, docs/skillkits/looks/nephra.md (linen 0xe3d5b0, lapis 0x2f55a0, gold 0xd4a83a, turquoise glow 0x6fd6c8). Engine: game/skillsets/looks.js (data only: no override functions). */
ssDefineLook('nephra',{
  cols:[0xe3d5b0,0x2f55a0,0xd4a83a,0x6fd6c8,0xb89c68], hot:0xd4a83a, hot2:0x6fd6c8, decal:'dial', arcCol:0xe3d5b0,
  vis:{   // the text: Salve for Sand pulls the linen tight; Rise Again is a wave of dust; Sealed Tomb slams a sarcophagus of sand shut around the target
    '2':{cast:[{wave:{r:8,style:'dust',col:0,h:0.7,inward:true,life:0.8}},{swing:{n:5,gap:0.05,r:8,turn:6.28,col:0}},{rise:{at:0.5}}]},   // five linen arcs closing
    '3':{cast:[{wave:{r:10,style:'dust',col:4,h:1.2,life:0.9}},{prop:{kind:'sarcophagus',n:1,anim:'rise',size:1.2,life:1.6,cols:[0,2,1]}},{rays:{n:8,arc:2.9,len:9,col:2,at:0.4}},{decal:{r:9,life:8,keep:1,r0:1,spin:0.1,op:0.5}}]},
    ult:{cast:[{prop:{kind:'sarcophagus',where:'target',anim:'drop',fall:8,size:2.3,life:3.2,cols:[0,2,1]}},{wave:{where:'target',r:6,style:'dust',col:4,h:1,at:0.3}},{shake:0.4}]}
  },
  mote:[{sh:'ribbon',c:0,s:0.7,w:3,g:-0.5,sway:2},{sh:'chaff',c:4,s:0.14,w:4,g:-1.2,sway:2},{sh:'glint',c:2,s:0.2,w:2,add:1},{sh:'pebble',c:1,s:0.1,w:1,g:2}],
  proj:{sh:'ribbon',c:0,s:0.6,len:1.2,glow:0,trail:{sh:'chaff',c:4,s:0.12,g:-1}},
  zone:{mode:'in',rate:22},
  fxa:(L,o,kind,src,pid)=>{ if(kind!=='shield') return false;   // synergy: a linen shield: ribbons wind round the player, more of them the thicker it is (the Linen near)
    const n=slfNear('linen',o.x,o.z,14), thick=src==='nephra_1_mage'?n>=3:true; slfOrbit(pid,'ribbon',L.cols[0],thick?9:4,{r:0.75,y:0.8,life:1.4,s:0.6,op:0.8,w:3.5}); }
});
