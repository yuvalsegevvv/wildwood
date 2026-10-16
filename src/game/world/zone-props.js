//@ Zone dressing: each monster zone's ground tint and props that match its monsters (goblin huts, spider webs, crystals, graves...), the boss arenas' wider surroundings and ruins scattered over every land
/* Agent map: ZP_THEME[zoneKey] (zpTheme rows below: ground tint, density, weighted prop kinds; a kind is a zpDef in zone-props-models*.js), ZP_BOSS[arenaKey] (rings of props round a boss arena),
   ZP_PLANS (the ruin layouts), zpGroundTint (called by terrainColor: a 12 m cell grid of zone indices, blended bilinearly, so the tint fades over the zone's border), genZoneProps(ci) (called at the
   end of genChunk: themed props, the arenas' surroundings, ruins; one instanced mesh per kind and chunk, own materials). It draws from the chunk's rand AFTER the plants, so no plant moves.
   Cost: 100-150 attempts per chunk, a few hundred triangles per prop, distance culled at 118 m (85 on a phone, no shadows there).
   Used by: generation-chunks.js (genChunk), terrain-color.js (terrainColor is the wrapper below). Test: node tools/zoneprops-smoke.js. Doc: docs/areas/zone-props.md. */
const ZP_CELL=12, ZP_NX=Math.ceil(WW/ZP_CELL)+2, ZP_NZ=Math.ceil(WD/ZP_CELL)+2, ZP_THEME={}, ZP_BAD=[];
// entries: [kind, weight, cluster minimum (0 = anywhere, 0.55 = only in the densest 40% of the zone: camps), {s:[min,max] scale, with:[kinds placed 3-5 m round it]}]
function zpTheme(key,tintHex,tintK,dens,entries){ const c=new THREE.Color(tintHex), ok=[];
  for(const e of entries){ if(!ZP_KIND[e[0]]){ ZP_BAD.push(key+': '+e[0]); continue; } ok.push({kind:e[0],w:e[1],cmin:e[2]||0,o:e[3]||{}}); }
  ZP_THEME[key]={key,tr:c.r,tg:c.g,tb:c.b,tk:tintK,dens,entries:ok}; }
