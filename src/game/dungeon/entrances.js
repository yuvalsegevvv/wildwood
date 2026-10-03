//@ The three dungeon doors as the client plays them: sealed or open (follows your gear), the talk prompt and dgOpenDoor, the ground patch, the clearing, map and minimap markers, the sounds
/* Agent map (docs/DUNGEON-THEMES.md section 6; the meshes are game/village/buildings-dungeon.js; test tools/entrances-client-smoke.js).
   Data (shared/dungeons.js, never copied here): DG_ENTRANCES (x, z, a, kind, name, sign), DG_ENT_CLEAR, DG_ENT_TALK, dgEntranceNear, dgGateOpen, dgUnlocked, DG_LANDS.
   Public:  dgOpenDoor(id)      the talk key at a door (id = the entrance's key = its theme id): sealed -> a toast with what unlocks it; open -> dgBoardOpen(themeId) once the
                                Delve board exists (a later agent defines that global), otherwise "The way is not ready yet".
            dgEntSealed(E)      true while the door's gate is shut for YOUR gear (Wildwood: not played at +1; the others: Hanami / Rimehold not walked into).
   Hooks (each marked `// dungeons:` in the file that calls it): dgEntTint (terrain-color.js), dgEntClear (generation-chunks.js), dgEntPrompt + dgOpenDoor (talking.js),
            dgEntMapMarks / dgEntMiniMarks / dgEntName (map.js), dgEntWater / dgEntSounds (audio/driver.js), dgEntBuild / dgEntUpdate (generation-setup.js, main/loop.js). */

const dgEntList=Object.keys(DG_ENTRANCES).map(k=>DG_ENTRANCES[k]);
// what was built, by entrance id (filled by game/village/buildings-dungeon.js): doors[id] = {E, G (the group), sealed, lit, feet, cols, seal...}, signs[id]; noTint switches the ground patch off (a test)
const DG_DOORS={doors:{},signs:{},noTint:false};
// a theme's data when it is registered (themes are files of their own, shared/dungeons/themes/: a bad or missing one is left out and the door must still stand), else the little a door needs: its land is where it stands
const dgEntTheme=E=>DG_THEMES[E.theme]||{id:E.theme,name:E.name,land:landAt(E.x,E.z)};
const dgEntSealed=E=>!dgGateOpen(GEAR,dgEntTheme(E));
// where each door's patch is centred: the middle of the way from the door to its apron, so the front of the door (not the bank behind it) is what changes colour
const dgEntCentre=E=>({x:E.x+Math.sin(E.a)*DG_APRON*0.5,z:E.z+Math.cos(E.a)*DG_APRON*0.5});

/* ---- the ground ----
   A patch of DG_ENT_CLEAR + 1 m round each door, blended with noise so its edge is never a circle. The terrain's height is not touched (it moves what the scan finds,
   CLAUDE.md section 8): only the colour. Moss and roots under the Elder, wet dark stone and jade round the Falls, trampled snow and bone-grey round the Barrow. */
const DG_ENT_R=DG_ENT_CLEAR+1;
const dgEntPal={
  moss:new THREE.Color(0x3a5826), root:new THREE.Color(0x4a3524), ring:new THREE.Color(0x6f8f3c),
  wet:new THREE.Color(0x4a5a58), jade:new THREE.Color(0x4f7d6c), flag:new THREE.Color(0x6a7873),
  tramp:new THREE.Color(0xc4cace), bone:new THREE.Color(0xb3b0a2), rime:new THREE.Color(0xe4edf2)};
