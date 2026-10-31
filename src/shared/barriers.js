//@ Barriers: the one place that says what holds a hiker (the gates of the locked lands) and what no longer does once a land is open (client movement and server setPos both call barStep). Pure.
/* ===================== BARRIERS =====================
   The rule (docs/areas/regions.md): while a land is locked its gate holds; once it is unlocked for a player NO invisible clamp of that land remains. The only things that stop a hiker are then the slope limit
   (SLOPE_MAX, player/movement.js), the water-depth rule (the coast: you wade to the knees, no deeper), the 3D rock of caves, and the one clamp at the world's outer edge (14 m inside WX0..WX1 / WZ0..WZ1).
   barStep(o, ox, oz, g) applies every gate that is still shut to one step (o: the new position, ox / oz: where the step started, g: the player's gear flags: east, north, west, river, neck, redgate, amber).
   Agent map: barStep (everything below, in this order), barLocked(a, b, g) (is the land border between land ids a and b shut for this gear), barLandOpen(l, g) (may a teleport land here), barHold (a step that
   changes land across a shut border is dropped: it slides along the border when the other axis keeps the land), BAR_NONE (the flags of a hiker with nothing open).
   The gates, by flag: east = the Greyfall Bridge's door (home | vale); north = Frostgate Pass's ice wall (PASS.ice, hoarfrost.js) and the Reach's whole border; west = the glacier valley's ice fall (westBarX,
   greyspine.js) and the Greyspine's borders with the forest and the Reach; river / redgate = the Sunscar's rock falls (gateHold, sunWallHold, sunCrestHold); neck = the Gloamhorn's borders (gateHold, gloamNeckHold,
   and the Glass River's); amber = the Ashbed Gate into Amber Reach (shared/savanna.js; opened by the Sand Wyrm, saved in gear.amber; it holds the whole border). Used by: game/player/movement.js (worldBounds), server/api.js (setPos), server/economy.js (barLandOpen for the testing teleport).
   Test: client-smoke (the hiker crosses the wadeable border river once the vale is open, and is held while it is locked), greyspine-smoke, sunscar-smoke, gloamhorn-smoke. Names: bar..., BAR_... */
const BAR_NONE={east:0,north:0,west:0,river:0,neck:0,redgate:0,amber:0,isles:0};
// the border between lands a and b (atlas ids: home 0, vale 1, hoar 2, grey 3, sun 4, gloam 5, amber 6) is shut for this gear. The rock falls of the Sunscar and the neck pass are held by gateHold / sunWallHold / sunCrestHold /
// gloamNeckHold (their own functions, barStep calls them); this table adds the borders they do not know.
function barLocked(a,b,g){
  if(a>b){ const t=a; a=b; b=t; }
  if(a===b) return false;
  if(b===6&&(a===0||a===4)) return !(g.amber>=1);                 // Amber Reach: the Ashbed Gate (opened by the Sand Wyrm: gear.amber)
  if(a===0&&b===1) return !(g.east>=1);                           // the Greyfall Bridge
  if(b===2&&(a===0||a===1)) return !(g.north>=1);                 // Frostgate Pass (and the Reach's border with the forest)
  if(b===3&&(a===0||a===2)) return !(g.west>=1);                  // the glacier valley (and the Greyspine's border with the forest)
  if(a===4&&b===5) return !(g.neck>=1);                           // the Glass River into the Gloamhorn: the neck pass opens the Gloamhorn for good
  return false;
}
// may a teleport (the testing tools' travel, a warp) put this hiker in land l
function barLandOpen(l,g){
  if(l===1) return g.east>=1;
  if(l===2) return g.north>=1;
  if(l===3) return g.west>=1;
  if(l===4) return g.redgate>=1||g.river>=1;
  if(l===5) return g.neck>=1;
  if(l===6) return g.amber>=1;
  if(l===7) return g.isles>=1;   // emberwake: the Isles are reached by the circles once Oldhorn has fallen
  return true;
}
// a step across a shut border is dropped; the part of it along the border is kept when that stays in the land you came from
function barHold(o,ox,oz,g){
  if(Math.hypot(o.x-ox,o.z-oz)>30) return;                        // (a jump over 30 m is a teleport, not a step)
  const a=waLandId(ox,oz), b=waLandId(o.x,o.z); if(a===b||!barLocked(a,b,g)) return;
  const cx=waLandId(o.x,oz); if(cx===a||!barLocked(a,cx,g)){ o.z=oz; return; }
  const cz=waLandId(ox,o.z); if(cz===a||!barLocked(a,cz,g)){ o.x=ox; return; }
  o.x=ox; o.z=oz;
}
// the x of the ice fall's line at z: the Reach's west edge +15 (westBarX), and at the glacier valley's road the fall itself (GLEN.ice, the mesh), whichever is further east
function barFallX(z){ const b=westBarX(z); return Math.abs(z-GLEN.z)<GLEN.w+6?Math.max(b,GLEN.ice):b; }
function barStep(o,ox,oz,g){
  if(ox===undefined) ox=o.x; if(oz===undefined) oz=o.z;
  if(!(g.east>=1)){   // the bridge's door: nobody steps onto the deck from its west end, and the strip round it holds the river's banks
    const e0=TUN.p0-0.6, e1=TUN.p1+0.6;
    if(o.x>e0&&o.x<e1&&Math.abs(o.z-TUN.z)<TUN.w+6){ if(ox<=e0) o.x=e0; else if(ox>=e1) o.x=e1; else o.z=TUN.z+Math.sign(o.z-TUN.z||1)*(TUN.w+6); }
  }
  if(!(g.north>=1)&&Math.abs(o.x-PASS.x)<PASS.w+10&&inVale(o.x,o.z)&&o.z<PASS.ice+0.8) o.z=PASS.ice+0.8;   // the ice wall across Frostgate Pass (the Reach's border itself is held by barHold)
  if(!(g.west>=1)&&Math.abs(o.x-ox)<=30){ const bx=barFallX(o.z); if(bx>-1e8&&ox>=barFallX(oz)&&o.x<bx+0.8) o.x=bx+0.8; }   // the ice fall across the glacier valley, from the Reach's side
  barHold(o,ox,oz,g);
  for(const G of GREY_GATES) if(!(g[G.id]>=1)) gateHold(G,o,ox,oz);   // the rock falls: the neck pass, the River Pass, Redgate Canyon
  if(!(g.redgate>=1)) sunWallHold(o,ox);
  if(!(g.river>=1)) sunCrestHold(o,oz);
  if(!(g.neck>=1)) gloamNeckHold(o,ox,oz);
}
