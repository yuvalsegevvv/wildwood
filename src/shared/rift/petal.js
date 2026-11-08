//@ The Petal Rift, a Sakura Vale rift (air, pays Air Essence): its tear in the Vale's wilds, its pale sky-pink aura, six air glass kinds and a Herald
/* agent map: six riftMobDef calls and ONE defineElemRift call. A copy of taproot.js (docs/RIFT.md section 5): the element, the essence, the tear and the colours differ; the shared plan is in shared/rift.js.
   The tear: the backup and main coordinates come from the task card (tools/rift-smoke.js checks them). Test: tools/rift-smoke.js */
riftMobDef('sakuraslime','petalslime','Petal Slime',{el:'air',pal:{tint:0xffb8d0}});
riftMobDef('kodama','petalkodama','Drift Kodama',{el:'air',pal:{tint:0xf0d0e8}});
riftMobDef('kabuto','petalbeetle','Blossom Beetle',{el:'air',pal:{tint:0xe8a0c0}});
riftMobDef('kitsune','petalfox','Gale Kitsune',{el:'air',pal:{tint:0xffc0d8}});
riftMobDef('onibi','petalwisp','Petal Wisp',{el:'air',pal:{tint:0xfff0f5}});
riftMobDef('tengu','petaltengu','Breeze Tengu',{el:'air',pal:{tint:0xd8a0c0}});
riftMobDef('sakuratreant','petalherald','Blossom Herald',{el:'air',scale:1.5,heavy:true,pal:{tint:0xffc8dc}});
defineElemRift({id:'petal',name:'The Petal Rift',blurb:'A tear into a void of drifting petals and pale sky. Blossom-born monsters of the air element pour in, wave after wave. It pays Air Essence, no XP and no coins.',
  door:{x:812,z:-124},aura:[0xf5c0d8,0xffb0d0,0xff8fb8],music:'rift',el:'air',essence:'air',herald:'petalherald',
  mobs:['petalslime','petalkodama','petalbeetle','petalfox','petalwisp','petaltengu']});
