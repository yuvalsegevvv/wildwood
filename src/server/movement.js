//@ Movement slot (server): wear or take off a movement skill (the choice is saved in the loadout; the movement itself is the client's)
/* Message movequip {id|null}. Hooks: sanitizeSkills (players.js) keeps skills.mov; prSaveP / prWearP (presets.js) carry it. Test: tools/movement-smoke.js */
function mvEquipP(p,id){
  const S=p.gear.skills;
  if(id===null||id===undefined){ if(S.mov){ S.mov=null; p.dirty=true; } return; }
  const d=mvDef(id); if(!d) return;
  if(p.level<MV_SLOT_LV){ toastTo(p.id,'The movement slot opens at level '+MV_SLOT_LV,'bad'); return; }
  if(S.mov!==d.id){ S.mov=d.id; p.dirty=true; }
}
MSG.movequip=(p,msg)=>mvEquipP(p,msg.id);