const dgEntTmp=new THREE.Color();
function dgEntTint(x,z,out){
  if(DG_DOORS.noTint) return out;
  for(let i=0;i<dgEntList.length;i++){
    const E=dgEntList[i], C=dgEntCentre(E), dx=x-C.x, dz=z-C.z; if(dx>DG_ENT_R||dx<-DG_ENT_R||dz>DG_ENT_R||dz<-DG_ENT_R) continue;
    const d=Math.hypot(dx,dz); if(d>=DG_ENT_R) continue;
    const n=noise2(x*0.31+i*7,z*0.31)*0.5+0.5, n2=noise2(x*0.9-4,z*0.9+i)*0.5+0.5;
    let w=smoothstep(DG_ENT_R*(0.92+0.1*(n-0.5)),DG_ENT_R*0.28,d)*0.9;   // a ragged edge, the middle nearly all the patch's own colour
    if(E.kind==='roots'){   // moss over a floor of roots that run out from the trunk 2.7 m behind the door
      const tx=E.x-Math.sin(E.a)*2.7, tz=E.z-Math.cos(E.a)*2.7, ang=Math.atan2(x-tx,z-tz), td=Math.hypot(x-tx,z-tz);
      const streak=smoothstep(0.62,0.9,Math.abs(Math.sin(ang*7+noise2(x*0.2,z*0.2)*4)))*smoothstep(11,2.5,td);
      out.lerp(dgEntTmp.copy(dgEntPal.moss).lerp(dgEntPal.ring,smoothstep(0.55,0.9,n2)*0.5),w);
      out.lerp(dgEntPal.root,streak*w*0.85);
    } else if(E.kind==='falls'){   // wet dark flags round the pool, jade where the spray lands
      const wetK=smoothstep(11,2,d);
      out.lerp(dgEntTmp.copy(dgEntPal.flag).lerp(dgEntPal.wet,wetK*0.8),w).lerp(dgEntPal.jade,w*smoothstep(0.55,0.9,n)*0.45);
      out.multiplyScalar(1-0.14*wetK);
    } else {   // the barrow: snow trodden grey by whoever comes, bone-grey in the hollows, rime at the edge
      out.lerp(dgEntTmp.copy(dgEntPal.tramp).lerp(dgEntPal.bone,smoothstep(0.35,0.85,n)*0.8),w).lerp(dgEntPal.rime,smoothstep(0.7,0.2,w)*w*0.5);
    }
  }
  return out;
}

/* ---- keeping the plants off the doors ----
   Trees, bushes and rocks stay DG_ENT_CLEAR from a door and 2.5 m from a signpost (a chunk is seeded by its own number, so this changes only the chunk it is in). */
function dgEntClear(x,z){
  for(let i=0;i<dgEntList.length;i++){ const E=dgEntList[i], dx=x-E.x, dz=z-E.z;
    if(dx<DG_ENT_CLEAR&&dx>-DG_ENT_CLEAR&&dz<DG_ENT_CLEAR&&dz>-DG_ENT_CLEAR&&dx*dx+dz*dz<DG_ENT_CLEAR*DG_ENT_CLEAR) return true;
    const sx=x-E.sign.x, sz=z-E.sign.z; if(sx*sx+sz*sz<6.25) return true; }
  return false;
}

/* ---- the talk key ---- */
function dgEntPrompt(E,el,btn){
  const sealed=dgEntSealed(E);
  el.textContent=(isTouch?'Tap '+(sealed?'Look':'Enter'):(kbName('talk')||'the talk key'))+': '+E.name+(sealed?' (sealed)':'');
  el.hidden=false; btn.textContent=sealed?'Look':'Enter';
}
function dgOpenDoor(id){
  const E=typeof id==='string'?DG_ENTRANCES[id]:id; if(!E) return;
  const T=dgEntTheme(E);
  if(!dgGateOpen(GEAR,T)){ const u=dgUnlocked(GEAR,PL.level,T); toast(E.name+' is sealed. '+(u.ok?DG_LANDS[T.land].hint:u.why),'bad'); UI_SFX.click(); return; }
  if(typeof dgBoardOpen==='function') dgBoardOpen(E.theme); else toast('The way is not ready yet','');   // (the Delve board is another file's: it defines dgBoardOpen)
  UI_SFX.click();
}

