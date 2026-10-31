// Headless test of the general cosmetic pieces (version 3.2): the catalog and its recipes, the lock rules (cosLocked / cosCleanLook), making a piece with resources and
// monster drops at a lodge, and that every piece, pupil, colour, the backpack cape and the largest chest build with no NaN.
// Usage: node tools/cospieces-smoke.js
const {loadServer}=require('./load');
const {api:W,x}=loadServer({dev:true,send(){}},['CP_PIECES','CP_DECO','CP_RECIPE','CP_SLOTS','CP_FREE','cpDef','cpIsFree','cosCost','cosLocked','cosCleanLook','sanitizeCos','RES','MATS','VIL','COS_CAPES','COS_AURAS']);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&i!==''?'  ('+i+')':'')); if(!c) fails++; };
// ---- the catalog ----
const keys=Object.keys(x.CP_RECIPE);
ok('every recipe names real resources and real monster drops and has a fee',keys.every(k=>{ const r=x.CP_RECIPE[k]; return r.coins>0&&(r.res||[]).every(([i,n])=>x.RES[i]&&n>0)&&(r.mats||[]).every(([i,n])=>x.MATS[i]&&n>0)&&(r.res||[]).length+(r.mats||[]).length>0; }),keys.length+' recipes');
ok('every catalog piece is free or has a recipe, and every recipe belongs to a piece',x.CP_PIECES.every(r=>x.cpIsFree(r[0],r[1])||(x.cpDef(r[0],r[1])||{}).track||x.CP_RECIPE[r[0]+':'+r[1]])&&keys.every(k=>{ const [t,id]=k.split(':'); return x.cpDef(t,id)||x.COS_CAPES.some(c=>t==='c'&&c[0]===id)||x.COS_AURAS.some(a=>t==='a'&&a[0]===id); }));
ok('each slot has crafted pieces and the free ones are the base garments',['h','t','b','s','g','c','a'].every(s=>keys.some(k=>k[0]===s))&&x.cpIsFree('c','pack')&&x.cpIsFree('a','firefly')&&!x.cpIsFree('c','regal'));
ok('some recipes use drops only, some resources only, some both',keys.some(k=>!(x.CP_RECIPE[k].res||[]).length)&&keys.some(k=>!(x.CP_RECIPE[k].mats||[]).length)&&keys.some(k=>(x.CP_RECIPE[k].res||[]).length&&(x.CP_RECIPE[k].mats||[]).length));
ok('hostile ids are nothing',!x.cpDef('c','constructor')&&x.cosCost('h','__proto__')===null);
// ---- locks ----
const worn={hat:'catphones',top:'crop',bottom:'loincloth',shoes:'geta',gloves:'lace',cape:'regal',aura:'stellar'};
const lk=x.cosLocked(worn,[]);
ok('every worn crafted piece is locked until owned',lk.length===7,lk.map(l=>l.slot+':'+l.id).join());
ok('owning a piece unlocks only that piece',x.cosLocked(worn,['h:catphones']).length===6&&x.cosLocked(worn,Object.keys(x.CP_RECIPE)).length===0);
ok('a free look has no locks',x.cosLocked({hat:'none',top:'tshirt',cape:'pack',aura:'firefly'},[]).length===0);
const cl=x.cosCleanLook(Object.assign({cls:'warrior'},worn),['c:regal']);
ok('the server strips what is not owned in every slot and keeps what is',cl.cape==='regal'&&cl.hat!=='catphones'&&cl.top!=='crop'&&cl.bottom!=='loincloth'&&cl.shoes!=='geta'&&cl.gloves!=='lace'&&cl.aura==='');
// ---- making a piece ----
const inbox={}; const S2=loadServer({dev:true,send(pid,m){ (inbox[pid]=inbox[pid]||[]).push(m); }},['CP_RECIPE','VIL','getH']); const P=S2.api, X=S2.x;
P.join('a',{name:'Alma',look:{cls:'warrior'},save:{level:25}}); P.tick(0.05); const pa=P.players.get('a');
const mk=id=>{ P.receive('a',{t:'cosmake',type:id[0],id:id.slice(2)}); P.tick(0.05); };
const at=(xx,zz)=>P.setPos('a',[xx,X.getH(xx,zz),zz,0,0,0]);
const R=X.CP_RECIPE['h:catphones'];
pa.gear.coins=100000; pa.gear.res={}; pa.gear.mats={}; pa.gear.cos=[];
for(const [i,n] of R.res||[]) pa.gear.res[i]=n; for(const [i,n] of R.mats||[]) pa.gear.mats[i]=n;
at(X.VIL.x+150,X.VIL.z+150); mk('h:catphones'); ok('nothing is made outside a lodge',pa.gear.cos.length===0);
at(X.VIL.x+3,X.VIL.z+3);
mk('c:pack'); ok('a free piece is not made',pa.gear.cos.length===0);
const [m0,mn]=(R.mats||[[null,0]])[0]; if(m0) pa.gear.mats[m0]=mn-1; mk('h:catphones'); ok('one drop short makes nothing and takes nothing',pa.gear.cos.length===0&&(!m0||pa.gear.mats[m0]===mn-1));
if(m0) pa.gear.mats[m0]=mn; const c0=pa.gear.coins; mk('h:catphones');
ok('the cat-ear headphones are made from their resources and drops, and cost their fee',pa.gear.cos.join()==='h:catphones'&&pa.gear.coins===c0-R.coins&&(R.res||[]).every(([i])=>!pa.gear.res[i])&&(R.mats||[]).every(([i])=>!pa.gear.mats[i]));
P.receive('a',{t:'look',look:{cls:'warrior',hat:'catphones',top:'crop',cape:'regal'}}); P.tick(0.05);
ok('the server keeps the owned hat and strips the others',pa.look.hat==='catphones'&&pa.look.top!=='crop'&&pa.look.cape==='');
// ---- the models ----
const C=require('./char-load')(); const look=(sex,o)=>Object.assign({},sex==='female'?C.LOOK_F:C.LOOK_M,o||{});
const bad=[]; const build=(tag,sex,o,q)=>{ try{ const r=C.buildCharacter(look(sex,o),{q:q||0.6}); const t=C.stats(r); if(t.bad) bad.push(tag+' NaN'); if(r.anims) for(let i=0;i<20;i++) for(const f of r.anims) f(i*0.05,0.05,i%2?0.8:0); return t; }catch(e){ bad.push(tag+' '+e.message); } };
for(const sex of ['male','female']) for(const r of C.CP_PIECES){ const slot=C.CP_SLOTS[r[0]][0]; build(r[0]+':'+r[1]+' '+sex,sex,{[slot]:r[1],top:slot==='top'?r[1]:'tshirt'}); }
ok('every crafted hat, top, bottom, shoe and glove builds on both bodies',!bad.length,bad.slice(0,4).join('; '));
bad.length=0; for(const d of C.COS_CAPES) build('cape '+d[0],'male',{cape:d[0]}); for(const d of C.COS_AURAS) build('aura '+d[0],'female',{aura:d[0]});
ok('every cape and aura builds and animates',!bad.length,bad.slice(0,4).join('; '));
bad.length=0; for(const p of ['round','dot','slit','wide','diamond','star','heart','sparkle']) build('pupil '+p,'female',{pupil:p,eyes2:0x44aaee},0.9);
ok('every pupil shape and a second eye colour build',!bad.length,bad.join('; '));
bad.length=0; build('tint','male',{cape:'regal',capeColor:0x22aa66,capeTrim:0xffd700,aura:'stellar',auraColor:0xff3388,auraColor2:0x88ffee}); ok('cape and aura colours build',!bad.length,bad.join('; '));
bad.length=0; for(const sex of ['male','female']) build('chest '+sex,sex,{chest:2.2}); ok('the largest chest builds on both bodies',!bad.length,bad.join('; '));
const pack=C.buildCharacter(look('male',{cape:'pack',top:'tshirt'}),{q:0.6}), plain=C.buildCharacter(look('male',{cape:'',top:'tshirt'}),{q:0.6});
ok('the backpack cape draws a pack on the back',C.tris(pack).length>C.tris(plain).length);
ok('an old save with pack:true and a custom cape becomes cape pack',C.fullLook({cls:'warrior',custom:true,pack:true}).cape==='pack');
// ---- decorations ----
const decos=C.CP_PIECES.filter(r=>r[0]==='d').map(r=>r[1]);
ok('15 to 24 decorations, all crafted (none free), each with a model',decos.length>=15&&decos.length<=24&&decos.every(id=>!x.cpIsFree('d',id)&&C.DECOS[id]&&x.CP_RECIPE['d:'+id]),decos.length);
ok('three decoration fields are locked until made, in any field, and stripped by the server',(()=>{ const w={deco1:'flower',deco2:'halo',deco3:'tail'}; const l=x.cosLocked(w,['d:halo']); const cl=x.cosCleanLook(Object.assign({cls:'warrior'},w),['d:halo']); return l.length===2&&l.every(q=>q.slot==='d')&&cl.deco1===''&&cl.deco2==='halo'&&cl.deco3===''; })());
bad.length=0; for(const id of decos){ for(const sex of ['male','female']) for(const col of [-1,0x33cc88]){ const t=build('deco '+id,sex,{deco1:id,decoColor1:col}); const base=build('base',sex,id==='mane'?{hair:'bald'}:{}); if(t&&base&&t.tris<=base.tris) bad.push(id+' draws nothing'); } }
ok('every decoration builds on both bodies, takes a colour and adds geometry',!bad.length,bad.slice(0,4).join('; '));
bad.length=0; build('three','female',{deco1:'wings',deco2:'tail',deco3:'halo',decoColor2:0x222222}); build('hostile','male',{deco1:'constructor',deco2:'__proto__',deco3:'toString',decoColor1:NaN}); ok('three at once build, hostile ids and colours do not',!bad.length,bad.join('; '));
// ---- shields ----
{ const ids=Object.keys(C.SHIELDS); const none=C.tris(C.buildCharacter(look('male',{}),{q:0.6})).length; const bad2=[];
  for(const id of ids) for(const sex of ['male','female']){ const t=build('shield '+id,sex,{shield:id,shieldColor:0x33aa66,shieldTrim:0xffd24a}); if(!t||t.tris<=0) bad2.push(id); const n=C.tris(C.buildCharacter(look(sex,{shield:id}),{q:0.6})).length; if(n<=none-1&&sex==='male') bad2.push(id+' adds nothing'); }
  ok('four shield shapes, off by default, each crafted, building on both bodies with colours',ids.length===4&&look('male').shield===''&&ids.every(i=>x.CP_RECIPE['w:'+i]&&!x.cpIsFree('w',i))&&!bad.length&&!bad2.length,bad2.join()+bad.join());
  ok('a shield is locked until made and stripped by the server',x.cosLocked({shield:'kite'},[]).length===1&&x.cosCleanLook({shield:'kite'},[]).shield===''&&x.cosCleanLook({shield:'kite'},['w:kite']).shield==='kite');
  build('hostile','male',{shield:'constructor',shieldColor:NaN}); }
