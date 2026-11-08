//@ The Sunlit Rift, a Sakura Vale rift (light, pays Light Essence): its tear in the Vale's wilds, its gold-cream aura, six light glass kinds and a Herald
/* agent map: six riftMobDef calls and ONE defineElemRift call. A copy of taproot.js (docs/RIFT.md section 5): the element, the essence, the tear and the colours differ; the shared plan is in shared/rift.js.
   The tear: the main coordinates are on the task card; a backup is checked by tools/rift-smoke.js. Test: tools/rift-smoke.js */
riftMobDef('sakuraslime','sunslime','Sunbeam Slime',{el:'light',pal:{tint:0xffe890}});
riftMobDef('kodama','sunkodama','Dawn Kodama',{el:'light',pal:{tint:0xfff0b0}});
riftMobDef('goldkabuto','sunbeetle','Gilt Beetle',{el:'light',pal:{tint:0xf0d060}});
riftMobDef('foxkit','sunfox','Halo Fox',{el:'light',pal:{tint:0xffe0a0}});
riftMobDef('onibi','sunwisp','Glimmer Wisp',{el:'light',pal:{tint:0xfffacc}});
riftMobDef('ashigaru','sunguard','Daybright Ashigaru',{el:'light',pal:{tint:0xf8d890}});
riftMobDef('sakuratreant','sunherald','Dayspring Herald',{el:'light',scale:1.5,heavy:true,pal:{tint:0xfff0b8}});
defineElemRift({id:'sunlit',mode:'beacons',shape:['....O','HoOoO','....O'],   // its platforms: a long sun road that ends in a cross
  name:'The Sunlit Rift',blurb:'A tear into a void of warm gold light and drifting dust. Sun-born monsters of the light element pour in, wave after wave. It pays Light Essence, no XP and no coins.',
  door:{x:632,z:488},aura:[0xffe9a0,0xffd060,0xfff4c8],music:'rift',el:'light',essence:'light',herald:'sunherald',
  mobs:['sunslime','sunkodama','sunbeetle','sunfox','sunwisp','sunguard']});