/* ---- the home forest (docs/WORLD.md; the monster lists are in docs/MOBS.md) ---- */
zpTheme('1',0x6fd05a,0.2,0.06,[['slimepool',3],['mosstone',1,0.1]]);                                                                   // slimes
zpTheme('2',0x5a3f6a,0.25,0.12,[['toadred',3],['toadpurple',3],['hollowstump',1,0.5]]);                                                 // shrooms
zpTheme('3',0x4a4a2a,0.25,0.08,[['husk',2,0.3],['burrow',3],['mosstone',1,0.2]]);                                                      // beetles
zpTheme('4',0x6a4a30,0.3,0.08,[['wallow',2,0.3],['barricade',2,0.4],['bonepile',1,0.2]]);                                              // boars
zpTheme('5',0x5a4a2a,0.3,0.09,[['gobhut',3,0.55,{with:['campfire','gobtotem']}],['barricade',2,0.4],['gobtotem',1,0.5],['bonepile',1,0.3]]);   // goblins
zpTheme('6',0x2f5a2a,0.25,0.09,[['rootarch',2,0.3],['hollowstump',3],['mosstone',2]]);                                                 // treants
zpTheme('7',0x3a4a30,0.35,0.12,[['bogpool',3],['deadstump',3],['wisplamp',1,0.3]]);                                                    // bog slimes
zpTheme('8',0x6a7a3a,0.3,0.12,[['deathcap',4],['toadpurple',1,0.3],['bonepile',1,0.5]]);                                               // deathcaps
zpTheme('9',0x6a5048,0.3,0.09,[['ironhusk',2,0.2],['orerock',3],['cairn',1,0.3]]);                                                     // ironshells
zpTheme('10',0x4a3626,0.35,0.09,[['wallow',3,0.2],['ribs',1,0.5],['barricade',2,0.3],['bonepile',1,0.3]]);                              // dire boars
zpTheme('11',0x5a4030,0.3,0.1,[['gobhut',3,0.5,{with:['campfire','banner']}],['palisade',2,0.4],['bonepile',1,0.3],['gobtotem',1,0.5]]);  // hobgoblins
zpTheme('12',0x4a3a28,0.3,0.1,[['rotlog',3],['deadstump',3],['toadred',1,0.4],['hollowstump',1,0.4]]);                                  // rotwood
zpTheme('13',0x3a2a24,0.45,0.1,[['cinderrock',3],['charstump',3],['bonepile',1,0.5]]);                                                  // magma slimes
zpTheme('14',0x5a3a2a,0.3,0.1,[['warhut',2,0.55,{with:['campfire','banner']}],['palisade',2,0.35],['gobhut',1,0.5],['bonepile',1,0.3],['banner',1,0.5]]);   // the chieftain
zpTheme('15',0x3a5a3a,0.22,0.09,[['runestone',2,0.3],['rootarch',2,0.3],['hollowstump',1,0.4],['toadpurple',1,0.4]]);                  // ancient treants
zpTheme('shore',0xc8b890,0.2,0.07,[['crabpot',2,0.3],['driftlog',3],['shell',3]]);
zpTheme('sunfoot',0xa86a48,0.25,0.06,[['sunskull',1,0.5],['rockspire',2,0.3],['cairn',1,0.3]]);
zpTheme('foothills',0x7a7468,0.25,0.06,[['cairn',2,0.3],['rockspire',2,0.3],['menhir',1,0.5]]);
/* ---- the Sakura Vale ---- */
zpTheme('16',0xe0a0b8,0.3,0.08,[['toro',2,0.3],['hokora',1,0.55],['mosstone',1,0.3]]);
zpTheme('17',0x4a7a5a,0.25,0.1,[['jizo',3,0.2],['toro',2,0.3],['mosstone',2]]);                                                          // kodama
zpTheme('18',0xb87a3a,0.25,0.09,[['foxstatue',2,0.45],['torii',1,0.55],['toro',2,0.3]]);                                                 // kitsune
zpTheme('19',0x8aa040,0.25,0.08,[['bamboofence',3,0.3],['hokora',1,0.5],['toro',1,0.4]]);
zpTheme('20',0x3a4a5a,0.35,0.12,[['web',2,0.3],['webdome',3,0.1],['cocoon',2,0.35],['wisplamp_blue',2,0.2],['sotoba',2,0.2],['bogpool',1]]);   // jorogumo, the spider lady
zpTheme('21',0x5a3a3a,0.35,0.09,[['kanabo',2,0.35],['ironstakes',2,0.3],['bonepile',2,0.2],['rockspire',2]]);                           // oni
zpTheme('22',0x3a8a6a,0.25,0.08,[['jadespire',3,0.2],['toro',1,0.5],['mosstone',2]]);
zpTheme('23',0x6a6a72,0.25,0.08,[['prayerflags',2,0.4],['rockspire',3,0.1],['hokora',1,0.6],['torii',1,0.6]]);                          // tengu
zpTheme('24',0x5a4a38,0.3,0.09,[['weaponrack',2,0.4],['banner_black',2,0.4],['palisade',1,0.5],['ruinwall',2,0.2],['bonepile',1,0.3]]);   // samurai
zpTheme('25',0x4a4a52,0.3,0.09,[['lightrod',2,0.3],['charstump',2,0.2],['rockspire',1,0.4],['runestone',1,0.5]]);                       // raiju
zpTheme('boss',0x3a4a2a,0.4,0,[]); zpTheme('boss20',0x3a2020,0.45,0,[]); zpTheme('boss25',0x5a6a9a,0.3,0,[]); zpTheme('boss20b',0x8a7a60,0.4,0,[]);
/* ---- the Hoarfrost Reach ---- */
zpTheme('h22',0xdfe8f0,0.15,0.06,[['cairn_snow',2,0.3],['iceshard',2,0.2],['windpole',1,0.4]]);
zpTheme('h23',0xc8dcea,0.15,0.07,[['iceshard',3,0.1],['windpole',1,0.4],['cairn_snow',1,0.4]]);
zpTheme('h24',0x9ab8d0,0.2,0.07,[['frozenboat',2,0.45],['iceshard',3,0.1],['driftlog',1,0.3]]);
zpTheme('h25',0xcab8a0,0.2,0.1,[['huntertent',2,0.5,{with:['campfire','dryrack']}],['trophypole',2,0.35],['dryrack',1,0.4]]);          // hunters and yetis
zpTheme('h26',0x8ab0d8,0.3,0.08,[['icepillar',3,0.2],['runestone_ice',2,0.3],['banner_ice',1,0.5]]);
zpTheme('h27',0x9ad0e8,0.3,0.08,[['iceshard_big',2,0.2],['iceshard',3],['webdome',1,0.6]]);                                              // crawlers
zpTheme('h28',0xe8f0f8,0.15,0.07,[['windpole',3,0.2],['cairn_snow',2,0.2],['bonepile',1,0.4],['ribs',1,0.6]]);
zpTheme('h29',0x6a6a7a,0.35,0.1,[['barrowmound',1,0.55],['gravestone_frost',4],['runestone_ice',1,0.4],['ribs',1,0.5]]);              // barrow wights
zpTheme('h30',0x7aa0d0,0.35,0.08,[['wyrmribs',1,0.55],['iceshard_big',3,0.1],['bonepile',1,0.4]]);
zpTheme('boss26',0x7aa8d8,0.4,0,[]); zpTheme('boss30',0x6a90c0,0.4,0,[]);
/* ---- the Greyspine ---- */
zpTheme('g26',0x7aa04a,0.2,0.08,[['drystone',3,0.2],['haystack',2,0.4],['sheepcote',1,0.55]]);
zpTheme('g27',0x7a8a9a,0.25,0.08,[['crystal',4,0.1],['cairn',1,0.4],['rockspire',1,0.3]]);
zpTheme('g28',0x7a5a42,0.3,0.1,[['minecart',2,0.4],['mineframe',2,0.4],['orepile',3,0.2]]);                                              // miners
zpTheme('g29',0x8a8a8a,0.25,0.08,[['nest',2,0.4],['rockspire',3,0.1],['bonepile',1,0.4]]);                                              // gryphons
zpTheme('g30',0xa0a8a0,0.2,0.08,[['quartz',3,0.1],['menhir',2,0.35],['mosstone',1]]);
zpTheme('g31',0x6a6a68,0.25,0.08,[['cairn',2,0.2],['menhir',1,0.3],['bonepile',1,0.5],['rockspire',2,0.2]]);
zpTheme('g32',0x4a4a4c,0.3,0.09,[['sinkhole',2,0.4],['granitepile',3,0.1],['rockspire',1,0.4]]);
zpTheme('boss29',0x9a9890,0.35,0,[]); zpTheme('boss32',0x4a4a50,0.4,0,[]);
/* ---- the Sunscar ---- */
zpTheme('s28',0x7aa05a,0.25,0.07,[['waterjar',2,0.3],['reedhut',1,0.55,{with:['campfire']}]]);
zpTheme('s29',0xe8e0d8,0.4,0.08,[['saltcrust',4],['sunskull',1,0.4],['burrow',2,0.3]]);                                                  // the salt pan, scorpions
zpTheme('s30',0xb87a48,0.3,0.09,[['raidertent',2,0.5,{with:['campfire','banner_black']}],['weaponrack',1,0.45],['hoodoo',2,0.3]]);       // raiders
zpTheme('s31',0xb89a5a,0.25,0.08,[['sandlantern',2,0.3],['sarcophagus',1,0.5],['wormcrater',2,0.3]]);                                    // sandworms and mummies
zpTheme('s32',0x8ad8d0,0.3,0.09,[['glassspire',2,0.2],['glassshard',4]]);
zpTheme('s33',0xc0643a,0.3,0.08,[['hoodoo',3,0.1],['djinnjar',1,0.5]]);                                                                 // djinn
zpTheme('s34',0xf0e8d0,0.35,0.09,[['obelisk',2,0.4],['sarcophagus',2,0.35],['ruincol',2,0.3]]);                                          // tomb guards
zpTheme('s35',0x8a5a38,0.3,0.08,[['brazier',2,0.4],['sunaltar',1,0.6],['sarcophagus',1,0.5],['ribs',1,0.5]]);                            // sun priests
zpTheme('s36',0xe8c070,0.3,0.08,[['ribs',2,0.4],['hoodoo',2,0.2],['obelisk',1,0.5],['wormcrater',1,0.4]]);
zpTheme('sboss32',0x6ac8c8,0.45,0,[]); zpTheme('sboss36',0x8a6a40,0.45,0,[]);
/* ---- the Gloamhorn ---- */
zpTheme('m30',0x3a4a3e,0.3,0.09,[['gravestone',4],['lamppost',1,0.5],['cairn',2,0.3]]);
zpTheme('m31',0x3a4854,0.3,0.09,[['hullribs',2,0.3],['anchor',2,0.3],['lamppost_green',2,0.35]]);                                         // wreckers
zpTheme('m32',0x4a4a48,0.3,0.09,[['cairn',4],['gravestone',2,0.2],['driftlog',1,0.4]]);
zpTheme('m33',0x2e4a44,0.35,0.09,[['bogpool',3],['sunkenmast',2,0.4],['deadstump',2,0.2]]);
zpTheme('m34',0x4a5a6a,0.3,0.08,[['sirenrock',3,0.2],['wisplamp_blue',2,0.3],['runestone_dusk',1,0.5]]);                                  // banshees
zpTheme('m35',0x3a3438,0.35,0.09,[['gallows',2,0.45],['gravestone',3],['bonepile',1,0.4]]);                                              // ghouls
zpTheme('m36',0x484850,0.3,0.09,[['menhir',2,0.25],['weepingstatue',3,0.2],['runestone_dusk',1,0.4]]);
zpTheme('m37',0x3a4258,0.3,0.08,[['wisplamp_blue',3,0.2],['gravestone',3],['cairn',1,0.3]]);
zpTheme('m38',0x3a3040,0.35,0.1,[['crypt',1,0.55],['webdome',2,0.3],['web',1,0.4],['cocoon',2,0.3],['gravestone',2]]);                     // weeping widows
zpTheme('m39',0x44464e,0.3,0.09,[['gargoyle',2,0.4],['sirenrock',3,0.1],['menhir',1,0.4]]);
zpTheme('m40',0x2a3a4a,0.35,0.09,[['lamppost',2,0.3],['sirenrock',2,0.2],['hullribs',1,0.5],['weepingstatue',1,0.5]]);
zpTheme('mboss35',0x2a4a50,0.45,0,[]); zpTheme('mboss40',0x3a3a5a,0.45,0,[]);