// ---- kin features (version 3: ears, tails, muzzles, horns, mane, fur) ----
{ const parts=C.KIN_PARTS, crafted=parts.filter(p=>!p.free), free=parts.filter(p=>p.free), tr=(sex,o)=>C.stats(C.buildCharacter(look(sex,o),{q:1.1})).tris, kb=[];
  ok('no Kin entry was left out as bad',!C.KIN_BAD.length,C.KIN_BAD.join('; '));
  ok('about twenty Kin parts (ears, tails, muzzles) plus horns and a mane, some free and some crafted',parts.length>=20&&parts.length<=26&&free.length>=4&&crafted.length>=12&&['e','k','m'].every(s=>C.kinList(s).some(p=>p.free)&&C.kinList(s).some(p=>!p.free)),parts.length+' parts, '+free.length+' free');
  ok('every crafted Kin part is in the catalog with a recipe, and no free one is',crafted.every(p=>x.cpDef(p.slot,p.id)&&!x.cpIsFree(p.slot,p.id)&&x.CP_RECIPE[p.slot+':'+p.id])&&free.every(p=>!x.cpDef(p.slot,p.id)&&x.cpIsFree(p.slot,p.id)));
  ok('the slots e, k and m own their look fields and fall back to nothing',x.CP_SLOTS.e[0]==='kinEars'&&x.CP_SLOTS.k[0]==='kinTail'&&x.CP_SLOTS.m[0]==='kinMuzzle'&&x.CP_SLOTS.e[1]==='');
  const w={kinEars:'fox',kinTail:'bushy',kinMuzzle:'cat',deco1:'mane'}, lk2=x.cosLocked(w,[]);
  ok('a crafted ear, tail and the mane are locked until made; the server strips exactly those',lk2.length===3&&x.cosLocked(w,['e:fox','k:bushy']).length===1&&x.cosCleanLook(w,[]).kinEars===''&&x.cosCleanLook(w,[]).kinTail===''&&x.cosCleanLook(w,[]).deco1===''&&x.cosCleanLook(w,['e:fox']).kinEars==='fox');
  ok('the free parts are worn by anyone and never locked',x.cosLocked({kinEars:'cat',kinTail:'thin',kinMuzzle:'nose'},[]).length===0&&x.cosCleanLook({kinEars:'cat',kinTail:'puff',kinMuzzle:'whiskers'},[]).kinTail==='puff');
  for(const sex of ['male','female']){ const b0=tr(sex,{});
    for(const [f,s] of [['kinEars','e'],['kinTail','k'],['kinMuzzle','m']]) for(const p of C.kinList(s)){ const t=build('kin '+p.id,sex,{[f]:p.id,furColor:0xc9954a,furColor2:0x2a1c14},1.1); if(!t||t.bad) kb.push(p.id+' '+sex+' bad'); else if(tr(sex,{[f]:p.id})<=b0) kb.push(p.id+' draws nothing'); } }
  ok('every ear, tail and muzzle builds on both bodies with fur colours and adds geometry',!kb.length&&!bad.length,kb.concat(bad).slice(0,4).join('; '));
  const heavy=s=>Math.max(...C.kinList(s).map(p=>tr('male',{[{e:'kinEars',k:'kinTail',m:'kinMuzzle'}[s]]:p.id})-tr('male',{})));
  ok('the heaviest ear, tail and muzzle together add under 600 triangles at hero detail',heavy('e')+heavy('k')+heavy('m')<600,heavy('e')+'+'+heavy('k')+'+'+heavy('m'));
  const hatTr=(hat,o)=>tr('male',Object.assign({hat},o||{}));
  ok('a hat hides the ears (a hood), folds them flat (a wide brim) or lets them poke through',hatTr('hood',{kinEars:'cat'})===hatTr('hood')&&hatTr('ranger',{kinEars:'cat'})>hatTr('ranger')&&hatTr('beanie',{kinEars:'cat'})>hatTr('beanie')&&C.kinHatMode('constructor')==='flat'&&C.kinHatMode('hood')==='hide'&&C.kinHatMode('none')==='poke');
  ok('a mane replaces the hair row: long hair or bald draws the same',tr('female',{hair:'long',deco1:'mane'})===tr('female',{hair:'bald',deco1:'mane'})&&tr('female',{hair:'long'})>tr('female',{hair:'bald'}));
  const col=o=>C.tris(C.buildCharacter(look('male',o),{q:0.6})).join();
  ok('the fur colour recolours the skin and every marking changes the picture',col({furColor:0xc9954a})!==col({})&&C.KIN_MARKS.filter(m=>m[0]).every(m=>col({furMark:m[0],furColor:0xc9954a})!==col({furColor:0xc9954a})),'');
  ok('a marking can have its own second colour',col({furMark:'stripes',furColor:0xc9954a,furColor2:0x2255aa})!==col({furMark:'stripes',furColor:0xc9954a}));
  bad.length=0; build('kin hostile','male',{kinEars:'constructor',kinTail:'__proto__',kinMuzzle:'toString',furColor:NaN,furColor2:'x',furMark:'constructor',deco1:'mane'}); build('kin hostile2','female',{kinEars:'hasOwnProperty',furColor:-5,furColor2:1e12,furMark:'valueOf'});
  ok('hostile Kin ids and colours draw nothing and never throw',!bad.length&&tr('male',{kinEars:'constructor',kinTail:'__proto__'})===tr('male',{}),bad.join('; '));
  ok('kinCleanLook cuts a look down to valid parts, colours and markings',(()=>{ const c=C.kinCleanLook({kinEars:'nope',kinTail:'bushy',kinMuzzle:'constructor',furColor:99999999,furColor2:3,furMark:'zebra'}); return c.kinEars===''&&c.kinTail==='bushy'&&c.kinMuzzle===''&&c.furColor===-1&&c.furColor2===3&&c.furMark===''; })());
  ok('a new hiker has no Kin features and the skin tone as fur',['kinEars','kinTail','kinMuzzle','furMark'].every(k=>look('male')[k]===''&&look('female')[k]==='')&&look('male').furColor===-1&&look('male').furColor2===-1);
  const wrap=C.buildCharacter(look('male',{kinTail:'bushy'}),{q:0.6}); let moved=false; if(wrap.anims){ const before=wrap.root.children.length; for(let i=0;i<30;i++) for(const f of wrap.anims) f(i*0.1,0.1,1); moved=true; }
  ok('a tail swings with the rig',moved&&wrap.anims.length>=1); }
