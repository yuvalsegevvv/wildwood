//@ The Rime Rift, a Hoarfrost Reach rift (water, pays Water Essence): its tear on the Reach's plateau, its pale ice-blue aura, six water glass kinds and a Herald
/* agent map: six riftMobDef calls and ONE defineElemRift call. A copy of taproot.js (docs/RIFT.md section 5): the element, the essence, the tear and the colours differ; the shared plan is in shared/rift.js.
   The tear: the main coordinates are on the task card; a backup is checked by tools/rift-smoke.js. Test: tools/rift-smoke.js */
riftMobDef('frostslime','rimeslime','Rime Slime',{el:'water',pal:{tint:0xa8d8ff}});
riftMobDef('snowboar','rimeboar','Brine Boar',{el:'water',pal:{tint:0x8cc4f0}});
riftMobDef('icebeetle','rimebeetle','Floe Beetle',{el:'water',pal:{tint:0xb8e0ff}});
riftMobDef('wolf','rimewolf','Tidefrost Wolf',{el:'water',pal:{tint:0x9cc8e8}});
riftMobDef('rimewisp','rimeglint','Meltwater Wisp',{el:'water',pal:{tint:0xd0ecff}});
riftMobDef('yeti','rimeyeti','Drift Yeti',{el:'water',pal:{tint:0xa0d0f0}});
riftMobDef('rimetreant','rimeherald','Rimewater Herald',{el:'water',scale:1.5,heavy:true,pal:{tint:0xc8e8ff}});
defineElemRift({id:'rime',name:'The Rime Rift',blurb:'A tear into a void of rime and meltwater light. Frost-born monsters of the water element pour in, wave after wave. It pays Water Essence, no XP and no coins.',
  door:{x:644,z:-568},aura:[0x9ad8ff,0xcfeaff,0xe8f6ff],music:'rift',el:'water',essence:'water',herald:'rimeherald',
  mobs:['rimeslime','rimeboar','rimebeetle','rimewolf','rimeglint','rimeyeti']});