/* ---- boss surroundings: [kind, count, from r+a, to r+b, {face: turn towards the arena, big: scale up}] on a ring outside each arena's own dressing (the clearing is flat to r+22) ---- */
const ZP_BOSS={
  boss:[['rootarch',6,6,20],['hollowstump',5,7,22],['runestone',5,6,12,{face:1}],['mosstone',8,5,22],['deadstump',4,8,22]],                        // the Rootwarden
  boss20b:[['shell',8,6,20,{big:1.7}],['driftlog',5,8,22],['crabpot',5,6,18],['anchor',3,8,20],['hullribs',2,10,22]],                          // the Tide King
  boss20:[['kanabo',7,6,18],['ironstakes',6,8,22],['bonepile',7,6,22],['torii_dark',2,9,16,{face:1}],['banner_black',4,7,20]],                  // Akaoni
  boss25:[['toro',8,6,20],['foxstatue',4,6,14,{face:1}],['torii',2,10,16,{face:1}],['foxfire',8,5,24]],                                         // Kyuubi
  boss26:[['icepillar',7,6,20],['iceshard',8,6,24],['runestone_ice',4,7,14,{face:1}],['banner_ice',4,8,20]],                                    // Ymrik
  boss30:[['wyrmribs',3,8,18],['iceshard_big',5,8,24],['bonepile',7,6,22],['ribs',2,10,22]],                                                   // Vetrmaw
  boss29:[['nest',3,6,16],['rockspire',9,6,24],['bonepile',6,6,20],['menhir',3,8,16]],                                                          // the Gryphon Queen
  boss32:[['granitepile',7,6,22],['menhir',6,7,18],['crystal',5,8,24],['orepile',3,10,22]],                                                     // the Mountain Golem
  sboss32:[['glassspire',9,6,22],['glassshard',10,5,24],['obelisk',3,8,16,{face:1}]],                                                           // the Glass Guardian
  sboss36:[['ribs',4,8,20],['hoodoo',6,7,24],['wormcrater',3,8,22],['obelisk',2,10,18,{face:1}]],                                               // the sand wyrm
  mboss35:[['hullribs',3,8,22],['anchor',4,6,20],['sunkenmast',3,8,22],['lamppost_green',6,5,20],['gravestone',6,6,22]],                        // the Drowned Captain
  mboss40:[['lamppost',8,5,20],['gargoyle',5,7,20,{face:1}],['sirenrock',6,8,24],['weepingstatue',4,7,18,{face:1}]]};                           // the Gloam Light's keeper
