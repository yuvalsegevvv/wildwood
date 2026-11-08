//@ The Bulwark Rift, the Amber Reach's rift (pays Armor Reroll Stones): its tear in the Amber Reach's wilds west of Tallgrass, a sky-blue and amber aura, six glass kinds of the savanna and a Herald; mode Heartwood, a broken square round the hub
/* agent map: six riftMobDef calls and ONE defineRift call (reward 'stones', stone 'rsa'). Tear found by tools/rift-site.js --land amber. Test: tools/rift-smoke.js */
riftMobDef('thornboar','bulwarkboar','Plated Boar',{pal:{tint:0xc8dcff}});
riftMobDef('grassstalker','bulwarkstalker','Shield Stalker',{pal:{tint:0xd8d0ff}});
riftMobDef('moundsoldier','bulwarksoldier','Bulwark Soldier',{pal:{tint:0xffd8a0}});
riftMobDef('resinweaver','bulwarkweaver','Amber Weaver',{pal:{tint:0xffc890}});
riftMobDef('sparkwisp','bulwarkwisp','Ward Wisp',{pal:{tint:0xe0f0ff}});
riftMobDef('anvilhawk','bulwarkhawk','Aegis Hawk',{pal:{tint:0xc0d0f8}});
riftMobDef('greyrhino','bulwarkherald','Bastion Herald',{scale:1.4,heavy:true,pal:{tint:0xd8c8b0}});
defineRift({id:'bulwark',name:'The Bulwark Rift',blurb:'A tear into a void of amber glass round a root heart. Hold the heart through ten waves. It pays Armor Reroll Stones, many of them, nothing else.',
  mode:'heart',shape:['.O.','oHo','OoO'],reward:'stones',stone:'rsa',lv:RIFT_STONE_LV,
  door:{x:-1228,z:956},aura:[0x9ad0ff,0xc0a0ff,0xffc890],music:'rift',herald:'bulwarkherald',
  kinds:[{id:'bulwarkboar',from:1,w:4},{id:'bulwarkstalker',from:1,w:2},{id:'bulwarksoldier',from:2,w:3},{id:'bulwarkweaver',from:3,w:2},{id:'bulwarkwisp',from:4,w:2},{id:'bulwarkhawk',from:5,w:2}]});
