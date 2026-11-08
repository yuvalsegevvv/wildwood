//@ The Blade Rift, the Gloamhorn's rift (pays Weapon Reroll Stones): its tear in the Gloamhorn's wilds west of Wraithwick, a steel-blue and violet aura, six glass kinds of the dusk and a Herald (the colossus); mode Quarry, a long cross
/* agent map: six riftMobDef calls and ONE defineRift call (reward 'stones', stone 'rsw': shared/rift.js riftStonesFull). Tear found by tools/rift-site.js --land gloam. Test: tools/rift-smoke.js */
riftMobDef('brineslime','bladeslime','Steel Slime',{pal:{tint:0xa8c0ff}});
riftMobDef('gloomcrab','bladecrab','Edge Crab',{pal:{tint:0x9ab0f0}});
riftMobDef('wrecker','bladewrecker','Blade Wrecker',{pal:{tint:0xb8b0ff}});
riftMobDef('banshee','bladebanshee','Keening Edge',{pal:{tint:0xd0c8ff}});
riftMobDef('gravehound','bladehound','Steel Hound',{pal:{tint:0x9aa8e8}});
riftMobDef('hollowknight','bladeknight','Hollow Blade',{pal:{tint:0xb0a0f0}});
riftMobDef('gargoyle','bladeherald','Anvil Colossus',{scale:1.6,heavy:true,pal:{tint:0xa8a0e0}});
defineRift({id:'blade',name:'The Blade Rift',blurb:'A tear into a void of cold steel-blue glass. A colossus walks it behind four pylons. It pays Weapon Reroll Stones, many of them, nothing else.',
  mode:'quarry',shape:['.O.','.o.','OHO','.o.','.O.'],reward:'stones',stone:'rsw',lv:RIFT_STONE_LV,
  door:{x:-868,z:-568},aura:[0x7a9cff,0x9a7aff,0xd0a0ff],music:'rift',herald:'bladeherald',
  kinds:[{id:'bladeslime',from:1,w:4},{id:'bladecrab',from:1,w:2},{id:'bladewrecker',from:2,w:3},{id:'bladebanshee',from:3,w:2},{id:'bladehound',from:4,w:2},{id:'bladeknight',from:5,w:2}]});
