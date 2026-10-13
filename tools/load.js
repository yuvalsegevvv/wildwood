// Loaders for the headless tools. No build needed for the server; the client loads dist/wildwood.html.
const fs=require('fs'), path=require('path');
const ROOT=path.join(__dirname,'..'), SRC=path.join(ROOT,'src');
const manifest=()=>JSON.parse(fs.readFileSync(path.join(SRC,'manifest.json'),'utf8'));
const strip=t=>t.startsWith('//@')?t.slice(t.indexOf('\n')+1):t;
const read=(dir,f)=>strip(fs.readFileSync(path.join(SRC,dir,f),'utf8'));
/* The world server straight from src/ (shared + server files), exactly as the build wraps it.
   expose: extra top-level names to return alongside the API (e.g. ['MONS','genQuest']).
   opts.noSets: leave out the shipped skill sets (shared/skillsets/*.js), for a test that defines its own fixture sets and needs an empty registry. */
function loadServer(io,expose,opts){
  const m=manifest(), keep=f=>!(opts&&opts.noSets&&f.startsWith('skillsets/')); let code=m.shared.filter(keep).map(f=>read('shared',f)).join('')+m.server.map(f=>read('server',f)).join('');
  if(expose&&expose.length) code=code.replace(/return \{join:/,'globalThis.__EXPOSE={'+expose.join(',')+'};return {join:');
  const api=new Function('io',"'use strict';\n"+code)(Object.assign({send(){},broadcast(){}},io||{}));
  return {api,x:globalThis.__EXPOSE||{}};
}
// Just the shared rules (pure): items, quests, balance, skills...
function loadShared(names){ const m=manifest(); return new Function(m.shared.map(f=>read('shared',f)).join('')+';return {'+names.join(',')+'};')(); }
// Where a message to a client holds a NaN or an Infinity (JSON turns both into null, which the client then reads as a number), as 'snap.pl[0][2]=-Infinity'; null when it holds none. For the fuzzers' io.send.
function findNonFinite(m,path,d){ path=path||String(m&&m.t||'msg'); d=d||0;
  if(typeof m==='number') return isFinite(m)?null:path+'='+m;
  if(m&&typeof m==='object'&&d<8){ for(const k in m){ const r=findNonFinite(m[k],path+(Array.isArray(m)?'['+k+']':'.'+k),d+1); if(r) return r; } }
  return null; }
module.exports={ROOT,SRC,manifest,strip,read,loadServer,loadShared,findNonFinite};