/* ---- ruins: layouts of pieces [kind, dx, dz, yaw offset] ---- */
const ZP_PLANS=[   // r: the layout's radius (spacing and the clear-ground check); each plan is ONE merged prop kind (ruinplan0...) so a ruin costs one draw call
  {w:3,r:6,p:[['ruinwall',0,-4,0],['ruinwall',0,4,0],['ruinwall',-4,0,Math.PI/2],['ruincol',3.6,3.6,0],['ruincol',3.6,-3.6,0],['ruincolfall',-1.5,1.2,0.6],['ruinslab',0.5,0,0.3],['ruinblock',2.5,0.5,1]]},   // a roofless hall
  {w:3,r:5,p:[['ruinarch',0,0,0],['ruinblock',2.6,1.8,0.4],['ruinblock',-2.2,-1.4,1.1],['ruincolfall',3.8,-2.2,2],['ruinslab',-1,2.5,0.2]]},                                                          // a gate
  {w:2,r:7,p:[['ruincol',-5.1,0,0],['ruincol',-1.7,0,0],['ruincolfall',1.7,0.5,0.3],['ruincol',5.1,0,0],['ruinslab',0,-2.5,0.2],['ruinblock',-3.5,1.8,0.6]]},                                           // a colonnade
  {w:2,r:5,p:[['ruinbase',0,0,0],['ruinblock',4.5,1,0.5],['ruincolfall',-4.5,2.5,1.2],['ruinslab',0,0,0.4]]},                                                                                         // a tower's stump
  {w:2,r:5,p:[['ruinslab',0,0,0],['ruincol',-2.2,-1.6,0],['ruincol',2.2,-1.6,0],['ruinwall',0,-4.4,0],['ruinblock',1.4,2.4,0.3]]}];                                                                    // a shrine yard
