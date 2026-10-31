//@ The Emberwake Isles' two world bosses as data: Ocelo the Sun-Jaguar (level 45, the Jaguar Court) and Tuila the Tide-Caller (level 46, the strait's tidepool; her fall opens the zone tier), their adds, and EW_BOSS_ROWS (the BOSS_DEFS rows)
/* Agent map: exports OCELO_DEF, ACOLYTE_DEF, TUILA_DEF, TIDESPIRIT_DEF, EW_BOSS_ROWS (pushed to BOSS_DEFS and ALL_MON_DEFS at the bottom of this file; their arenas eboss45 / eboss46 are placed by emberwakezones.js, which loads earlier).
   Kits: server/boss-kits-isles.js (BOSS_KITS.jaguar / tidecaller). Skills: the rows with drop:'ocelo' / 'tuila' in classes.js. Materials: MAT_NAMES (drops.js). ZTIER_BOSS.isles is 'tuila' (shared/tiers.js).
   The bar texts are for B.mode: 1 (Ocelo's leap), 2 (Ocelo stalking, hidden), 6 (Tuila's ebb: the undertow). Test: node tools/boss-smoke.js isles (the kits), tools/emberwake-smoke.js. Docs: docs/EMBERWAKE.md. */
const OCELO_DEF=bossDef({id:'ocelo',name:'Ocelo, the Sun-Jaguar',level:45,el:'fire',model:'feline',scale:4.2,boss:true,heavy:true,glow:0x3a1a04,atk:2.2,speed:3.2,aggro:0,
  pal:{spots:1,body:0xd8a030,belly:0xf0d890,tip:0x2a1a0a,eye:0xff6a20,legs:0xb88a28}});
const ACOLYTE_DEF={id:'jaguaracolyte',name:'Jaguar Acolyte',level:44,el:'fire',model:'goblin',scale:1.0,hpK:0.6,dmgPct:0.07,atk:1.8,speed:3.0,aggro:30,
  pal:{form:'hob',garb:'sash',skin:0xa07850,eyes:0xffa030,top:'jacket',topColor:0xd8a030,bottom:'trousers',bottomColor:0x3a2a14,hat:'ranger',hatColor:0x2a1a0a,club:0x8a8a82,weapon:'scimitar',turban:0xd8a030}};
prepDef(ACOLYTE_DEF);
const TUILA_DEF=bossDef({id:'tuila',name:'Tuila, the Tide-Caller',level:46,el:'water',model:'djinn',scale:3.6,boss:true,heavy:true,glow:0x04202a,atk:2.4,speed:2.6,aggro:0,
  pal:{siren:1,fin:0x2fd0c4,body:0x1a8aa0,skin:0xb0e0dc,gold:0xf0f4e8,turban:0x0c3a50,eye:0xffffff}});
const TIDESPIRIT_DEF={id:'tidespirit',name:'Tide Spirit',level:45,el:'water',model:'wisp',scale:0.8,hpK:0.6,dmgPct:0.07,atk:1.6,speed:3.2,aggro:30,glow:0x0a3a4a,
  pal:{body:0x4ad0e0,core:0xe8ffff,eye:0x0a2a3a}};
prepDef(TIDESPIRIT_DEF);
const EW_BOSS_ROWS=[
  {def:OCELO_DEF,arena:'eboss45',kit:'jaguar',add:ACOLYTE_DEF,short:'Ocelo',bar:{1:'Leaping!',2:'Stalking: watch the shadows!',stun:'Winded: hit him now!'}},
  {def:TUILA_DEF,arena:'eboss46',kit:'tidecaller',add:TIDESPIRIT_DEF,short:'Tuila',bar:{6:'Ebb: the undertow drags you in, run from the middle!',stun:'The tide is spent: hit her now!'}}];
EW_BOSS_ROWS.forEach(b=>{ b.add.bossAdd=true; });   // (the adds of a boss grow like the boss: LATE_CREEP_BOSS)
BOSS_DEFS.push(...EW_BOSS_ROWS); ALL_MON_DEFS.push(...EW_BOSS_ROWS.flatMap(b=>[b.def,b.add]));
