// Headless client test: runs dist/wildwood.html in Node with stub DOM/WebGL and plays solo through the real
// client code. Build first (python3 build.py). Needs the three package (npm install). Prints PASS/FAIL lines.
// Usage: node tools/client-smoke.js
const fs=require('fs'), path=require('path'), {ROOT}=require('./load');
global.THREE=require('three');
const els={};
function el(){ return {remove(){},children:[],style:{setProperty(){}},classList:{add(){},remove(){},toggle(){},contains(){return false}},textContent:'',innerHTML:'',setAttribute(){},getAttribute(){return null},dataset:{},offsetWidth:380,offsetHeight:300,
  querySelectorAll:()=>[],querySelector:()=>el(),firstChild:{style:{}},append(){},appendChild(){},addEventListener(){},focus(){},blur(){},select(){},scrollTop:0,scrollHeight:0,width:0,height:0,disabled:true,hidden:true,value:'',closest(){return null},
  getBoundingClientRect(){return {left:0,top:0,width:600,height:600};},
  getContext(){ return new Proxy({},{get:(o,k)=>k in o?o[k]:(k==='createImageData'?(w,h)=>({data:new Uint8ClampedArray(w*h*4)}):(k==='createRadialGradient'||k==='createLinearGradient')?()=>({addColorStop(){}}):()=>{}),set:(o,k,v)=>{o[k]=v;return true;}}); }}; }
Object.defineProperty(global,'navigator',{value:{maxTouchPoints:0},configurable:true,writable:true});
Object.assign(global,{window:global,innerWidth:800,innerHeight:600,devicePixelRatio:1,localStorage:{getItem(){return null},setItem(){}},addEventListener(){},
  document:{addEventListener(){},hidden:false,querySelectorAll:()=>[],getElementById:s=>els['#'+s]||(els['#'+s]=el()),querySelector:s=>els[s]||(els[s]=el()),createElement:()=>el(),createTextNode:t=>({textContent:t}),body:el(),pointerLockElement:null}});
let frames=0; global.requestAnimationFrame=f=>{ if(++frames<1500) setImmediate(f); };
const page=fs.readFileSync(path.join(ROOT,'dist','wildwood.html'),'utf8');
const blocks=page.split('<script>').slice(1).map(b=>b.split('</script>')[0]);
const srv=blocks.find(b=>b.includes('function createWorldServer')); let main=blocks.find(b=>b.includes('function wildwoodMain'));
main=main.replace(/new THREE\.WebGLRenderer\([^)]*\)/,'({setPixelRatio(){},setSize(){},shadowMap:{},setClearColor(){},render(){}})')
  .replace('function frame(){','global.__G=()=>({NET,startSolo,beginPlay,MONS,P,PL,CB,GEAR,MAP,CHAT,WX,doAttack,equip,updateMonsters,updateCombat,updateWeather,openSkills,renderInv,sendChat,openChat,chatText,getH,canStart:()=>canStart});\nfunction frame(){');
global.showFatal=m=>console.log('FATAL',m);
new Function(srv+'\n'+main+'\nwildwoodMain();')();
const wait=ms=>new Promise(r=>setTimeout(r,ms)); let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
(async()=>{
  let G; for(let i=0;i<300;i++){ await wait(100); G=__G(); if(G.canStart()) break; }
  ok('world streams in',G.canStart());
  G.NET.onReady=()=>G.beginPlay(); G.startSolo(); await wait(1500); G=__G();
  ok('solo server: welcome and monster views',G.NET.ready&&G.MONS.length>400,G.MONS.length+' views');
  const s=G.MONS.find(m=>m.def.id==='slime'); G.P.x=s.x+1.5; G.P.z=s.z; G.P.y=G.getH(G.P.x,G.P.z);
  for(let i=0;i<120&&!s.dead;i++){ G.CB.target=s; G.P.yaw=Math.atan2(-(s.x-G.P.x),-(s.z-G.P.z)); G.doAttack('basic'); G.updateMonsters(0.033); G.updateCombat(0.033); await wait(33); }
  G=__G(); ok('attack through the server kills a slime',s.dead,'xp '+G.PL.exp.toFixed(1));
  G.equip('bow1'); await wait(300); ok('equip round-trip',__G().GEAR.eq.weapon==='bow1');
  document.querySelector('#inv').hidden=false; G.renderInv(); ok('inventory renders body slots',(document.querySelector('#invBody').innerHTML.match(/class="eqslot"/g)||[]).length===5);
  G.openSkills(); ok('skills panel renders 3 slots',(document.querySelector('#skBody').innerHTML.match(/class="sk-slot/g)||[]).length===3);
  G.openChat(); G.chatText.value='hi'; G.sendChat(); await wait(300); ok('chat line arrives',__G().CHAT.lines.length>0);
  for(let i=0;i<150&&!__G().MAP.done;i++) await wait(100); ok('world map painted',__G().MAP.done);
  G.NET.send({t:'dev',cmd:'weather',v:'rain'}); await wait(300); for(let i=0;i<60;i++){ G.WX.t+=0.5; G.updateWeather(0.5); } ok('rain fades in',G.WX.inten>0.9);
  console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
})();
