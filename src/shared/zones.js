//@ Monster zones of the home forest as the atlas lays them out (ZONES, zoneAt, zonePoint, defZone, zoneOfAtlas): zones 1-15 and the edge zones shore / sunfoot / foothills, the Stone Circle's arena (ARENA); the vale's are in vale.js. Pure.
/* ---------- monster zones ----------
   The zones are the world atlas's (shared/world-atlas.js WA_ZONES: land 'home' keys 1-15, 'shore', 'sunfoot', 'foothills'; land 'vale' keys 16-25): the atlas says where each one is (zoneAt reads its grid) and
   how big; this file gives each a record with the monster tables' names and levels. The borders between zones are the ground's own (a ridge with saddles, a ravine, a band of broken ground:
   shared/world-atlas-ground.js), so there are no ridges of our own (zoneRidge answers 0 here). Levels run 1-15 across the forest from the village outward; the edge zones keep their creatures
   (shore crabs and tide slimes 16-17, sun scarabs in the Sunwall's foot 18, ram-horned boars and crag wardens in the foothills 19-20: docs/WORLD.md; their monsters name their zone, zone:'shore'... in MON_DEFS).
   Agent map. Exports: ZONES (every zone of every land, as the land files push them), ZONE_OF_ID (atlas zone id -> home / vale record), zoneOfAtlas(A,extra) (makes a record: x, z the pole, R, rays), atlasZoneAt(x,z),
   zonePoint(zn,fa,fr), zoneAt, defZone, poiNamed(name) (an atlas poi), arenaAtPoi(poi,o) (an arena's record), ARENA (the Stone Circle). Used by vale.js, beach.js, server/monsters.js,
   professions.js, quests.js, the map. Test: tools/atlas-smoke.js, tools/server-smoke.js. */
const ZONE_NAMES={1:'Slime Meadow',2:'Mushroom Hollow',3:'Beetle Thicket',4:'Boar Run',5:'Goblin Woods',6:'Treant Grove',7:'The Bog',8:'Deathcap Dell',9:'Ironshell Ridge',10:'Dire Wallows',11:'Hobgoblin Warrens',12:'Rotwood',13:'Ember Flats',14:"Chieftain's Hold",15:'Ancient Grove',boss:'The Stone Circle'};
const ZONES=[], ZONE_OF_ID=[], ZONE_RAYS=64;   // ZONE_OF_ID[atlas zone id] -> its record
/* The pole of each home and vale zone (the dry cell farthest from its borders, the coast and the water, clear of the villages) and its radius along ZONE_RAYS rays (to the first cell that is another zone):
   found once, in one pass over the atlas grid at 16 m. */
const ZONE_POLE={};
{ const ids=new Set(WA_ZONES.filter(A=>A.land==='home'||A.land==='vale').map(A=>A.id)), hubs=[WA_HUBS.home,WA_HUBS.vale];
  for(let z=WA_META.z0+8;z<WA_META.z1;z+=16) for(let x=WA_META.x0+8;x<WA_META.x1;x+=16){
    const id=waZoneId(x,z); if(!ids.has(id)) continue;
    let near=false; for(const h of hubs) if((x-h[0])*(x-h[0])+(z-h[1])*(z-h[1])<3600) near=true;   // (60 m: the village's own ground has no camps)
    if(near||waWaterDist(x,z)<10) continue;
    const sc=Math.min(waBorderDist(x,z),waCoast(x,z)+30), B=ZONE_POLE[id];
    if(!B||sc>B.sc) ZONE_POLE[id]={x,z,sc};
  }
}
// an atlas zone's record: the monster tables' fields (extra: key names, level, ring, flags) plus where it is: x, z (the pole), R (the longest ray), rays (the radius out to the border along ZONE_RAYS directions), wa (the atlas record)
function zoneOfAtlas(A,extra){
  const P=ZONE_POLE[A.id]||{x:A.x,z:A.z}, rays=new Array(ZONE_RAYS);
  let R=0;
  for(let k=0;k<ZONE_RAYS;k++){
    const a=k/ZONE_RAYS*TAU, sx=Math.sin(a), cz=Math.cos(a); let r=0;
    while(r<420&&waZoneId(P.x+sx*(r+6),P.z+cz*(r+6))===A.id) r+=6;
    rays[k]=Math.max(0,r-4); R=Math.max(R,rays[k]);
  }
  const zn=Object.assign({key:A.key,x:P.x,z:P.z,R,rays,wa:A,id:A.id},extra);
  ZONE_OF_ID[A.id]=zn; ZONES.push(zn); return zn;
}
{ const ring=k=>k<=6?0:k<=11?1:2;
  for(let k=1;k<=15;k++) zoneOfAtlas(WA_ZONES.find(A=>A.land==='home'&&A.key===k),{ring:ring(k),name:ZONE_NAMES[k],level:k,boss:false});
}
/* The forest's edges have zones of their own, with the creatures that belong there (docs/WORLD.md): the Crownsea Shore (shore crabs and tide slimes on the beach), the Sunwall's Foot (sun scarabs in the red scree) and the
   Northern Foothills (ram-horned boars and crag wardens). Levels 16-20: optional ground for players back from the vale, not on the main quest's path. lvText: the levels a zone holds, when it holds more than one. */
