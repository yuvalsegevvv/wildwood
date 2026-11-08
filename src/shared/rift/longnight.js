//@ The Long-Night Rift, a Hoarfrost Reach rift (dark, pays Dark Essence): its tear on the Reach's plateau, its violet night aura, six dark glass kinds and a Herald
/* agent map: six riftMobDef calls and ONE defineElemRift call. A copy of taproot.js (docs/RIFT.md section 5): the element, the essence, the tear and the colours differ; the shared plan is in shared/rift.js.
   The tear: the main coordinates are on the task card; a backup is checked by tools/rift-smoke.js. Test: tools/rift-smoke.js */
riftMobDef('frostslime','nightslime','Gloam Slime',{el:'dark',pal:{tint:0x6a60b8}});
riftMobDef('snowboar','nightboar','Dusk Boar',{el:'dark',pal:{tint:0x5a4a98}});
riftMobDef('icebeetle','nightbeetle','Umbral Beetle',{el:'dark',pal:{tint:0x7a6ac8}});
riftMobDef('wolf','nightwolf','Starless Wolf',{el:'dark',pal:{tint:0x5a5ab0}});
riftMobDef('rimewisp','nightwisp','Polar Wisp',{el:'dark',pal:{tint:0x9a8ae0}});
riftMobDef('reaver','nightreaver','Longnight Reaver',{el:'dark',pal:{tint:0x6a52a8}});
riftMobDef('yeti','nightherald','Midwinter Herald',{el:'dark',scale:1.5,heavy:true,pal:{tint:0x8a70d8}});
defineElemRift({id:'longnight',name:'The Long-Night Rift',blurb:'A tear into a void of starless violet dusk. Night-born monsters of the dark element pour in, wave after wave. It pays Dark Essence, no XP and no coins.',
  door:{x:1028,z:-280},aura:[0x3a3a8a,0x6a4aa8,0x9a7aff],music:'rift',el:'dark',essence:'dark',herald:'nightherald',
  mobs:['nightslime','nightboar','nightbeetle','nightwolf','nightwisp','nightreaver']});
