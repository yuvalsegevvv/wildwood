//@ Tansy's skill look (The Harvest): chaff and wheat ears fall and swirl, a wheat-ear ring is laid on the ground, a twine tie closes every field she gathers
/* Agent map. Outfit: game/outfits/tansy.js, docs/skillkits/looks/tansy.md (wheat 0xe0b95a, clay red 0xb5532f, field green 0x7a9a3c, oat 0xece3c8; nothing glows: pure basic). Engine: game/skillsets/looks.js.
   Gather In (a pull) spirals the chaff in, Bumper Crop throws it out and up; the sweep is a wide wheat-gold arc strewing ears. */
ssDefineLook('tansy',{
  cols:[0xe0b95a,0xb5532f,0x7a9a3c,0xece3c8,0xa8803a], hot:0xf2d98a, hot2:0xd9754a, decal:'wheat', arcCol:0xf2d98a,
  mote:[{sh:'ear',c:0,s:0.3,w:3,g:-3.5,sway:1.2},{sh:'chaff',c:4,s:0.22,w:4,g:-3,sway:1.5},{sh:'chaff',c:3,s:0.2,w:3,g:-2.4,sway:1.4},{sh:'chaff',c:1,s:0.18,w:1.5,g:-3},{sh:'chaff',c:2,s:0.17,w:1,g:-3}],
  proj:{sh:'ear',c:0,s:0.8,len:1.1,glow:3,trail:{sh:'chaff',c:4,s:0.16,g:-2.2,sway:1.2}},
  zone:{rate:30},
  zoneEnd:(L,A)=>{ spawnRingAt(A.x,getH(A.x,A.z),A.z,A.r*0.9,L.hot2,true); sslBurst(L,A.x,getH(A.x,A.z)+0.6,A.z,14,3); }   // the twine is pulled tight: a ring closes on the gathered sheaf
});
