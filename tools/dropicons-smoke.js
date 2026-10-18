// Headless test of the monster-drop icons (version 3.1): every drop of MATS gets its own picture, the kind follows the name, no two drops of the same kind are identical, the bag lists names.
// Usage: node tools/dropicons-smoke.js
const fs=require('fs'), path=require('path'), {SRC,strip}=require('./load');
global.THREE=global.THREE||require('three');
const read=f=>strip(fs.readFileSync(path.join(SRC,f),'utf8'));
const code=['shared/math.js','shared/noise.js'].map(read).join('')+read('shared/monster-defs.js')+'' ;
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const {loadServer}=require('./load');
const {x}=loadServer({dev:true,send(){}},['MATS','MAT_IDS']);
const icons=read('game/ui/item-icons.js'), drops=read('game/ui/drop-icons.js');
const pre=icons.slice(icons.indexOf('const OUT='),icons.indexOf('\n',icons.indexOf('function icoShade')+1))+drops;
const S=new Function(pre+';return {dropIconArt,diKindOf,DI_KIND,DI_ART};')();
const ids=x.MAT_IDS;
ok('there are drops to draw',ids.length>100,ids.length+' drops');
const arts=ids.map(id=>S.dropIconArt(id,x.MATS[id].col,x.MATS[id].name));
ok('every drop has an svg picture',arts.every(a=>typeof a==='string'&&a.includes('<path')||a.includes('<circle')));
const kinds={}; for(const id of ids){ const k=S.diKindOf(x.MATS[id].name); (kinds[k]=kinds[k]||[]).push(id); }
ok('every kind has a drawing',Object.keys(kinds).every(k=>S.DI_ART[k]),Object.keys(kinds).join(','));
ok('the kinds are varied (at least 10 different kinds in use)',Object.keys(kinds).length>=10,Object.keys(kinds).length+' kinds');
ok('no kind swallows the rest (the biggest is under 30% of the drops)',Math.max(...Object.values(kinds).map(a=>a.length))<ids.length*0.3,JSON.stringify(Object.fromEntries(Object.entries(kinds).map(([k,a])=>[k,a.length]))));
ok('two drops are never the same picture (colour or variation differ)',new Set(arts).size===ids.length,(ids.length-new Set(arts).size)+' repeated');
ok('a tusk is a tusk and a jelly a blob',S.diKindOf('Boar Tusk')==='tusk'&&S.diKindOf('Slime Goo')==='blob'&&S.diKindOf('Blossom Jelly')==='blob'&&S.diKindOf('Spore Cap')==='cap'&&S.diKindOf('Nothing Known')==='gem');
const inv=fs.readFileSync(path.join(SRC,'game/economy/inventory.js'),'utf8');
ok('the bag shows the name under every drop and every resource',inv.includes('<span class="nm">${MATS[id].name}')&&inv.includes('<span class="nm">${RES[id].name}'));
process.exit(fails?1:0);
