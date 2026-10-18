// Headless test of the general cosmetic pieces (version 3.2): the catalog and its recipes, the lock rules (cosLocked / cosCleanLook), making a piece with resources and
// monster drops at a lodge, and that every piece, pupil, colour, the backpack cape and the largest chest build with no NaN.
// Usage: node tools/cospieces-smoke.js
const {loadServer}=require('./load');
const {api:W,x}=loadServer({dev:true,send(){}},['CP_PIECES','CP_DECO','CP_RECIPE','CP_SLOTS','CP_FREE','cpDef','cpIsFree','cosCost','cosLocked','cosCleanLook','sanitizeCos','RES','MATS','VIL','COS_CAPES','COS_AURAS']);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&i!==''?'  ('+i+')':'')); if(!c) fails++; };
// ---- the catalog ----
const keys=Object.keys(x.CP_RECIPE);
ok('every recipe names real resources and real monster drops and has a fee',keys.every(k=>{ const r=x.CP_RECIPE[k]; return r.coins>0&&(r.res||[]).every(([i,n])=>x.RES[i]&&n>0)&&(r.mats||[]).every(([i,n])=>x.MATS[i]&&n>0)&&(r.res||[]).length+(r.mats||[]).length>0; }),keys.length+' recipes');
ok('every catalog piece is free or has a recipe, and every recipe belongs to a piece',x.CP_PIECES.every(r=>x.cpIsFree(r[0],r[1])||x.CP_RECIPE[r[0]+':'+r[1]])&&keys.every(k=>{ const [t,id]=k.split(':'); return x.cpDef(t,id)||x.COS_CAPES.some(c=>t==='c'&&c[0]===id)||x.COS_AURAS.some(a=>t==='a'&&a[0]===id); }));
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
ok('15 to 20 decorations, all crafted (none free), each with a model',decos.length>=15&&decos.length<=20&&decos.every(id=>!x.cpIsFree('d',id)&&C.DECOS[id]&&x.CP_RECIPE['d:'+id]),decos.length);
ok('three decoration fields are locked until made, in any field, and stripped by the server',(()=>{ const w={deco1:'flower',deco2:'halo',deco3:'tail'}; const l=x.cosLocked(w,['d:halo']); const cl=x.cosCleanLook(Object.assign({cls:'warrior'},w),['d:halo']); return l.length===2&&l.every(q=>q.slot==='d')&&cl.deco1===''&&cl.deco2==='halo'&&cl.deco3===''; })());
bad.length=0; for(const id of decos){ for(const sex of ['male','female']) for(const col of [-1,0x33cc88]){ const t=build('deco '+id,sex,{deco1:id,decoColor1:col}); const base=build('base','male',{}); if(t&&base&&t.tris<=base.tris) bad.push(id+' draws nothing'); } }
ok('every decoration builds on both bodies, takes a colour and adds geometry',!bad.length,bad.slice(0,4).join('; '));
bad.length=0; build('three','female',{deco1:'wings',deco2:'tail',deco3:'halo',decoColor2:0x222222}); build('hostile','male',{deco1:'constructor',deco2:'__proto__',deco3:'toString',decoColor1:NaN}); ok('three at once build, hostile ids and colours do not',!bad.length,bad.join('; '));
// ---- shields ----
{ const ids=Object.keys(C.SHIELDS); const none=C.tris(C.buildCharacter(look('male',{}),{q:0.6})).length; const bad2=[];
  for(const id of ids) for(const sex of ['male','female']){ const t=build('shield '+id,sex,{shield:id,shieldColor:0x33aa66,shieldTrim:0xffd24a}); if(!t||t.tris<=0) bad2.push(id); const n=C.tris(C.buildCharacter(look(sex,{shield:id}),{q:0.6})).length; if(n<=none-1&&sex==='male') bad2.push(id+' adds nothing'); }
  ok('four shield shapes, off by default, each crafted, building on both bodies with colours',ids.length===4&&look('male').shield===''&&ids.every(i=>x.CP_RECIPE['w:'+i]&&!x.cpIsFree('w',i))&&!bad.length&&!bad2.length,bad2.join()+bad.join());
  ok('a shield is locked until made and stripped by the server',x.cosLocked({shield:'kite'},[]).length===1&&x.cosCleanLook({shield:'kite'},[]).shield===''&&x.cosCleanLook({shield:'kite'},['w:kite']).shield==='kite');
  build('hostile','male',{shield:'constructor',shieldColor:NaN}); }
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
console.log(fails?fails+' FAILED':'all passed'); process.exitCode=fails?1:0;
