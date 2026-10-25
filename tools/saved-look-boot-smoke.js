// The page must boot with any saved look: the hiker is built while the page loads (rebuildHiker in model.js), before most files have run, so a helper defined later
// (vbox once was, in village/buildings.js) crashed the start for anyone whose browser had a signature outfit saved: "Cannot access 'vbox' before initialization".
// Boots the built page once per signature outfit and sex with that look in localStorage. Needs dist/ (python3 build.py).
const {bootClient}=require('./headless');
const OUTFITS=['dunstan','tansy','torgeir','sazanka','corvin','sorrel','ambrose','marigold','nephra','sabir','ogden','ottoline','pell','genzo','brynja','tamsin','zahra','hollis','brindle','dessa','sefi'];
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
for(const model of OUTFITS) for(const sex of ['male','female']){
  let err=null, fatal=null;
  const log=console.log; console.log=(...a)=>{ if(String(a[0])==='FATAL') fatal=a.slice(1).join(' '); else log(...a); };
  try{ const c=bootClient({ls:new Map([['wildwood-look-v1',JSON.stringify({sex,model,hair:'short'})]])}); if(c.stop) c.stop(); }catch(e){ err=e; }
  console.log=log;
  ok('boots with a saved '+model+' ('+sex+')',!err&&!fatal,err?String(err.message):fatal);
}
console.log(fails?fails+' check(s) failed':'all passed'); process.exit(fails?1:0);
