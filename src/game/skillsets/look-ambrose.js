//@ Ambrose's skill look (The Marsh Remedy): dewdrops, rising bubbles and reed blades, ripples that go out and come back, waves laid on the ground, aqua bubbles round a healed or shielded ally
/* Agent map. Outfit: game/outfits/ambrose.js, docs/skillkits/looks/ambrose.md (river green 0x4f7a6a, shell white 0xe6ecea, clay 0xa57b55, aqua 0x7fd0d8, reed 0xcdbd8a). Engine: game/skillsets/looks.js.
   Ebb and Flow sends a ripple out and one in at the same time; High Water is a tide: a thick wave of drops and bubbles from the middle with a column of bubbles rising. A heal lifts bubbles off the ally; a shield is an aqua bubble. */
ssDefineLook('ambrose',{
  cols:[0x4f7a6a,0xe6ecea,0x7fd0d8,0xcdbd8a,0x2f5a52], hot:0x9fe8ee, hot2:0x7fd0d8, decal:'waves', arcCol:0x9fe8ee,
  mote:[{sh:'drop',c:2,s:0.22,w:5,g:-9,op:0.85,spin:2},{sh:'bubble',c:1,s:0.2,w:3,g:1.2,sway:0.8,op:0.45,add:1,spin:0},{sh:'reed',c:0,s:0.4,w:2,g:-3,sway:1.5},{sh:'reed',c:3,s:0.34,w:1.5,g:-3,sway:1.5}],
  proj:{sh:'drop',c:2,s:0.55,len:1,glow:1,trail:{sh:'drop',c:2,s:0.12,g:-6}},
  zone:{mode:'rise',rate:24},
  ring:c=>{ const {L,x,z,f}=c, R=f.ring;   // ripples: one ring out, one ring in (the ebb and the flow); a tide has a column of bubbles
    sslDecal(L,x,z,R.r,{life:0.7,spin:0.6,inward:!!f.pop});
    spawnRingAt(x,c.gy,z,R.r*0.9,L.hot,false); spawnRingAt(x,c.gy,z,R.r*0.7,L.hot2,!!f.pop); spawnRingAt(x,c.gy,z,R.r*0.45,0xe6ecea,false);
    sslRingMotes(L,x,z,R.r,R.r*3.2,null,!!f.pop);
    if(f.heal&&f.heal.v>=0.2) for(let i=0;i<sslN(18);i++) ssPart('bubble',L.cols[1],x+sslR(-0.6,0.6),c.gy+sslR(0,0.6),z+sslR(-0.6,0.6),{v:[0,sslR(2,4),0],g:0.5,life:sslR(1,1.6),s:sslR(0.14,0.3),add:1,op:0.5,sway:1,spin:0}); },
  fxa:(L,o,kind)=>{ const y=o.y||getH(o.x,o.z);
    if(kind==='shield') sslDome(L,o.x,y,o.z,1.25,0x7fd0d8,1.2);
    else { for(let i=0;i<sslN(10);i++) ssPart('bubble',L.cols[1],o.x+sslR(-0.45,0.45),y+sslR(0,0.5),o.z+sslR(-0.45,0.45),{v:[0,sslR(1.2,2.6),0],g:0.4,life:sslR(0.8,1.3),s:sslR(0.1,0.2),add:1,op:0.55,sway:1,spin:0}); spawnRingAt(o.x,y+0.1,o.z,1.0,L.hot2); } }
});
