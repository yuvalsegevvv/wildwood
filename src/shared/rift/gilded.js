//@ The Gilded Rift, the Sunscar's rift (pays coins): its tear in the Sunscar's wilds west of Glasswell, a gold and rose aura, six glass kinds of the desert and a Herald; mode Gale, a comb of platforms
/* agent map: six riftMobDef calls and ONE defineRift call (reward 'coins': shared/rift.js RIFT_COIN_*). Tear found by tools/rift-site.js --land sun. Test: tools/rift-smoke.js */
riftMobDef('sandslime','gildslime','Gilded Slime',{pal:{tint:0xffd88a}});
riftMobDef('gildedscarab','gildscarab','Coin Scarab',{pal:{tint:0xffc860}});
riftMobDef('dunescorpion','gildscorpion','Gilt Scorpion',{pal:{tint:0xf0b070}});
riftMobDef('duneprowler','gildfox','Glint Prowler',{pal:{tint:0xffe0a0}});
riftMobDef('raider','gildraider','Gilded Raider',{pal:{tint:0xf8c890}});
riftMobDef('dustdjinn','gilddjinn','Gold Djinn',{pal:{tint:0xffd0b0}});
riftMobDef('sandgolem','gildherald','Hoard Herald',{scale:1.5,heavy:true,pal:{tint:0xffc870}});
defineRift({id:'gilded',name:'The Gilded Rift',blurb:'A tear into a void of gold-lit glass. Monsters of gilded glass pour in on the wind: every one is worth twelve times the coins of the world. It pays coins, nothing else.',
  mode:'gale',shape:['O.O.O','ooooo','..H..'],reward:'coins',lv:RIFT_COIN_LV,
  door:{x:-580,z:68},aura:[0xffd27a,0xffb05a,0xff8fb8],music:'rift',herald:'gildherald',
  kinds:[{id:'gildslime',from:1,w:4},{id:'gildscarab',from:1,w:2},{id:'gildscorpion',from:2,w:3},{id:'gildfox',from:3,w:2},{id:'gildraider',from:4,w:2},{id:'gilddjinn',from:5,w:2}]});
