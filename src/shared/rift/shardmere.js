//@ The first rift, the Shardmere: its tear in the home forest's wilds, its aura (blue, purple, pink), its seven glass monsters and which wave each joins
/* agent map: one defineRift call (shared/rift.js) and the rift's glass kinds (riftMobDef: copies of existing kinds); no top-level name but the defs' ids live in ALL_MON_DEFS.
   The tear: found by tools/rift-site.js (flat ground 229 m south-west of the village, off the roads and the coast, 50 m from the nearest camp, in the level-5 zone). Test: tools/rift-smoke.js */
riftMobDef('quartzslime','riftmite','Glass Mite',{el:'water',pal:{tint:0x9ec8ff}});
riftMobDef('beetle','riftbeetle','Shard Beetle',{el:'earth',pal:{tint:0xb9a8ff}});
riftMobDef('lynx','riftfox','Prism Fox',{el:'air',pal:{tint:0xffb0e0}});
riftMobDef('glasswisp','riftwisp','Void Wisp',{el:'light',pal:{tint:0xd8c8ff}});
riftMobDef('gloombat','riftbat','Shard Bat',{el:'dark',pal:{tint:0x9a8cff}});
riftMobDef('hollowkin','riftborn','Riftborn',{el:'dark',pal:{tint:0xc49cff}});
riftMobDef('hollowfaithful','riftherald','Rift Herald',{el:'light',scale:1.5,heavy:true,pal:{tint:0xffc4ec}});
defineRift({id:'shardmere',name:'The Shardmere',blurb:'A tear into a void of glass. Monsters made of glass pour in, wave after wave: three times the XP of the world.',
  door:{x:-124,z:104},aura:[0x5a8cff,0xa86cff,0xff7ac8],music:'rift',herald:'riftherald',
  kinds:[{id:'riftmite',from:1,w:4},{id:'riftbeetle',from:1,w:2},{id:'riftfox',from:2,w:3},{id:'riftwisp',from:3,w:2},{id:'riftbat',from:4,w:2},{id:'riftborn',from:5,w:2}]});
