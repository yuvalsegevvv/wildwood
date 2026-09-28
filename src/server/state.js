//@ Server state (S), the per-tick event queue (ev), messaging helpers
/* The world server is authoritative for monsters, the boss, combat, levels, loot, shops, quests and the clock.
   It never touches the page or three.js, so the same code runs inside a browser tab (solo, or hosting a
   shared world) and in Node (dist/wildwood-server.js). io = {send(pid,msg), broadcast(msg), dev, snapDt}. */
const S={t:0,day:0.045,ff:null,players:new Map(),dev:io.dev!==false,snapT:0,snapDt:io.snapDt||0.1,fullT:0,prevDay:0.045,saveT:5};
const DAY_SECONDS=1200;
let EVQ=[];
function ev(...a){ EVQ.push(a); }
function sendTo(pid,msg){ io.send(pid,msg); }
function toastTo(pid,text,kind){ ev('toast',pid,text,kind||''); }
const r1=v=>Math.round(v*10)/10;
function clampInt(v,a,b,d){ v=parseInt(v,10); return isFinite(v)?Math.max(a,Math.min(b,v)):d; }
function norm3(v){ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; }