ZP_KIND.ruinwall.cols=[[-1.4,0,0.7],[0,0,0.7],[1.4,0,0.7]];
ZP_KIND.ruinbase.cols=[0,1,2,4,5,6,7].map(i=>[Math.sin(i*0.785)*3,Math.cos(i*0.785)*3,0.8]);
ZP_PLANS.forEach((pl,i)=>{   // the layouts as props: the pieces merged, their collision circles carried along
  const cols=[]; for(const [k,dx,dz,dy] of pl.p){ const K=ZP_KIND[k], c=Math.cos(dy), n=Math.sin(dy), at=(lx,lz)=>[dx+lx*c+lz*n,dz-lx*n+lz*c];
    if(K.rad){ const [x,z]=at(0,0); cols.push([x,z,K.rad]); } if(K.cols) for(const [lx,lz,r] of K.cols){ const [x,z]=at(lx,lz); cols.push([x,z,r]); } }
  zpDef('ruinplan'+i,{w:pl.r,hgt:3.8,sink:0.4,cast:true,cols,gen:()=>merge(pl.p.map(([k,dx,dz,dy])=>ZP_KIND[k].gen().rotateY(dy).translate(dx,0,dz)))}); });

/* ---- the ground: a tint per zone, blended over the cells' borders ---- */
const ZP_ZI=new Map(ZONES.map((z,i)=>[z,i])), ZP_TH_OF=ZONES.map(z=>ZP_THEME[String(z.key)]||null), ZP_CELLS=new Int16Array(ZP_NX*ZP_NZ).fill(-2);
function zpCellZone(ix,iz){ ix=Math.max(0,Math.min(ZP_NX-1,ix)); iz=Math.max(0,Math.min(ZP_NZ-1,iz)); const k=iz*ZP_NX+ix; let v=ZP_CELLS[k];
  if(v===-2){ const zn=zoneAt(WX0+(ix+0.5)*ZP_CELL,WZ0+(iz+0.5)*ZP_CELL); v=zn?ZP_ZI.get(zn):-1; if(v===undefined) v=-1; ZP_CELLS[k]=v; } return v; }
