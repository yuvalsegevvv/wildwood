//@ The Charm Rift, the Emberwake Isles' rift (pays Accessory Reroll Stones): its tear on the isles east of Coralhaven, a sea-cyan and coral aura, six glass kinds of the isles and a Herald; mode Lanterns, a double comb
/* agent map: six riftMobDef calls and ONE defineRift call (reward 'stones', stone 'rsr'). Tear found by tools/rift-site.js --land isles. Test: tools/rift-smoke.js */
riftMobDef('coralbeetle','charmbeetle','Coral Charm',{pal:{tint:0xa0f0ff}});
riftMobDef('lagoonray','charmray','Lagoon Glint',{pal:{tint:0x90e0f8}});
riftMobDef('stonejaguar','charmjaguar','Jade Jaguar',{pal:{tint:0xb0ffe0}});
riftMobDef('junglehog','charmhog','Trinket Hog',{pal:{tint:0xffc0d8}});
riftMobDef('reefraider','charmraider','Bead Raider',{pal:{tint:0xc0d8ff}});
riftMobDef('ropespinner','charmspinner','Thread Spinner',{pal:{tint:0xe0c8ff}});
riftMobDef('roadsentinel','charmherald','Talisman Herald',{scale:1.4,heavy:true,pal:{tint:0xd0f0ff}});
defineRift({id:'charm',name:'The Charm Rift',blurb:'A tear into a dark void of sea-glass. Break the four shadow cores in the dark. It pays Accessory Reroll Stones, many of them, nothing else.',
  mode:'lanterns',shape:['O.o.O','ooooo','..H..','ooooo','O.o.O'],reward:'stones',stone:'rsr',lv:RIFT_STONE_LV,
  door:{x:440,z:1460},aura:[0x6ae0ff,0xa080ff,0xff80c0],music:'rift',herald:'charmherald',
  kinds:[{id:'charmbeetle',from:1,w:4},{id:'charmray',from:1,w:2},{id:'charmjaguar',from:2,w:3},{id:'charmhog',from:3,w:2},{id:'charmraider',from:4,w:2},{id:'charmspinner',from:5,w:2}]});