/* ---- the maps ---- */
// a door: a tall arch (gold when it opens for you, grey with a padlock while sealed)
function dgEntDoorIcon(x,cx,cy,r,sealed){
  x.beginPath(); x.moveTo(cx-r*0.7,cy+r); x.lineTo(cx-r*0.7,cy-r*0.15); x.arc(cx,cy-r*0.15,r*0.7,Math.PI,0); x.lineTo(cx+r*0.7,cy+r); x.closePath();
  x.fillStyle=sealed?'#8d8880':'#f4c542'; x.strokeStyle='#15120e'; x.lineWidth=Math.max(1.2,r*0.28); x.stroke(); x.fill();
  x.beginPath(); x.moveTo(cx-r*0.32,cy+r); x.lineTo(cx-r*0.32,cy+r*0.05); x.arc(cx,cy+r*0.05,r*0.32,Math.PI,0); x.lineTo(cx+r*0.32,cy+r); x.closePath(); x.fillStyle=sealed?'#3a3732':'#3a2410'; x.fill();
  if(sealed){   // the padlock: a body with a shackle, at the lower right
    const px=cx+r*0.75, py=cy+r*0.55, s=r*0.42;
    x.beginPath(); x.arc(px,py-s*0.55,s*0.55,Math.PI,0); x.strokeStyle='#15120e'; x.lineWidth=Math.max(1.4,r*0.3); x.stroke();
    x.fillStyle='#e8d890'; x.fillRect(px-s*0.75,py-s*0.45,s*1.5,s*1.2); x.lineWidth=1; x.strokeRect(px-s*0.75,py-s*0.45,s*1.5,s*1.2);
  }
}
// the full map's markers for the land being drawn (ctx, world -> canvas, land key, font size, label(), pixel ratio); returns how many doors it drew
function dgEntMapMarks(x,at,land,fs,label,dpr){
  let n=0;
  for(const E of dgEntList){ if(landAt(E.x,E.z)!==land) continue;
    const [cx,cy]=at(E.x,E.z), sealed=dgEntSealed(E); dgEntDoorIcon(x,cx,cy,6.5*dpr,sealed);
    label(E.name+(sealed?' (sealed)':''),cx,cy-fs*1.35,fs*0.9,sealed?'#b4aea4':'#ffe4a0',true); n++; }
  return n;
}
function dgEntMiniMarks(x,at,inside,dpr){
  let n=0;
  for(const E of dgEntList){ if(!inside(E.x,E.z)) continue; const [cx,cy]=at(E.x,E.z); dgEntDoorIcon(x,cx,cy,5*dpr,dgEntSealed(E)); n++; }
  return n;
}
// what the map says when the pointer is over a door (within 16 m of it), or null
function dgEntName(wx,wz){
  const E=dgEntranceNear(wx,wz,16); if(!E) return null;
  return E.name+': the way into '+dgEntTheme(E).name+(dgEntSealed(E)?' (sealed)':'');
}

/* ---- the sounds ----
   The water loop (soundTick's waterNear) is raised round the Falls Door so the cascade roars through the loop that already exists; the Elder drips and the Barrow hums as
   random events, like the village's crackle. */
function dgEntWater(x,z){ const E=DG_ENTRANCES.jadesprings; return 0.85*smoothstep(85,5,Math.hypot(x-E.x,z-E.z)); }
function dgEntDrip(pan,g){ tone({freq:AR(1100,1700),freq2:AR(520,760),dur:0.07,vol:0.05*g,pan,verb:true}); }
function dgEntHum(pan,g,sealed){ tone({freq:AR(62,68),freq2:AR(64,72),dur:3.2,attack:1.2,vol:(sealed?0.02:0.04)*g,pan,verb:true}); }
function dgEntSounds(r,spatial){
  if(!SND.ready) return;
  const R=DG_ENTRANCES.hollowroots, B=DG_ENTRANCES.bonefrostbarrow;
  if(Math.hypot(P.x-R.x,P.z-R.z)<50&&r(0.8)){ const s=spatial(R.x,R.z,3,45); if(s) dgEntDrip(s.pan,s.gain*1.6); }
  if(Math.hypot(P.x-B.x,P.z-B.z)<70&&r(0.035)){ const s=spatial(B.x,B.z,6,65); if(s) dgEntHum(s.pan,s.gain*1.8,dgEntSealed(B)); }
}