const EDGE_ZONES=[
  zoneOfAtlas(WA_ZONES.find(A=>A.land==='home'&&A.key==='shore'),{ring:3,name:'The Crownsea Shore',level:16,lvText:'16-17',edge:'shore'}),
  zoneOfAtlas(WA_ZONES.find(A=>A.land==='home'&&A.key==='sunfoot'),{ring:3,name:"The Sunwall's Foot",level:18,edge:'west'}),
  zoneOfAtlas(WA_ZONES.find(A=>A.land==='home'&&A.key==='foothills'),{ring:3,name:'The Northern Foothills',level:19,lvText:'19-20',edge:'north'})];
// an atlas poi (a boss's place, a door) by its name
function poiNamed(name){ const P=WA_POIS.find(q=>q.name===name); if(!P) throw new Error('no atlas poi '+name); return P; }
// a boss arena at an atlas poi: its centre, and the ground's mean height over its disc (the flat pad is laid to it, terrain-height.js)
function arenaAtPoi(P,o){
  let sum=0,c=0; for(let rr=0;rr<=22;rr+=11) for(let j=0;j<8;j++){ const b=j/8*TAU; sum+=baseHeight(P.x+Math.sin(b)*rr,P.z+Math.cos(b)*rr); c++; }
  return Object.assign({x:P.x,z:P.z,h:Math.max(sum/c,1.2)},o);
}
// a village's own ground (70 m round its hub, whichever zone it falls in: the home village stands where zones 1 and 2 meet) has no camps and no zone
function atlasZoneAt(x,z){
  const zn=ZONE_OF_ID[waZoneId(x,z)]; if(!zn) return null;   // the sea, an islet, another land's zone
  const h=waLandId(x,z)===0?WA_HUBS.home:WA_HUBS.vale; if((x-h[0])*(x-h[0])+(z-h[1])*(z-h[1])<4900) return null;   // (70 m round the village)
  for(const A of ARENAS){ if(!A.zone||A.hoar||A.grey) continue; const dx=x-A.x, dz=z-A.z, r=A.r+26; if(dx*dx+dz*dz<r*r) return A.zone; }   // (an arena's ground is its own zone)
  return zn;
}
// the monster kind's zone: its own (edge kinds) or the zone of its level
function defZone(d){ const k=d.zone||d.level; return ZONES.find(zn=>zn.key===k); }
function zoneAt(x,z){
  if(inAmber(x,z)) return savZoneAt(x,z);   // savanna: Amber Reach (shared/savannazones.js; ask it before inSun, which is true there too)
  if(inGloam(x,z)) return gloamZoneAt(x,z);   // the Gloamhorn (shared/gloamzones.js)
  if(inSun(x,z)) return sunZoneAt(x,z);   // the Sunscar (shared/sunzones.js)
  if(inGrey(x,z)) return greyZoneAt(x,z);
  if(inVale(x,z)) return inHoar(x,z)?hoarZoneAt(x,z):valeZoneAt(x,z);
  return atlasZoneAt(x,z);
}
/* fa: -0.5..0.5 the direction round a zone's pole (the whole circle), fr: 0..1 (0.5 the pole, 0 and 1 the zone's border along that ray; the radius grows as its square root so camps spread over the area, not the middle).
   Arena zones (arena:true) and the Greyspine's, Reach's and other lands' zones (vale-style: R round x, z) use their own circle. full: kept for the callers that ask for a zone's whole reach (the rays reach the border anyway) */
function zonePoint(zn,fa,fr,full){
  const a=fa*TAU;
  if(zn.rays){
    const t=(((fa%1)+1)%1)*ZONE_RAYS, i=Math.floor(t)%ZONE_RAYS, r=Math.sqrt(Math.min(1,Math.abs(fr-0.5)*2))*lerp(zn.rays[i],zn.rays[(i+1)%ZONE_RAYS],t-Math.floor(t));
    return [zn.x+Math.sin(a)*r,zn.z+Math.cos(a)*r];
  }
  const r=Math.abs(fr-0.5)*2*zn.R; return [zn.x+Math.sin(a)*r,zn.z+Math.cos(a)*r];
}
// the Stone Circle: the boss arena of the home forest, a flat clearing ringed by standing stones at the atlas's poi (in zone 15)
const ARENA=Object.assign(arenaAtPoi(poiNamed('The Stone Circle')),{r:20,key:'boss'});