function zpGroundTint(x,z,h,g,out){
  const fx=(x-WX0)/ZP_CELL-0.5, fz=(z-WZ0)/ZP_CELL-0.5, ix=Math.floor(fx), iz=Math.floor(fz), tx=fx-ix, tz=fz-iz;
  let sk=0, r=0, gg=0, b=0;
  for(let j=0;j<4;j++){ const w=(j&1?tx:1-tx)*(j&2?tz:1-tz); if(w<0.001) continue; const zi=zpCellZone(ix+(j&1),iz+(j>>1)), th=zi>=0?ZP_TH_OF[zi]:null; if(!th) continue;
    const s=w*th.tk; sk+=s; r+=s*th.tr; gg+=s*th.tg; b+=s*th.tb; }
  if(sk<0.002) return out;
  let k=sk*(1-0.5*smoothstep(0.7,1.2,g))*smoothstep(-0.6,0.8,h);   // less on bare cliffs, none under water
  for(const E of dgEntList){ const dx=x-(E.x+Math.sin(E.a)*DG_APRON*0.5), dz=z-(E.z+Math.cos(E.a)*DG_APRON*0.5), R2=DG_ENT_R*1.6;   // and none on a dungeon door's own patch of ground (dgEntTint paints that)
    if(dx>R2||dx<-R2||dz>R2||dz<-R2) continue; k*=smoothstep(DG_ENT_R*0.7,R2,Math.hypot(dx,dz)); }
  out.r+=(r/sk-out.r)*k; out.g+=(gg/sk-out.g)*k; out.b+=(b/sk-out.b)*k; return out; }
function terrainColor(x,z,h,g,out,noCut){ return zpGroundTint(x,z,h,g,terrainColorBase(x,z,h,g,out,noCut)); }   // (zpGroundTint leaves a dungeon door's own patch of ground alone)

/* ---- the props ---- */
let ZP_MATS=null;
function zpMat(name){ if(!ZP_MATS) ZP_MATS={rock:new THREE.MeshLambertMaterial({vertexColors:true}),flat:new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}),glow:new THREE.MeshBasicMaterial({vertexColors:true})};
  return ZP_MATS[name]; }
