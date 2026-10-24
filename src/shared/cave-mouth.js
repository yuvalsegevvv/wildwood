//@ The Deep Cave's mouth in the Wildwood's northern foothills: where it stands, the flat pad under it (rawHeight), the teleport circle that joins CIRCLES, the surface lift pad, keep-outs for plants and camps. Pure; loaded before terrain-height.js
/* Agent map. Doc: docs/CAVE.md section 14. Test: tools/cave-smoke.js (the mouth is on dry land in the home forest, off roads, arenas, the coast and every anchor).
   exports: CAVE_MOUTH {x, z, a (the way it faces, radians, 0 = +z), fx, fz (that direction as a unit vector), h (the pad's height), padR, padOut}, caveMouthAt(u, v) -> [x, z] (u across, v out of the mouth, metres from its middle),
            CAVE_MOUTH_V (a village-shaped record for CIRCLES: x, z, r, name, tele {x, z, r}), CAVE_LIFT_SURFACE {x, z, r}, caveMouthPad(x, z, h) (rawHeight's hook), caveMouthNear(x, z, r) -> bool,
            CAVE_PORTAL {x, z} (the cave's doorway in the hillside)
   Why here: (184, -156) is the foot of the northern foothills 125 m from the Stone Circle and 120 m from the Hollow Roots' door, where the ground rises 10 m in the next 25 m northward and 40 m in 60 m, so the mouth
   is cut into a real slope with the Greyspine's wall behind it. The ground is not flat there (rolling, +-3 m over 10 m), so rawHeight lays a pad: the mean height of the ring, flat inside padR, blended out to padOut.
   The pad is the only change to the terrain; the camps keep 40 m away (server/monsters.js), the plants 18 m (game/dungeon/entrances.js dgEntClear). The mouth faces a = -0.25 rad, toward the home village.
   Layout (caveMouthAt): the doorway in the hill at v = -9.5, the teleport circle at (u -4.6, v 3.4), the lift beside the entrance at (u 6.4, v -1.2) with its cage 2.2 m wide. Unlike the villages' circles it joins CIRCLES
   without a village: warpP and the travel window only need V.x, V.z and V.tele. Opening rule is the home circle's (gear.east >= 2: the hiker has walked to Hanami). */
var CAVE_MOUTH=(()=>{   // (a var: rawHeight may be asked before this file has run)
  const x=184, z=-156, a=-0.25; let hs=0; for(let k=0;k<8;k++) hs+=baseHeight(x+Math.sin(k*0.785)*8,z+Math.cos(k*0.785)*8);
  return {x,z,a,fx:Math.sin(a),fz:Math.cos(a),h:hs/8,padR:11,padOut:28};
})();
const caveMouthAt=(u,v)=>[CAVE_MOUTH.x+u*Math.cos(CAVE_MOUTH.a)+v*Math.sin(CAVE_MOUTH.a), CAVE_MOUTH.z-u*Math.sin(CAVE_MOUTH.a)+v*Math.cos(CAVE_MOUTH.a)];
const CAVE_PORTAL=(()=>{ const p=caveMouthAt(0,-9.5); return {x:p[0],z:p[1]}; })();
const CAVE_MOUTH_V=(()=>{ const t=caveMouthAt(-4.6,3.4); return {x:CAVE_MOUTH.x,z:CAVE_MOUTH.z,r:12,name:'The Deep Cave',cave:true,tele:{x:t[0],z:t[1],r:2.4}}; })();
const CAVE_LIFT_SURFACE=(()=>{ const p=caveMouthAt(6.4,-1.2); return {x:p[0],z:p[1],r:2.2}; })();
CIRCLES.push({id:'cavemouth',name:'The Deep Cave',land:'The Wildwood',lv:'23+',V:CAVE_MOUTH_V,open:g=>g.east>=2,hint:'Walk to Hanami on the far side of the bridge first'});
function caveMouthPad(x,z,h){ if(!CAVE_MOUTH) return h; const dx=x-CAVE_MOUTH.x, dz=z-CAVE_MOUTH.z; if(dx>CAVE_MOUTH.padOut||dx<-CAVE_MOUTH.padOut||dz>CAVE_MOUTH.padOut||dz<-CAVE_MOUTH.padOut) return h;
  const d=Math.sqrt(dx*dx+dz*dz); return d>=CAVE_MOUTH.padOut?h:lerp(h,CAVE_MOUTH.h,smoothstep(CAVE_MOUTH.padOut,CAVE_MOUTH.padR,d)); }
const caveMouthNear=(x,z,r)=>{ const dx=x-CAVE_MOUTH.x, dz=z-CAVE_MOUTH.z; return dx*dx+dz*dz<r*r; };
