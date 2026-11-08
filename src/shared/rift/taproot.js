//@ The first elemental rift, the Taproot (Wildwood's root rift, pays Prime Essence): its tear in the home forest's east wilds, its moss-and-gold aura, six earth glass kinds and a Herald
/* agent map: six riftMobDef calls and ONE defineElemRift call (shared/rift.js: the level 28 opening, the wave plan, the kind weights and the reward are shared by every elemental rift, so this file
   only says what differs: the element every monster has, what it pays, where the tear is, the look). A monster whose element is not the rift's leaves the rift out (RIFT_BAD).
   COPY THIS FILE for another elemental rift (docs/RIFT.md section 5): a new id, six base kinds, the element, the essence ('prime' or that element), the tear, the colours; add the file to src/manifest.json after it.
   The tear: tools/rift-site.js (flat ground 345 m east of the village in the level-13 wilds, off the roads and the coast, 64 m from the nearest camp). Test: tools/rift-smoke.js */
riftMobDef('treant','rootlet','Rootlet',{el:'earth',pal:{tint:0xc9a24a}});
riftMobDef('ironshell','rootgnarl','Gnarl Beetle',{el:'earth',pal:{tint:0xa8763a}});
riftMobDef('ramboar','rootboar','Burrow Boar',{el:'earth',pal:{tint:0xb8924e}});
riftMobDef('shroom','rootsprout','Mulch Sprout',{el:'earth',pal:{tint:0xe0c068}});
riftMobDef('goblin','rootburl','Burl Goblin',{el:'earth',pal:{tint:0x9a7a3a}});
riftMobDef('cragwarden','rootstone','Stoneroot Warden',{el:'earth',pal:{tint:0xd8b858}});
riftMobDef('ancient','rootherald','Taproot Herald',{el:'earth',scale:1.5,heavy:true,pal:{tint:0xf0d070}});
defineElemRift({id:'taproot',name:'The Taproot',blurb:'A tear into a void of roots and earth-gold light. Root-born monsters of the earth element pour in, wave after wave. It pays Prime Essence, no XP and no coins.',
  door:{x:368,z:68},aura:[0x6a9a3a,0xc9a24a,0xf0d070],music:'rift',el:'earth',essence:'prime',herald:'rootherald',
  mobs:['rootlet','rootgnarl','rootboar','rootsprout','rootburl','rootstone']});
