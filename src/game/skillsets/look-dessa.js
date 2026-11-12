//@ Dessa's skill look (The Anvil in the Road): orange sparks and grey chips fly, slate dust falls, a ring of rivets is laid on the ground
/* Agent map. Outfit: game/outfits/dessa.js, docs/skillkits/looks/dessa.md (slate 0x6b6f78, forge orange 0xd9742a, iron 0x3a3d44, glow 0xffb36b). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('dessa',{
  cols:[0x6b6f78,0xd9742a,0x3a3d44,0xffb36b], hot:0xffb36b, hot2:0xd9742a, decal:'rivets', arcCol:0xd9742a,
  vis:{   // the text: Anvil Down sets an anvil in the road; Break the Herd breaks a stampede; Strike While Hot: a glowing anvil falls on the target
    '1':{cast:[{burst:{where:'front',d:1.6,n:8,spd:4,y:0.4}},{wave:{shape:'arc',arc:0.6,r:4,style:'dust',col:0,h:0.4,life:0.4}}]},   // the hammer lands: forge sparks and a short dust crest
    '2':{zone:[{prop:{kind:'anvil',anim:'drop',fall:7,size:1.8,cols:[2,3]}}]},
    '3':{cast:[{wave:{r:8,style:'dust',col:0,h:1.3,life:0.9}},{slabs:{r:4,n:8,col:0}},{shake:0.35},{prop:{kind:'anvil',anim:'drop',fall:5,size:1.2,life:1.6,cols:[2,3]}},{decal:{r:4,life:8,keep:1,r0:1,spin:0.05,op:0.35}}]},   // the herd breaks on the anvil; the rivets lie for the 8 s guard
    ult:{cast:[{prop:{kind:'anvil',where:'target',anim:'drop',fall:12,size:2.6,life:3,cols:[2,3]}},{wave:{where:'target',r:7,style:'dust',col:0,h:1.2,at:0.3}},{shake:{v:0.5,at:0.3}}]}
  },
  mote:[{sh:'spark',c:3,s:0.2,w:4,add:1,g:1.0},{sh:'pebble',c:0,s:0.1,w:3,g:2.0},{sh:'shard',c:2,s:0.1,w:1,g:1.5},{sh:'ember',c:1,s:0.12,w:2,g:-0.4,add:1}],
  proj:{sh:'pebble',c:2,s:0.3,len:1.0,glow:0,trail:{sh:'spark',c:3,s:0.14,add:1}},
  zone:{mode:'in',rate:20},
  proc:(L,o,row,mon)=>{   // Hot Iron: sparks leap round her; The Anvil Holds: a glowing anvil drops at her feet and a dome rises
    const y=o.y||getH(o.x,o.z);
    if(row.name==='Hot Iron'){ sslRingMotes(L,o.x,o.z,4,sslN(10),{sh:'spark',c:3,add:1}); spawnRingAt(o.x,y+0.1,o.z,4,L.hot2); return true; }
    if(row.name!=='The Anvil Holds') return false; skpSpawn('anvil',o.x,o.z,{anim:'drop',fall:6,size:1.4,life:2,cols:[L.cols[2],L.hot]}); sslDome(L,o.x,y,o.z,1.6,L.hot2,1.2); sslBurst(L,o.x,y+1,o.z,10,3); return true; },
  spent:(L,mon)=>{ if(!P||P.dead) return; const h=slfHead(mon); slfCord(h,{x:P.x,y:P.y+1.1,z:P.z},L.hot,{sh:'spark',n:7,add:1,s:0.24,life:0.35,sag:0.4}); }   // the Temper flies home as sparks (the blow heals her)
});
