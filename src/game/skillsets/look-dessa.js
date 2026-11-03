//@ Dessa's skill look (The Anvil in the Road): orange sparks and grey chips fly, slate dust falls, a ring of rivets is laid on the ground
/* Agent map. Outfit: game/outfits/dessa.js, docs/skillkits/looks/dessa.md (slate 0x6b6f78, forge orange 0xd9742a, iron 0x3a3d44, glow 0xffb36b). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('dessa',{
  cols:[0x6b6f78,0xd9742a,0x3a3d44,0xffb36b], hot:0xffb36b, hot2:0xd9742a, decal:'rivets', arcCol:0xd9742a,
  vis:{   // the text: Anvil Down sets an anvil in the road; Break the Herd breaks a stampede; Strike While Hot: a glowing anvil falls on the target
    '2':{zone:[{prop:{kind:'anvil',anim:'drop',fall:7,size:1.8,cols:[2,3]}}]},
    '3':{cast:[{wave:{r:8,style:'dust',col:0,h:1.3,life:0.9}},{slabs:{r:4,n:8,col:0}},{shake:0.35}]},
    ult:{cast:[{prop:{kind:'anvil',where:'target',anim:'drop',fall:12,size:2.6,life:3,cols:[2,3]}},{wave:{where:'target',r:7,style:'dust',col:0,h:1.2,at:0.3}},{shake:{v:0.5,at:0.3}}]}
  },
  mote:[{sh:'spark',c:3,s:0.2,w:4,add:1,g:1.0},{sh:'pebble',c:0,s:0.1,w:3,g:2.0},{sh:'shard',c:2,s:0.1,w:1,g:1.5},{sh:'ember',c:1,s:0.12,w:2,g:-0.4,add:1}],
  proj:{sh:'pebble',c:2,s:0.3,len:1.0,glow:0,trail:{sh:'spark',c:3,s:0.14,add:1}},
  zone:{mode:'in',rate:20}
});
