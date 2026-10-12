//@ Torgeir's skill look (The Shield-Wall): a round shield flashes in front of him, stone chips and bone shards fly, a wall of slabs rises round him when he taunts, rivets are laid on the ground
/* Agent map. Outfit: game/outfits/torgeir.js, docs/skillkits/looks/torgeir.md (slate 0x3f5668, bone 0xe3dccb, iron 0x5d6168, lichen 0x7d8c5a, one dull ochre bead 0xb59a4a). Engine: game/skillsets/looks.js.
   Anchor Strike shows the shield; every taunt raises the slabs (a ring of stone no more than 7 m away); a shield on a player is a slate-and-lichen bubble. */
ssDefineLook('torgeir',{
  cols:[0x5d6168,0xe3dccb,0x7d8c5a,0x3f5668,0xb59a4a], hot:0xcdbf8a, hot2:0x9fb06a, decal:'rivets', arcCol:0xcdbf8a,
  mote:[{sh:'pebble',c:0x8a8f94,s:0.2,w:3,g:-9,spin:6},{sh:'shard',c:1,s:0.3,w:2,g:-8,spin:5},{sh:'pebble',c:2,s:0.15,w:2,g:-7,spin:6},{sh:'spark',c:4,s:0.18,w:0.7,add:1}],
  proj:{sh:'shard',c:1,s:0.65,len:1.4,glow:4,trail:{sh:'pebble',c:0x8a8f94,s:0.1,g:-6}},
  cone:c=>{ const {L,x,y,z,face,sc}=c, C=c.f.cone;   // the strike: a shield flashes in front, the chips fly
    sslFlash(L,x,y+1.0*sc,z,face,1.8,0.9,0x3f5668,0xe3dccb); spawnArcAt(x,y+0.9*sc,z,face,L.arcCol,C.r/2.6); sslSector(L,x,y+0.4*sc,z,face,C.arc,C.r,16); },
  util:c=>{ const {L,f,x,z}=c;   // a taunt: slabs of stone stand up round him
    if(f.taunt){ sslSlabs(L,x,z,Math.min(f.taunt.r*0.55,7),f.taunt.r>10?10:7,0x6a6e74); spawnRingAt(x,c.gy,z,Math.min(f.taunt.r,10)*0.6,L.hot2); } },
  fxa:(L,o,kind)=>{ const y=o.y||getH(o.x,o.z); if(kind==='shield'){ sslDome(L,o.x,y,o.z,1.3,0x7d8c5a,1.1); sslBurst(L,o.x,y+0.9,o.z,8,2.4); } else { sslBurst(L,o.x,y+0.4,o.z,8,2); } }
});
