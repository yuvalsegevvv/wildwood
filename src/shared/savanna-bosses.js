//@ The Amber Reach's two world bosses as data: Old Thunder (level 41, the Anvilwing) and Oldhorn the Herd-Mother (level 45), their adds, and SAV_BOSS_ROWS (the BOSS_DEFS rows, not yet in BOSS_DEFS)
/* Agent map: exports OLDTHUNDER_DEF, SPARKWISP_DEF, OLDHORN_DEF, CARRIER_DEF, SAV_BOSS_ROWS. Kits: server/boss-kits-savanna.js (BOSS_KITS.thunder / herdmother). Skills: the rows with
   drop:'oldthunder' / 'oldhorn' in classes.js. Test: node tools/boss-smoke.js savanna (the kits), docs/areas/monsters-bosses.md.
   WHY NOT IN BOSS_DEFS YET: a row needs its arena (ARENAS key 'aboss41' / 'aboss45', ARENA_A41 / ARENA_A45 in the land's zones file) and half the client (map, quest pins, the skills panel)
   reads ARENAS.find(...) of every BOSS_DEFS row. Task M2 (wire-up) places the arenas, then does: BOSS_DEFS.push(...SAV_BOSS_ROWS); add both ids to MAT_NAMES (drops.js) and ALL_MON_DEFS.
   The bar texts are for B.mode: 4 (Old Thunder's eye of calm) and 6 (Oldhorn's grey floor). */
const OLDTHUNDER_DEF=bossDef({id:'oldthunder',name:'Old Thunder, the Anvilwing',level:41,el:'air',model:'gryphon',scale:3.4,boss:true,heavy:true,glow:0x1a1a2a,atk:2.3,speed:3.0,aggro:0,
  pal:{body:0x4a4f66,belly:0x8a90a8,plume:0xd8dcf0,beak:0xe8c840,eye:0xfff070,wing:0x30344a,tuft:0x20243a}});
const SPARKWISP_DEF={id:'sparkwisp',name:'Spark Wisp',level:40,el:'air',model:'wisp',scale:0.7,hpK:0.6,dmgPct:0.07,atk:1.5,speed:3.6,aggro:30,glow:0x40380a,
  pal:{body:0xffe070,core:0xffffff,eye:0x402000}};
prepDef(SPARKWISP_DEF);
const OLDHORN_DEF=bossDef({id:'oldhorn',name:'Oldhorn, the Herd-Mother',level:45,el:'earth',model:'boar',scale:4.0,boss:true,heavy:true,glow:0x181816,atk:2.6,speed:2.4,aggro:0,
  pal:{ram:1,warthog:1,shaggy:1,body:0x7a7a74,ridge:0xc8c4b8,head:0x6a6a64,snout:0x8a8880,tusk:0xf0ead8,legs:0x3a3a38,eye:0xc8d0d8}});
const CARRIER_DEF={id:'greycarrier',name:'Hollowed Carrier',level:44,el:'earth',model:'treant',scale:0.8,hpK:0.6,dmgPct:0.07,atk:1.8,speed:2.6,aggro:30,
  pal:{bark:0x6a6a68,c1:0x8a8a88,c2:0x5a5a5a,c3:0x4a4a4a,eyes:0xd8e0e8}};
prepDef(CARRIER_DEF);
const SAV_BOSS_ROWS=[
  {def:OLDTHUNDER_DEF,arena:'aboss41',kit:'thunder',add:SPARKWISP_DEF,short:'Old Thunder',bar:{4:'The eye of calm: stay inside the circle!',stun:'Grounded: hit it now!'}},
  {def:OLDHORN_DEF,arena:'aboss45',kit:'herdmother',add:CARRIER_DEF,short:'Oldhorn',auxText:'Grey stones: {n} (kill the carriers)',bar:{6:'Grey floor: kill the carriers to cleanse it!',stun:'Winded: hit her now!'}}];
SAV_BOSS_ROWS.forEach(b=>{ b.add.bossAdd=true; });   // (the adds of a boss grow like the boss: LATE_CREEP_BOSS)