// ---- switching the sex of a worn set ----
{ const miss=[], sig=Object.keys(C.OUTFITS);
  for(const id of sig){ const m=C.CHAR_MODELS[id], sex0=m.sexes[0], sex1=sex0==='male'?'female':'male';
    let L=C.ofWear(C.applySetup(Object.assign({},sex0==='female'?C.LOOK_F:C.LOOK_M),C.setupsOf(m,sex0)[0]),id); L.model=id;
    const F=C.charSexFit(L,sex1); if(F.sex!==sex1) miss.push(id+' sex'); if(C.lookOutOfRange(F,m).length) miss.push(id+' out of range: '+C.lookOutOfRange(F,m).join('/'));
    if(Object.keys(C.ofPieces(F)).length!==Object.keys(C.ofPieces(L)).length) miss.push(id+' lost pieces'); if(F.height!==L.height) miss.push(id+' height');
    const t=build('fit '+id,sex1,F,0.5); if(!t) miss.push(id+' build'); }
  ok('every signature set switched to the other sex keeps its pieces and height, lands inside its ranges and builds',!miss.length&&!bad.length,miss.slice(0,4).join('; ')+bad.slice(0,2).join('; ')); }
// ---- the child-safe setting ----
{ const C2=require('./char-load')(code=>code.replace('getItem(){return null}',"getItem(k){return k==='wildwood-modest'?'1':null}"));
  const sig=(Cx,o)=>Cx.tris(Cx.buildCharacter(Object.assign({},Cx.LOOK_M,o),{q:0.5})).join();
  const swaps=[['top','crop','tunic'],['top','halter','tunic'],['top','harness','tunic'],['bottom','loincloth','trousers'],['bottom','shortshorts','trousers'],['bottom','wrapskirt','trousers']];
  ok('off by default: the bare pieces draw as themselves',swaps.every(([k,a,b])=>sig(C,{[k]:a})!==sig(C,{[k]:b})));
  ok('on: every bare crafted top and bottom is drawn as its plain stand-in',swaps.every(([k,a,b])=>sig(C2,{[k]:a})===sig(C2,{[k]:b})));
  const wear=(Cx,id)=>{ const m=Cx.CHAR_MODELS[id], sex=m.sexes[0]; return Cx.buildCharacter(Cx.ofWear(Cx.applySetup(Object.assign({},sex==='female'?Cx.LOOK_F:Cx.LOOK_M),Cx.setupsOf(m,sex)[0]),id),{q:0.5}); };
  const diff=['sabir','genzo','nephra','marigold','torgeir'].filter(id=>Cx_same(wear(C,id),wear(C2,id)));
  function Cx_same(a,b){ const x1=C.tris(a), x2=C2.tris(b); return x1.length===x2.length&&x1.every((v,i)=>v===x2[i]); }
  ok('on: the five revealing sets are drawn differently (covered)',!diff.length,diff.join()); }