const zpClu=(x,z,i)=>noise2(x*0.045+i*13.1,z*0.045-i*7.7)*0.5+0.5;   // 0..1, patches ~25 m across: camps stand where it is high
const zpHash=s=>{ let h=7; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return Math.abs(h)+1; };
// not here: keep-outs of the lands (the same list the trees use, plus villages, roads, the tunnel, story spots, dungeon doors)
function zpBlocked(x,z){
  if(vDist(x,z)<VR+8||nearPath(x,z,3)||inTunnelCut(x,z,2)||storyClear(x,z)||dgEntClear(x,z)) return true;
  if(inSun(x,z)&&x<HX0-12) return sunKeepOut(x,z,3);
  if(inGloam(x,z)&&x<GW0-10) return gloamIn(x,z)<14||gloamKeepOut(x,z,3);
  if(inHoar(x,z)&&(iceDist(x,z)<4||inPass(x,z,4))) return true;
  return inGlen(x,z,3)||inGate(x,z,2)||greyWet(x,z,-1.2); }
const zpOk=(x,z,h,g,gmax)=>h>=0.7&&g<=gmax&&arenaDist(x,z)>=22&&!zpBlocked(x,z);
function zpAge(x,z){   // how many ruins a land has: older and darker means more
  if(inSun(x,z)&&x<HX0-12) return 0.34; if(inGloam(x,z)) return 0.5; if(inHoar(x,z)) return 0.22; if(inGrey(x,z)) return 0.3; if(inVale(x,z)) return 0.12; return 0.1; }
function zpRuinTint(x,z){ const c=inSun(x,z)&&x<HX0-12?0xe6c88a:inGloam(x,z)?0x7c7c88:inHoar(x,z)?0xe4eef8:inGrey(x,z)?0xc8c8c0:inVale(x,z)?0xd0c4c4:0xc4d4a8; return tint(c,0.08); }
function zpMeshes(lists){
  const md=LOW?85:118;
  for(const kind in lists){ const K=ZP_KIND[kind], G=zpGeo(kind), items=lists[kind], o={cast:K.cast&&!LOW,receive:true,maxDist:md,hgt:K.hgt*1.5,rad:K.w*1.5+1};
    addInstanced(G.geo,zpMat(K.mat),items,o);
    if(G.glow) addInstanced(G.glow,zpMat('glow'),items,{maxDist:md,hgt:K.hgt*1.5,rad:K.w*1.5+1}); } }
