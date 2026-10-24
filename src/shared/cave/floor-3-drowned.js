//@ Cave floor 3, the Drowned Galleries (monsters level 45-54): flooded old halls with pillars, an underground river, waterfalls indoors; its generator options, look and ten monsters
/* Agent map. defineCaveFloor (shared/cave-map.js); see floor-1-grotto.js for the look keys. The halls are rectangular and flooded ankle-deep (gen.flood), pillars stand in a grid (gen.pillars), the river runs along the
   main way (gen.river); look.masonry draws the rock as laid stone. */
caveMobDef('brineslime','siltslime','Silt Slime',{level:45,el:'water',scale:1.9,pal:{deco:'moss',body:0x3a6a50,top:0x9ad0b0,mouth:0x0a2018}});
caveMobDef('gloomserpent','galleryeel','Gallery Eel',{level:46,el:'water',scale:1.5,pal:{fin:0x3a8a7a,spots:0xa0ffe0,body:0x2a5a50,belly:0x7ab0a0,ridge:0x123a34,horn:0xd0e8e0,eye:0xe8ff7a}});
caveMobDef('drownedsailor','sunkenguard','Sunken Guard',{level:47,el:'dark',scale:1.2,pal:{skin:0x7a9a8a,eyes:0x9affe0,topColor:0x2a4a48,bottomColor:0x1a2e2c,hatColor:0x2a3a3a,club:0x7a8a86,weeds:0x2e6a4a}});
caveMobDef('lanternwisp','hallwisp','Hall Lantern',{level:48,el:'light',scale:1.35,glow:0x0a3a30,pal:{lantern:1,body:0x6af0d0,core:0xffffff,eye:0x053a36}});
caveMobDef('gloomcrab','gallerycrab','Gallery Crab',{level:49,el:'water',scale:1.8,pal:{shell:0x4a7a6a,seam:0x1a3a34,sheen:0xa0e8d0,head:0x2a4a40,horn:0xd0e8e0,eye:0xe8ff7a,legs:0x3a6a5a,crab:1}});
caveMobDef('hollowknight','drownedknight','Drowned Knight',{level:50,el:'dark',scale:1.45,glow:0x042a24,pal:{skin:0x5a7a72,eyes:0x7affd8,topColor:0x4a5a58,bottomColor:0x242e2c,hatColor:0x5a6866,club:0xa8b8b4}});
caveMobDef('gravehound','hallhound','Hall Hound',{level:51,el:'dark',scale:1.55,pal:{body:0x2a4a48,belly:0x4a6a66,tip:0x142a28,eye:0x7affd8,legs:0x142a28}});
caveMobDef('gloombat','gallerybat','Gallery Bat',{level:52,el:'air',scale:1.6,pal:{body:0x3a5a5a,belly:0x6a8a88,wing:0x2a4a4a,horn:0xd0e8e0,eye:0x7affd8}});
caveMobDef('stormgargoyle','hallgargoyle','Hall Gargoyle',{level:53,el:'air',scale:1.55,pal:{crack:0x7affd8,body:0x586664,belly:0x8a9a96,ridge:0x2a3836,horn:0xc8d4d0,eye:0x7affd8,wing:0x3a4a48}});
caveMobDef('deepsiren','floodsiren','Flood Siren',{level:54,el:'water',scale:1.5,glow:0x042a30,pal:{siren:1,fin:0x2a9a8a,body:0x145a56,skin:0xa8d8c8,gold:0xc8e0a0,turban:0x0a3a3a,eye:0xe8ffff}});
defineCaveFloor({id:'drowned',n:3,name:'The Drowned Galleries',theme:'drowned',lv:[45,54],seed:6151,
  mobs:['siltslime','galleryeel','sunkenguard','hallwisp','gallerycrab','drownedknight','hallhound','gallerybat','hallgargoyle','floodsiren'],
  gen:{cells:168,chambers:11,rMin:7,rMax:11,rStart:8,tw:2.8,wind:3,side:9,loops:4,style:'hall',camps:22,pools:0,flood:true,pillars:true,river:true,waterDepth:0.5,relief:0.3,start:[0.11,0.45],deep:[0.89,0.55]},
  look:{music:'gloam1',wall:0x5e6866,wall2:0x444e4c,floor:0x363e3c,ceil:0x222828,fog:0x03100f,amb:0.3,light:0x6af0d0,water:0x2a9a90,h0:6,hk:1.0,hmax:14,wobble:0.12,far:50,masonry:true,fx:['water','falls','pillars','moss']}});
