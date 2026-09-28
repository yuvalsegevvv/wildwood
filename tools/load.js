// Loaders for the headless tools. No build needed for the server; the client loads dist/wildwood.html.
const fs=require('fs'), path=require('path');
const ROOT=path.join(__dirname,'..'), SRC=path.join(ROOT,'src');
const manifest=()=>JSON.parse(fs.readFileSync(path.join(SRC,'manifest.json'),'utf8'));
const strip=t=>t.startsWith('//@')?t.slice(t.indexOf('\n')+1):t;
const read=(dir,f)=>strip(fs.readFileSync(path.join(SRC,dir,f),'utf8'));
/* The world server straight from src/ (shared + server files), exactly as the build wraps it.
   expose: extra top-level names to return alongside the API (e.g. ['MONS','genQuest']). */
function loadServer(io,expose){
  const m=manifest(); let code=m.shared.map(f=>read('shared',f)).join('')+m.server.map(f=>read('server',f)).join('');
  if(expose&&expose.length) code=code.replace(/return \{join:/,'globalThis.__EXPOSE={'+expose.join(',')+'};return {join:');
  const api=new Function('io',"'use strict';\n"+code)(Object.assign({send(){},broadcast(){}},io||{}));
  return {api,x:globalThis.__EXPOSE||{}};
}
// Just the shared rules (pure): items, quests, balance, skills...
function loadShared(names){ const m=manifest(); return new Function(m.shared.map(f=>read('shared',f)).join('')+';return {'+names.join(',')+'};')(); }
module.exports={ROOT,SRC,manifest,strip,read,loadServer,loadShared};
