//@ Fills the controls list on the start card (from the current keybinds; redrawn when a key changes)
/* ---------- controls legend ---------- */
const keysEl = $('#keys');
function renderKeyLegend(){
  const k=kbName, dir=['fwd','left','back','right'].map(k).join(' ');
  const legend = isTouch
    ? [['Left thumb','Move (push to the edge to run)'],['Right thumb','Look around'],['Jump','Hop over logs and rocks'],['Talk','Appears next to villagers'],['Sword / bow / staff','Attack and class skill'],['Sun / eye','Time of day, camera view'],['Minimap','Tap it for the map; its World button opens the world map']]
    : [[dir,'Walk'],[k('run'),'Run'],[k('jump'),'Jump'],['Mouse','Look (click to lock, Esc to release)'],['Hold Alt','Free the mouse to click menus; let go to look again'],['Click / '+k('basic'),'Attack (auto-targets)'],['Right-click / '+k('skill'),'Class skill'],[k('target'),'Switch target'],[k('talk'),'Talk to villagers, shops and quests'],[k('inv'),'Inventory (drag items onto your body)'],[k('skills'),'Skills'],[k('chat'),'Chat with other players (/name to rename)'],[k('burst'),'Burst skill (level 10)'],[k('map'),'Map of the land you are in'],[k('world'),'World map of Eldmere'],[k('mute'),'Mute sound'],[k('time')+' / '+k('view'),'Skip ahead in the day, camera view'],['Settings','Controls: change any key']];
  keysEl.textContent='';
  legend.forEach(([key,v]) => { const dt=document.createElement('dt'); dt.textContent=key||'–'; const dd=document.createElement('dd'); dd.textContent=v; keysEl.append(dt,dd); });
}
renderKeyLegend();
