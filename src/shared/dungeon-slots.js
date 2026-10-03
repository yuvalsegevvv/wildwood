//@ Dungeon run slots: where runs live (squares far east of the walkable world, one per run, 600 m apart), their flat floor height, and which slot a point is in. Pure; loaded by both sides
/* agent map
   exports: DG_X0, DG_Z0 (the first slot's corner), DG_SLOT (600 m between slots), DG_ACROSS (4 slots a row), DG_MAX_INST (16 runs at most), DG_FLOOR_Y (a run's floor height),
            DG_SLOT_PAD (a slot reaches this far west / north of its corner), dgSlotOrigin(i) -> {x,z}, dgInSlots(x), dgSlotAt(x,z) -> slot index or -1
   users: server/dungeons/instances.js (runs take a slot), server/world.js getH (the floor), the client's dungeon view (its own getH and bounds)
   test: tools/dungeon-runs-smoke.js
   Why far away: a run is a slot of coordinates inside the same world (docs/DUNGEONS.md section 7), so combat, projectiles and AI work unchanged. Slots start 1.5 km east of
   WX1 and are 600 m apart: more than the widest snapshot radius (players, 250 m) plus the biggest grid (6 x 6 tiles = 288 m), so runs never see each other by distance.
   A run's bake has its north-west corner at dgSlotOrigin(slot) (the tp payload's ox, oz). float32 at these coordinates (up to about 4,600) is good to half a millimetre. */
const DG_X0=WX1+1500, DG_Z0=WZ0, DG_SLOT=600, DG_ACROSS=4, DG_MAX_INST=16, DG_FLOOR_Y=10, DG_SLOT_PAD=100;   // DG_FLOOR_Y: well above WATER (0), so nothing reads a run as the sea
const dgSlotOrigin=i=>({x:DG_X0+(i%DG_ACROSS)*DG_SLOT,z:DG_Z0+Math.floor(i/DG_ACROSS)*DG_SLOT});
const dgInSlots=x=>x>=DG_X0-DG_SLOT_PAD;
function dgSlotAt(x,z){
  if(!dgInSlots(x)) return -1;
  const ix=Math.floor((x-DG_X0+DG_SLOT_PAD)/DG_SLOT), iz=Math.floor((z-DG_Z0+DG_SLOT_PAD)/DG_SLOT);
  return ix>=0&&ix<DG_ACROSS&&iz>=0&&iz*DG_ACROSS+ix<DG_MAX_INST?iz*DG_ACROSS+ix:-1;
}