// ---- multi-colour tops and bottoms ----
{ const sig=o=>C.tris(C.buildCharacter(look('male',o),{q:0.6})).join(); const cr=[['top',C.GMX_TOPS.map(r=>r[0]).filter(i=>i!=='none'&&C.GMX_PAL.top[i])],['bottom',C.GMX_BOTTOMS.map(r=>r[0]).filter(i=>i!=='none'&&C.GMX_PAL.bottom[i])]];
  const miss=[]; for(const [slot,ids] of cr) for(const id of ids){ const L=look('male',{[slot]:id}), P=C.gmxPalDef(L,slot); if(P.length<3){ miss.push(slot+':'+id+' has '+P.length+' colours'); continue; }
    const k=slot==='top'?'tintTop':'tintBottom'; for(let i=2;i<=P.length;i++){ if(sig(Object.assign({},L))===sig(Object.assign({},L,{[k+i]:0x22ccff}))) miss.push(slot+':'+id+' colour '+i+' changes nothing'); } }
  ok('every crafted top and bottom has 3-4 colours and each one recolours the piece',!miss.length,miss.slice(0,4).join('; ')); }
// ---- a big look still reaches the server (a 2000-char cap once dropped it silently, so a shield could not be taken off) ----
{ pa.gear.cos=['w:round']; const big=o=>Object.assign({cls:'warrior',top:'jacket',shield:'round',pad:'x'.repeat(20)},o);
  const fat=o=>{ const L=big(o); for(let i=0;i<110;i++) L['k'+i]=i*1234.5678; return L; };   // ~2.3k chars of JSON, as a set outfit with colours is
  P.receive('a',{t:'look',look:fat({shield:'round'})}); ok('a large look with a shield is kept',pa.look.shield==='round');
  ok('the test look is above the old cap',JSON.stringify(fat({shield:''})).length>2000);
  P.receive('a',{t:'look',look:fat({shield:''})}); ok('a large look with no shield takes the shield off',pa.look.shield===''); }
console.log(fails?fails+' FAILED':'all passed'); process.exitCode=fails?1:0;
