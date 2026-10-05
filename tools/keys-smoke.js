// Headless test of the rebindable keys (src/game/player/keybinds.js) and of hold-Alt (src/game/player/input.js), on the built page
// with the stub DOM of tools/headless.js (its fireWin() calls the game's window key listeners). Build first (python3 build.py).
// Usage: node tools/keys-smoke.js
const {bootClient}=require('./headless');
const EXPOSE=['KB','KB_ACTIONS','kbIs','kbHeld','kbSet','kbLabel','kbName','kbHints','kbChanged','keys','P','updatePlayer','setStarted:v=>{started=v}','started:()=>started',
  'altHeld:()=>altHeld','dragging:()=>dragging','mDown:()=>mDown','thirdPerson:()=>thirdPerson','keysEl'];
const c=bootClient({expose:EXPOSE});
let fails=0; const ok=(n,x,i)=>{ console.log((x?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!x) fails++; };
const key=(code,o)=>c.fireWin('keydown',Object.assign({code},o)), up=code=>c.fireWin('keyup',{code});
const unique=G=>{ const all=Object.values(G.KB.map).flat().filter(Boolean); return new Set(all).size===all.length; };
(async()=>{
  let G=c.G();
  // defaults are the keys the game always used
  ok('defaults: W and the arrow walk, F and 1 attack, Enter and the numpad Enter chat',G.kbIs('KeyW','fwd')&&G.kbIs('ArrowUp','fwd')&&G.kbIs('KeyF','basic')&&G.kbIs('Digit1','basic')&&G.kbIs('Enter','chat')&&G.kbIs('NumpadEnter','chat'));
  ok('defaults: no key is used twice',unique(G));
  ok('labels: letters, arrows, shift, numpad',G.kbName('inv')==='I'&&G.kbLabel('ArrowUp')==='↑'&&G.kbLabel('ShiftLeft')==='L Shift'&&G.kbLabel('Numpad5')==='Num 5'&&G.kbLabel('Digit3')==='3');
  // rebinding, swapping, clearing
  ok('rebind: Inventory to B',G.kbSet('inv',0,'KeyB')===''&&G.kbIs('KeyB','inv')&&!G.kbIs('KeyI','inv'));
  const note=G.kbSet('map',0,'KeyB');
  ok('binding a used key swaps: Map takes B, Inventory takes N',G.kbIs('KeyB','map')&&G.kbIs('KeyN','inv')&&/Inventory now uses N/.test(note),note);
  ok('still no key used twice',unique(G));
  ok('clearing the last key says so',/Mute sound has no key now/.test(G.kbSet('mute',0,''))&&G.kbName('mute')==='');
  G.kbSet('mute',0,'KeyM');
  // movement reads the binds (movement.js)
  G.kbSet('fwd',0,'KeyJ'); G.keys.KeyW=true; ok('the old key no longer walks',!G.kbHeld('fwd')); G.keys.KeyW=false;
  G.keys.KeyJ=true; ok('the new key walks',G.kbHeld('fwd'));
  { const z0=G.P.z; G.P.yaw=0; for(let i=0;i<6;i++) G.updatePlayer(0.05); ok('updatePlayer moves forward on the new key',G.P.z<z0-0.05,(G.P.z-z0).toFixed(2)); G.keys.KeyJ=false; }
  // the HUD hints follow the keys, and drop the "(K)" for an action with no key
  { const el={dataset:{kb:'map',kbt:'Map ({k})',kba:'Minimap. Open the map ({k})'},_a:{},title:'',setAttribute(k,v){ this._a[k]=v; }};
    const qs=document.querySelectorAll; document.querySelectorAll=s=>s==='[data-kb]'?[el]:[]; G.kbHints();
    ok('hint shows the new key',el.title==='Map (B)'&&el._a['aria-label']==='Minimap. Open the map (B)',el.title);
    G.kbSet('map',0,''); G.kbSet('map',1,''); G.kbHints(); ok('hint drops the key when there is none',el.title==='Map'&&el._a['aria-label']==='Minimap. Open the map',el.title);
    G.kbSet('map',0,'KeyB'); document.querySelectorAll=qs; }
  // the start card's legend is redrawn from the keys
  G.kbChanged(); { const t=G.keysEl._kids.slice(-36).map(x=>x.textContent);
    ok('the legend lists the current keys and Hold Alt',t.length===36&&t.includes('Hold Alt')&&t[t.indexOf('Map of the land you are in')-1]==='B'&&t[t.indexOf('World map of Eldmere')-1]==='G'&&t[t.indexOf('Inventory (drag items onto your body)')-1]==='N',t.join('|')); }
  // a key event reaches the right handler
  G.setStarted(true); G=c.G();
  { const v0=G.thirdPerson(); key('KeyV'); ok('V toggles the camera view',c.G().thirdPerson()!==v0); G.kbSet('view',0,'KeyX'); key('KeyV'); ok('after rebinding, V does nothing',c.G().thirdPerson()!==v0);
    key('KeyX'); ok('and X toggles it',c.G().thirdPerson()===v0); }
  // the capture flow in Settings: click a box, press a key
  { const btn=G.KB.btns[0]; btn.fire('click'); ok('clicking a key box waits for a key',!!c.G().KB.cap&&/Press a key/.test(btn.textContent));
    const v0=c.G().thirdPerson(), e=key('KeyH'); ok('the pressed key is bound and eaten (nothing else sees it)',c.G().KB.map.fwd[0]==='KeyH'&&!c.G().KB.cap&&e.prevented);
    btn.fire('click'); key('KeyX'); ok('pressing a key another action uses swaps it (X: Camera view <-> Walk forward)',c.G().kbIs('KeyX','fwd')&&c.G().kbIs('KeyH','view')&&c.G().thirdPerson()===v0);
    btn.fire('click'); key('Escape'); ok('Esc cancels and leaves the keys alone',!c.G().KB.cap&&c.G().kbIs('KeyX','fwd'));
    btn.fire('click'); key('AltLeft'); ok('Alt is reserved: still waiting, nothing bound',!!c.G().KB.cap&&!c.G().kbIs('AltLeft','fwd')); key('Escape');
    btn.fire('click'); key('Backspace'); ok('Backspace clears the slot',c.G().KB.map.fwd[0]===''); }
  // saved in this browser, restored after a reload, a damaged save cannot break the keys
  G=c.G(); G.kbChanged(); const saved=c.ls.get('wildwood-keys'), snap=JSON.stringify(G.KB.map);
  ok('the keys are saved',!!saved&&JSON.stringify(JSON.parse(saved))===snap);
  c.stop();
  { const c2=bootClient({ls:c.ls,expose:['KB','kbIs']}); const H=c2.G(); ok('a new page load has the same keys',JSON.stringify(H.KB.map)===snap); c2.stop(); }
  { const ls=new Map([['wildwood-keys',JSON.stringify({fwd:['Escape','KeyB'],inv:['KeyB',''],map:[5],zzz:['KeyQ'],view:['AltLeft','KeyC']})]]);
    const c3=bootClient({ls,expose:['KB','kbIs']}); const H=c3.G(), all=Object.values(H.KB.map).flat().filter(Boolean);
    ok('a damaged save: reserved keys dropped, no duplicates, a broken row falls back to the default',new Set(all).size===all.length&&!all.includes('Escape')&&!all.includes('AltLeft')&&H.kbIs('KeyB','fwd')&&H.kbIs('KeyN','map')&&H.kbIs('KeyC','view'),JSON.stringify(H.KB.map));
    c3.stop(); }
  // hold Alt: the pointer comes back, and returns when Alt is let go
  { const c4=bootClient({expose:['KB','setStarted:v=>{started=v}','altHeld:()=>altHeld','dragging:()=>dragging','mDown:()=>mDown']});
    const cv=c4.el('#c'), D=global.document; let locks=0;
    D.exitPointerLock=()=>{ D.pointerLockElement=null; }; cv.requestPointerLock=()=>{ D.pointerLockElement=cv; locks++; };
    const k=(t,code,o)=>c4.fireWin(t,Object.assign({code},o)), G4=()=>c4.G();
    k('keydown','AltLeft'); ok('Alt does nothing before the game starts',!G4().altHeld());
    G4().setStarted(true); D.pointerLockElement=cv;
    const e=k('keydown','AltLeft'); ok('holding Alt frees the pointer (and stops the browser menu)',G4().altHeld()&&D.pointerLockElement===null&&e.prevented);
    k('keydown','AltLeft',{repeat:true}); ok('key repeat changes nothing',G4().altHeld());
    cv.fire('mousedown',{button:0}); ok('a click on the world while Alt is held does not lock, drag or attack',!G4().dragging()&&!G4().mDown()&&D.pointerLockElement===null);
    k('keyup','AltLeft'); ok('letting go locks the mouse look again',!G4().altHeld()&&D.pointerLockElement===cv&&locks===1);
    // with a panel opened meanwhile the pointer stays free
    k('keydown','AltLeft'); c4.el('#inv').hidden=false; k('keyup','AltLeft'); ok('a panel opened while Alt was held keeps the pointer free',D.pointerLockElement===null&&locks===1); c4.el('#inv').hidden=true;
    // alt-tab: the keyup goes to another window
    D.pointerLockElement=cv; k('keydown','AltLeft'); c4.fireWin('blur',{}); ok('losing the window ends the hold without a lock',!G4().altHeld()&&D.pointerLockElement===null);
    k('keyup','AltLeft'); ok('a stray Alt keyup afterwards does nothing',D.pointerLockElement===null&&locks===1);
    // not locked to begin with (a panel was open): Alt does not grab the mouse
    k('keydown','AltLeft'); k('keyup','AltLeft'); ok('Alt while the pointer was free does not lock it',D.pointerLockElement===null&&locks===1);
    c4.stop(); }
  console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
})();
