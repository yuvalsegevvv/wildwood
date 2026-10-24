//@ The Deep Cave's mouth in the Wildwood's northern foothills: where it stands, the flat pad under it (rawHeight), the teleport circle that joins CIRCLES, the surface lift pad, keep-outs for plants and camps. Pure; loaded before terrain-height.js
/* Agent map. Doc: docs/CAVE.md section 14. Test: tools/cave-smoke.js (the mouth is on dry land in the home forest, off roads, arenas, the coast and every anchor).
   exports: CAVE_MOUTH {x, z, a (the way it faces, radians, 0 = +z), fx, fz (that direction as a unit vector), h (the pad's height), padR, padOut, hill (the ridge behind the face, m over the pad), back}, caveMouthAt(u, v) -> [x, z] (u across, v out of the mouth, metres from its middle),
            CAVE_MOUTH_V (a village-shaped record for CIRCLES: x, z, r, name, tele {x, z, r}), CAVE_LIFT_SURFACE {x, z, r}, caveMouthPad(x, z, h) (rawHeight's hook), caveMouthNear(x, z, r) -> bool,
            CAVE_PORTAL {x, z} (the cave's doorway in the hillside)
   Why here: (184, -156) is the foot of the northern foothills 125 m from the Stone Circle and 120 m from the Hollow Roots' door, where the ground rises 10 m in the next 25 m northward and 40 m in 60 m, so the mouth
   is cut into a real slope with the Greyspine's wall behind it. The ground is not flat there (rolling, +-3 m over 10 m), so rawHeight lays a pad: the mean height of the ring, flat inside padR, blended out to padOut.
   The pad and the ridge behind the face (caveMouthPad) are the only changes to the terrain; the camps keep 40 m away (server/monsters.js), the plants 18 m (game/dungeon/entrances.js dgEntClear). The mouth faces a = -0.25 + pi/2 (the owner's 90 degree turn counter-clockwise of the first -0.25): east, toward the mountains; the natural slope runs along the face there, so caveMouthPad also raises a ridge (hill) behind the doorway for the face to back into.
   Layout (caveMouthAt): the doorway in the hill at v = -9.5, the teleport circle at (u -4.6, v 3.4), the lift beside the entrance at (u 6.4, v -1.2) with its cage 2.2 m wide. Unlike the villages' circles it joins CIRCLES
   without a village: warpP and the travel window only need V.x, V.z and V.tele. Opening rule is the home circle's (gear.east >= 2: the hiker has walked to Hanami). */
var CAVE_MOUTH=(()=>{   // (a var: rawHeight may be asked before this file has run)
  const x=184, z=-156, a=-0.25+Math.PI/2; let hs=0; for(let k=0;k<8;k++) hs+=baseHeight(x+Math.sin(k*0.785)*8,z+Math.cos(k*0.785)*8);
  return {x,z,a,fx:Math.sin(a),fz:Math.cos(a),h:hs/8,padR:11,padOut:28,hill:11,back:48};
})();
const caveMouthAt=(u,v)=>[CAVE_MOUTH.x+u*Math.cos(CAVE_MOUTH.a)+v*Math.sin(CAVE_MOUTH.a), CAVE_MOUTH.z-u*Math.sin(CAVE_MOUTH.a)+v*Math.cos(CAVE_MOUTH.a)];
const CAVE_PORTAL=(()=>{ const p=caveMouthAt(0,-9.5); return {x:p[0],z:p[1]}; })();
const CAVE_MOUTH_V=(()=>{ const t=caveMouthAt(-4.6,3.4); return {x:CAVE_MOUTH.x,z:CAVE_MOUTH.z,r:12,name:'The Deep Cave',cave:true,tele:{x:t[0],z:t[1],r:2.4}}; })();
const CAVE_LIFT_SURFACE=(()=>{ const p=caveMouthAt(6.4,-1.2); return {x:p[0],z:p[1],r:2.2}; })();
CIRCLES.push({id:'cavemouth',name:'The Deep Cave',land:'The Wildwood',lv:'23+',V:CAVE_MOUTH_V,open:g=>g.east>=2,hint:'Walk to Hanami on the far side of the bridge first'});
function caveMouthPad(x,z,h){ if(!CAVE_MOUTH) return h; const dx=x-CAVE_MOUTH.x, dz=z-CAVE_MOUTH.z; if(dx>CAVE_MOUTH.back||dx<-CAVE_MOUTH.back||dz>CAVE_MOUTH.back||dz<-CAVE_MOUTH.back) return h;
  const d=Math.sqrt(dx*dx+dz*dz); if(d<CAVE_MOUTH.padOut) h=lerp(h,CAVE_MOUTH.h,smoothstep(CAVE_MOUTH.padOut,CAVE_MOUTH.padR,d));
  /* the hill the doorway is cut into: a ridge behind the face (v < -9.5, the mouth's own frame), up to CAVE_MOUTH.hill m over the pad, fading out across (|u| 34) and behind (v -46),
     so the rock face backs into ground and does not stand alone on a slope that runs along it. Wide and smooth (the server samples height on a 4 m grid). */
  const u=dx*Math.cos(CAVE_MOUTH.a)-dz*Math.sin(CAVE_MOUTH.a), v=dx*Math.sin(CAVE_MOUTH.a)+dz*Math.cos(CAVE_MOUTH.a);
  if(v<-8.5&&v>-46&&u<34&&u>-34){ const k=smoothstep(-8.5,-15,v)*smoothstep(-46,-28,v)*smoothstep(34,18,Math.abs(u)); h=Math.max(h,lerp(h,CAVE_MOUTH.h+CAVE_MOUTH.hill,k)); }
  return h; }
const caveMouthNear=(x,z,r)=>{ const dx=x-CAVE_MOUTH.x, dz=z-CAVE_MOUTH.z; return dx*dx+dz*dz<r*r; };
