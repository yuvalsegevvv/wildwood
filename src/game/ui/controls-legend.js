//@ Fills the controls list on the start card
/* ---------- controls legend ---------- */
const keysEl = $('#keys');
const legend = isTouch
  ? [['Left thumb','Move (push to the edge to run)'],['Right thumb','Look around'],['Jump','Hop over logs and rocks'],['Talk','Appears next to villagers'],['Sword / bow / staff','Attack and class skill'],['Sun / eye','Time of day, camera view'],['Minimap','Tap it for the world map']]
  : [['W A S D','Walk'],['Shift','Run'],['Space','Jump'],['Mouse','Look (click to lock, Esc to release)'],['Click / F','Attack (auto-targets)'],['Right-click / Q','Class skill'],['Tab','Switch target'],['E','Talk to villagers, shops and quests'],['I','Inventory (drag items onto your body)'],['K','Skills'],['Enter','Chat with other players (/name to rename)'],['R','Burst skill (level 10, coming soon)'],['N','World map'],['M','Mute sound'],['T / V','Skip ahead in the day, camera view']];
legend.forEach(([k,v]) => { const dt=document.createElement('dt'); dt.textContent=k; const dd=document.createElement('dd'); dd.textContent=v; keysEl.append(dt,dd); });

