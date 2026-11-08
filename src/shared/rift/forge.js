//@ The Forge Rift, a Greyspine rift (fire, pays Fire Essence): its tear on the Greyspine's ground, its ember-orange aura, six fire glass kinds and a Herald
/* agent map: six riftMobDef calls and ONE defineElemRift call. A copy of taproot.js (docs/RIFT.md section 5): the element, the essence, the tear and the colours differ; the shared plan is in shared/rift.js.
   The tear: the main coordinates are on the task card; a backup is checked by tools/rift-smoke.js. Test: tools/rift-smoke.js */
riftMobDef('granitslime','forgeslime','Slag Slime',{el:'fire',pal:{tint:0xff7a45}});
riftMobDef('cliffboar','forgeboar','Cinder Boar',{el:'fire',pal:{tint:0xe86a38}});
riftMobDef('crystalbeetle','forgebeetle','Ember Beetle',{el:'fire',pal:{tint:0xff9a50}});
riftMobDef('snowleopard','forgecat','Ashmane Cat',{el:'fire',pal:{tint:0xf08040}});
riftMobDef('mistwraith','forgewisp','Sparkwraith',{el:'fire',pal:{tint:0xffc060}});
riftMobDef('minegoblin','forgesmith','Anvil Goblin',{el:'fire',pal:{tint:0xe0703a}});
riftMobDef('rocktroll','forgeherald','Smelter Herald',{el:'fire',scale:1.5,heavy:true,pal:{tint:0xffb050}});
defineElemRift({id:'forge',name:'The Forge Rift',blurb:'A tear into a void of molten light and rising sparks. Forge-born monsters of the fire element pour in, wave after wave. It pays Fire Essence, no XP and no coins.',
  door:{x:-364,z:-400},aura:[0xff6a30,0xffa040,0xffe080],music:'rift',el:'fire',essence:'fire',herald:'forgeherald',
  mobs:['forgeslime','forgeboar','forgebeetle','forgecat','forgewisp','forgesmith']});