function* genZoneProps(ci){
  const rc=chunkRect(ci,5), lists={}, placed=[];
  const room=(x,z,r)=>{ for(let i=0;i<placed.length;i+=3){ const dx=placed[i]-x, dz=placed[i+1]-z, rr=placed[i+2]+r; if(dx*dx+dz*dz<rr*rr) return false; } return canPlace(x,z,r); };
  const put=(kind,x,z,yaw,s,tc)=>{ const K=ZP_KIND[kind], r=K.w*s*0.8+0.4; if(!room(x,z,r)) return false;
    const h=getH(x,z), t=K.tilt, m=mtx(x,h-K.sink*s,z,yaw,s,s,s,t?R(-t,t):0,t?R(-t,t):0);
    (lists[kind]||(lists[kind]=[])).push({x,z,m,c:tc||tint(0xeeeeee,0.12)}); placed.push(x,z,r);
    if(K.rad) addCol(x,z,K.rad*s);
    if(K.cols) for(const [dx,dz,cr] of K.cols) addCol(x+dx*Math.cos(yaw)*s+dz*Math.sin(yaw)*s,z-dx*Math.sin(yaw)*s+dz*Math.cos(yaw)*s,cr*s);
    return true; };
  // 1. what the zone's monsters leave: camps, webs, graves
  const att=Math.round(150*Math.min(Q,1.3));
  for(let a=0;a<att;a++){
    if((a&63)===63) yield;
    const x=R(rc[0],rc[1]), z=R(rc[2],rc[3]), zi=zpCellZone(Math.floor((x-WX0)/ZP_CELL),Math.floor((z-WZ0)/ZP_CELL)), th=zi>=0?ZP_TH_OF[zi]:null;
    if(!th||!th.dens||rand()>th.dens) continue;
    let tot=0; const cand=[]; for(let i=0;i<th.entries.length;i++){ const e=th.entries[i]; if(e.cmin>0&&zpClu(x,z,i)<e.cmin) continue; cand.push(e); tot+=e.w; }
    if(!cand.length) continue;
    let rr=rand()*tot, e=cand[0]; for(const c of cand){ rr-=c.w; if(rr<=0){ e=c; break; } }
    const K=ZP_KIND[e.kind], h=getH(x,z);
    if(!zpOk(x,z,h,grad(x,z),K.w>2?0.3:0.5)) continue;
    if(!put(e.kind,x,z,rand()*TAU,e.o.s?R(e.o.s[0],e.o.s[1]):R(0.85,1.25))) continue;
    if(e.o.with) for(const wk of e.o.with) for(let t=0;t<4;t++){   // a camp's fire, totem or banner, 3-5 m from the hut
      const ang=rand()*TAU, d=R(3,5.2), wx=x+Math.sin(ang)*d, wz=z+Math.cos(ang)*d;
      if(zpOk(wx,wz,getH(wx,wz),grad(wx,wz),0.4)&&put(wk,wx,wz,rand()*TAU,R(0.9,1.2))) break; }
  }
  yield;
  // 2. the boss arenas' surroundings (the same slots for every chunk: only those inside this one are placed)
  for(const A of ARENAS){ const cfg=ZP_BOSS[A.key]; if(!cfg) continue;
    if(Math.hypot(Math.max(rc[0]-A.x,0,A.x-rc[1]),Math.max(rc[2]-A.z,0,A.z-rc[3]))>A.r+36) continue;
    const q=mrng(zpHash(A.key)).R;
    for(const [kind,n,a0,a1,o] of cfg) for(let i=0;i<n;i++){
      const ang=(i+q(0.1,0.9))/n*TAU, d=A.r+q(a0,a1), yaw0=q(0,TAU), s=q(0.9,1.3)*((o&&o.big)||1), x=A.x+Math.sin(ang)*d, z=A.z+Math.cos(ang)*d;
      if(x<rc[0]||x>rc[1]||z<rc[2]||z>rc[3]) continue;
      const h=getH(x,z); if(h<0.4||grad(x,z)>0.65||zpBlocked(x,z)) continue;
      put(kind,x,z,o&&o.face?Math.atan2(A.x-x,A.z-z):yaw0,s); }
  }
  yield;
  // 3. ruins, anywhere, thicker where the land is old: a whole layout on clear, level ground
  let tw=0; for(const pl of ZP_PLANS) tw+=pl.w;
  for(let a=0;a<5;a++){
    const x=R(rc[0],rc[1]), z=R(rc[2],rc[3]);
    if(rand()>zpAge(x,z)||zpClu(x,z,9)<0.35) continue;
    const h=getH(x,z); if(!zpOk(x,z,h,grad(x,z),0.3)) continue;
    let r2=rand()*tw, pi=0; for(let i=0;i<ZP_PLANS.length;i++){ r2-=ZP_PLANS[i].w; if(r2<=0){ pi=i; break; } }
    const pr=ZP_PLANS[pi].r*0.7; let clear=true;   // the ground round it must be fit too, or it would stand in a lake, a road or a cliff
    for(let k=0;k<4&&clear;k++){ const px=x+Math.sin(k*1.57)*pr, pz=z+Math.cos(k*1.57)*pr; if(getH(px,pz)<0.5||grad(px,pz)>0.55||zpBlocked(px,pz)||arenaDist(px,pz)<22) clear=false; }
    if(clear) put('ruinplan'+pi,x,z,rand()*TAU,R(0.9,1.15),zpRuinTint(x,z));
    if((a&1)===1) yield;
  }
  zpMeshes(lists);
}
