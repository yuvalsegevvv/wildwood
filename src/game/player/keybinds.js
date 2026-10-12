//@ Rebindable keys (KB): every keyboard action and its keys, saved in this browser; key labels for the HUD hints and the legend; the Controls list in Settings
/* ---------- keybinds ---------- */
/* Each action has a main key and a spare one; the defaults are the keys the game always used. Keys are the physical
   codes (KeyW, Digit1...), so a rebind works on any layout, and labels show the letter printed on this keyboard when
   the browser can tell (AZERTY). Escape (closes panels, frees the mouse), Alt (hold it to free the mouse: input.js)
   and the system keys cannot be bound. A key belongs to one action: binding a used key swaps the two. The keys are
   saved in this browser (localStorage 'wildwood-keys'), not in the account. Handlers ask kbIs(e.code,'inv') or kbHeld('fwd'). */
const KB_ACTIONS=[
  {id:'fwd',   name:'Walk forward',  def:['KeyW','ArrowUp']},
  {id:'back',  name:'Walk backward', def:['KeyS','ArrowDown']},
  {id:'left',  name:'Walk left',     def:['KeyA','ArrowLeft']},
  {id:'right', name:'Walk right',    def:['KeyD','ArrowRight']},
  {id:'run',   name:'Run',           def:['ShiftLeft','ShiftRight']},
  {id:'jump',  name:'Jump',          def:['Space','']},
  {id:'basic', name:'Basic attack',  def:['KeyF','Digit1']},
  {id:'skill', name:'Skill',         def:['KeyQ','Digit2']},
  {id:'burst', name:'Burst skill',   def:['KeyR','Digit3']},
  {id:'pot1',  name:'Healing potion', def:['KeyZ','']},
  {id:'pot2',  name:'Potion of might', def:['KeyX','']},
  {id:'pot3',  name:'Potion of guard', def:['KeyC','']},
  {id:'target',name:'Switch target', def:['Tab','']},
  {id:'talk',  name:'Talk / travel', def:['KeyE','']},
  {id:'gather',name:'Gather (mine, chop, pick herbs)', def:['KeyH','']},   // H: G is the world map's (a default key must not collide)
  {id:'inv',   name:'Inventory',     def:['KeyI','']},
  {id:'skills',name:'Skills',        def:['KeyK','']},
  {id:'map',   name:'Map',           def:['KeyN','']},
  {id:'world', name:'World map',     def:['KeyG','']},   // world map: the Eldmere panel (ui/world-map.js)
  {id:'chat',  name:'Chat',          def:['Enter','NumpadEnter']},
  {id:'mute',  name:'Mute sound',    def:['KeyM','']},
  {id:'time',  name:'Skip the day',  def:['KeyT','']},
  {id:'view',  name:'Camera view',   def:['KeyV','']},
  {id:'party', name:'Party',         def:['KeyP','']},   // dungeons: the party panel (dungeon/party.js)
  {id:'accept',name:'Accept an invite', def:['KeyY','']},   // dungeons: a party invite or a run's join prompt (dungeon/party.js)
  {id:'decline',name:'Decline an invite', def:['Backspace','']}   // dungeons: the same, declined
];
const KB_FIXED=['Escape','AltLeft','AltRight','MetaLeft','MetaRight','ContextMenu'];
const KB_NICE={Space:'Space',Enter:'Enter',NumpadEnter:'Num Enter',Tab:'Tab',Backspace:'Backspace',CapsLock:'Caps',ShiftLeft:'L Shift',ShiftRight:'R Shift',
  ControlLeft:'L Ctrl',ControlRight:'R Ctrl',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',Backquote:'`',Minus:'-',Equal:'=',BracketLeft:'[',
  BracketRight:']',Backslash:'\\',Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/',IntlBackslash:'<'};
const KB={map:{},btns:[],cap:null};   // map: action -> [main, spare] ('' = none); btns: the buttons in Settings; cap: {act,slot} while waiting for a key
let KB_LAYOUT=null;                   // the browser's layout map (Chrome): code -> the character printed on this keyboard
function kbDefaults(){ for(const a of KB_ACTIONS) KB.map[a.id]=a.def.slice(); }
function kbLoad(){
  let s=null; try{ s=JSON.parse(localStorage.getItem('wildwood-keys')); }catch(_){}
  const used=new Set(), ok=c=>typeof c==='string'&&/^[A-Za-z0-9]{1,24}$/.test(c)&&!KB_FIXED.includes(c);
  const take=(id,list)=>{ KB.map[id]=[0,1].map(i=>{ const c=list[i]; if(!ok(c)||used.has(c)) return ''; used.add(c); return c; }); };
  KB.map={};
  for(const a of KB_ACTIONS){ const v=s&&s[a.id]; if(Array.isArray(v)&&v.length===2&&v.every(c=>typeof c==='string')) take(a.id,v); }   // saved keys first, so a newer default never steals one
  for(const a of KB_ACTIONS) if(!KB.map[a.id]) take(a.id,a.def);
}
function kbSave(){ try{ localStorage.setItem('wildwood-keys',JSON.stringify(KB.map)); }catch(_){} }
const kbIs=(code,act)=>!!code&&KB.map[act].includes(code);
function kbHeld(act){ const m=KB.map[act]; return !!(m[0]&&keys[m[0]])||!!(m[1]&&keys[m[1]]); }
function kbLabel(code){
  if(!code) return '';
  const l=KB_LAYOUT&&KB_LAYOUT.get(code); if(l&&l.length===1) return l.toUpperCase();
  if(KB_NICE[code]) return KB_NICE[code];
  let m=/^Key([A-Z])$/.exec(code)||/^Digit(\d)$/.exec(code); if(m) return m[1];
  m=/^Numpad(\w+)$/.exec(code); if(m) return 'Num '+m[1];
  return code.replace(/([a-z\d])([A-Z])/g,'$1 $2');
}
const kbName=act=>{ const m=KB.map[act]; return kbLabel(m[0]||m[1]); };   // the key to show for an action ('' when it has none)
// bind a slot (code '' clears it); returns a note when another action was affected
function kbSet(act,slot,code){
  const m=KB.map[act], old=m[slot]; let note='';
  m[slot]=code;
  if(code) for(const a of KB_ACTIONS){ const o=KB.map[a.id];
    for(let i=0;i<2;i++){
      if(o[i]!==code||(a.id===act&&i===slot)) continue;
      o[i]=old;   // the action that had the key takes the one this slot had
      if(a.id!==act) note=old?a.name+' now uses '+kbLabel(old):(o[0]||o[1])?a.name+' lost '+kbLabel(code):a.name+' has no key now';
    } }
  if(!note&&!m[0]&&!m[1]) note=KB_ACTIONS.find(a=>a.id===act).name+' has no key now';
  return note;
}
// after a change: save, and redraw everything that shows a key
function kbRefresh(){ kbRender(); kbHints(); renderKeyLegend(); setActionBar(); }
function kbChanged(note){ kbSave(); kbRefresh(); if(note) toast(note,'good'); }
// the titles and labels in the page: elements with data-kb="<action>" and a template such as "Map ({k})"
function kbHints(){
  document.querySelectorAll('[data-kb]').forEach(el=>{
    const k=kbName(el.dataset.kb), fill=t=>k?t.replace('{k}',k):t.replace(/\s*\([^)]*\)/,'');   // no key: drop the "(K)"
    if(el.dataset.kbt){ el.title=fill(el.dataset.kbt); el.setAttribute('aria-label',fill(el.dataset.kba||el.dataset.kbt)); }
    if(el.dataset.kbx) el.textContent=fill(el.dataset.kbx);
  });
}
// the Controls list in Settings: a button for each slot (click it, then press the key)
function kbBuild(){
  const list=$('#kbList'); if(!list) return;
  for(const a of KB_ACTIONS){
    const row=document.createElement('div'); row.className='kb-row';
    const nm=document.createElement('span'); nm.textContent=a.name; row.append(nm);
    [0,1].forEach(i=>{
      const b=document.createElement('button'); b.className='kb-key'; b.type='button'; b.dataset.act=a.id; b.dataset.slot=String(i);
      b.addEventListener('click',()=>{ KB.cap={act:a.id,slot:i}; kbRender(); });
      row.append(b); KB.btns.push(b);
    });
    list.append(row);
  }
}
function kbRender(){
  for(const b of KB.btns){
    const act=b.dataset.act, i=+b.dataset.slot, c=KB.map[act][i], on=!!KB.cap&&KB.cap.act===act&&KB.cap.slot===i;
    b.textContent=on?'Press a key…':c?kbLabel(c):'–';
    b.classList.toggle('listening',on); b.classList.toggle('empty',!c&&!on);
    b.setAttribute('aria-label',(i?'Spare key':'Main key')+' for '+KB_ACTIONS.find(a=>a.id===act).name+': '+(on?'press a key':c?kbLabel(c):'none'));
  }
}
function kbCancel(){ if(KB.cap){ KB.cap=null; kbRender(); } }
// while a slot waits for a key nothing else sees the keyboard: Esc cancels, Backspace / Delete clears
addEventListener('keydown',e=>{
  const c=KB.cap; if(!c) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if(e.repeat||!e.code||e.code==='Unidentified') return;
  if(e.code==='Escape'){ kbCancel(); return; }
  if(KB_FIXED.includes(e.code)){ toast('That key is reserved (Esc, Alt and system keys). Pick another','bad'); return; }
  KB.cap=null;
  kbChanged(kbSet(c.act,c.slot,e.code==='Backspace'||e.code==='Delete'?'':e.code));
},true);
addEventListener('pointerdown',e=>{ if(KB.cap&&!(e.target&&e.target.classList&&e.target.classList.contains('kb-key'))) kbCancel(); },true);
$('#kbReset').addEventListener('click',()=>{ KB.cap=null; kbDefaults(); kbChanged('Keys reset to the defaults'); });
$('#kbSec').hidden=isTouch;   // touch screens have no keyboard
kbLoad(); kbBuild(); kbRender(); kbHints();
try{ navigator.keyboard.getLayoutMap().then(m=>{ KB_LAYOUT=m; kbRefresh(); }).catch(()=>{}); }catch(_){}   // Chrome only, and not in every frame
