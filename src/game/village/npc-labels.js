//@ Name and profession labels above the special villagers, with ! / ? quest markers over quest givers
/* Every villager in VILLAGERS with a title gets a label: a role icon, their name and what they do.
   Maren (the quest board) also shows a gold ! when there are notices you can take and a green ? when you can hand one in.
   A villager in the main quest shows a violet ! (a step to take, or something to do with them) or ? (a step to hand in): mqMark. */
const ROLE_ICON={
  quests:'<path d="M7 3h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2z"/><path d="M9 8h6M9 12h6"/>',
  weaponsmith:'<path d="M5 19L17 7l2-4-4 2L3 17z"/><path d="M8 16l-3 3"/>',
  armorer:'<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/>',
  forge:'<path d="M4 9h13l3-2v3a4 4 0 0 1-4 4h-1v3h2v3H7v-3h2v-3H8a4 4 0 0 1-4-4z"/>',
  trainer:'<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M10 8l1.5 3L15 9.5"/>',
  story:'<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 2 1 3 3 3 5"/>',
  soul:'<circle cx="12" cy="12" r="9"/><path d="M12 3a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 0 0 9"/>',
  healer:'<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/>',
  peddler:'<path d="M3 7h13v9H3zM16 10h3l2 3v3h-5"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  kin:'<path d="M12 20s-8-5-8-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5-8 10-8 10z"/>',
  lodge:'<path d="M4 20L14 10"/><path d="M13 4c3-1 6 0 7 2-2 0-4 1-4 4l-3-2z"/><path d="M6 20h12"/>'
};
const npcTags=new Map();
function questMark(){ const Q=GEAR.q; if(!Q) return ''; return Q.ready&&Q.ready.length?'?':(Q.offers&&Q.offers.length&&Object.keys(Q.active).length<QUEST_MAX_ACTIVE)?'!':''; }
function npcTag(n){
  let el=npcTags.get(n); if(el) return el;
  const D=n.def, icon=ROLE_ICON[D.icon||D.role||'story'];
  el=document.createElement('div'); el.className='npctag role-'+(D.role||'none'); el.hidden=true;
  el.innerHTML=`<span class="nt-mark"></span><b>${D.name}</b><span class="nt-role"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>${D.title}</span>`;
  document.body.append(el); npcTags.set(n,el); return el;
}
const _nv=new THREE.Vector3();
function updateNpcLabels(){
  for(const n of NPCs){
    if(!n.def.title) continue;
    const el=npcTag(n), d=Math.hypot(n.x-P.x,n.z-P.z);
    if(!started||customizing||n.inside||n===talkNPC||d>34||!n.g.visible){ el.hidden=true; continue; }
    _nv.set(n.x,n.y+2.2*n.scale,n.z).project(camera);
    if(_nv.z>1||Math.abs(_nv.x)>1.1||Math.abs(_nv.y)>1.1){ el.hidden=true; continue; }
    el.hidden=false;
    el.style.transform=`translate(${(_nv.x*0.5+0.5)*innerWidth}px,${(-_nv.y*0.5+0.5)*innerHeight}px) translate(-50%,-100%) scale(${clamp(1.25-d/40,0.72,1.1)})`;
    el.style.opacity=clamp((34-d)/10,0,1);
    const qm=MQ_NPC_VIL[n.def.id]?mqMark(n.def.id):'', mk=qm||(n.def.role==='quests'?questMark(n.def.id):''), m=el.firstChild, cls='nt-mark'+(mk==='?'?' ready':'')+(qm?' mq':'');   // the main quest's mark wins
    if(m.textContent!==mk||m.className!==cls){ m.textContent=mk; m.className=cls; }
  }
}
