//@ The Stone Rift, a Greyspine rift (earth, pays Earth Essence): its tear on the Greyspine's ground, its grey-ochre aura, six earth glass kinds and a Herald
/* agent map: six riftMobDef calls and ONE defineElemRift call. A copy of taproot.js (docs/RIFT.md section 5): the element, the essence, the tear and the colours differ; the shared plan is in shared/rift.js.
   The tear: the main coordinates are on the task card; a backup is checked by tools/rift-smoke.js. Test: tools/rift-smoke.js */
riftMobDef('granitslime','stoneslime','Cairn Slime',{el:'earth',pal:{tint:0xb8a888}});
riftMobDef('cliffboar','stoneboar','Scree Boar',{el:'earth',pal:{tint:0xa8926a}});
riftMobDef('crystalbeetle','stonebeetle','Geode Beetle',{el:'earth',pal:{tint:0xc8a870}});
riftMobDef('stonetreant','stonecairn','Cairn Treant',{el:'earth',pal:{tint:0x9a8a6a}});
riftMobDef('minegoblin','stonegoblin','Quarry Goblin',{el:'earth',pal:{tint:0xb09a70}});
riftMobDef('slatecrawler','stonecrawler','Shale Crawler',{el:'earth',pal:{tint:0x8a8070}});
riftMobDef('granitegolem','stoneherald','Bedrock Herald',{el:'earth',scale:1.5,heavy:true,pal:{tint:0xd8c090}});
defineElemRift({id:'stone',shape:['OOO','OoO','HOO'],   // its platforms: one wide mesa of slabs, open on every side
  name:'The Stone Rift',blurb:'A tear into a void of cut stone and ochre dust. Quarry-born monsters of the earth element pour in, wave after wave. It pays Earth Essence, no XP and no coins.',
  door:{x:-64,z:-484},aura:[0x8a7a6a,0xc2914e,0xe8d0a0],music:'rift',el:'earth',essence:'earth',herald:'stoneherald',
  mobs:['stoneslime','stoneboar','stonebeetle','stonecairn','stonegoblin','stonecrawler']});
