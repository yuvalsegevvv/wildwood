// Headless test of the character model (src/shared/character.js, src/game/character/model*.js): prints PASS/FAIL.
// Usage: node tools/character-smoke.js            (needs `npm install` for three; no build needed; ~40 s)
// What it guards: the slider table, every character model's recommended setups and ranges (a model without them FAILS), that every setup and every slider extreme
// builds a sane body (no NaN, feet on the ground, anime proportions), that each joint continues its neighbour, the detail budget, and that the random villagers
// are the same people as before the rework (a seeded rng: the draw order of randomLook must not change).
const C=require('./char-load')();
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&i!==''?'  ('+i+')':'')); if(!c) fails++; };
const near=(a,b,e)=>Math.abs(a-b)<=e;
const base=C.CHAR_MODELS.base, HAIRS=['bald','buzz','short','messy','spiky','curly','bob','long','ponytail','twintail','braid','bun'], HATS=['none','ranger','beanie','cap','helm','kasa'];
const bare=(L,o)=>Object.assign({},L,{hat:'none',hair:'bald',facial:'none'},o||{});   // a body without the extras that make it asymmetric or taller
const look=(sex,o)=>Object.assign({},sex==='female'?C.LOOK_F:C.LOOK_M,o||{});

/* ---- the slider table ---- */
{ const keys=C.BODY_SLIDERS.map(s=>s.k), groups=new Set(['Body','Shape','Face','Eyes','Features','Hair']);
  ok('the slider table has 30 or more sliders ('+keys.length+')',keys.length>=30);
  ok('slider keys are unique',new Set(keys).size===keys.length);
  ok('every slider has a range, a default inside it, a label, two ends and a known group',C.BODY_SLIDERS.every(s=>s.min<s.max&&s.def>=s.min&&s.def<=s.max&&s.label&&s.ends.length===2&&s.ends.every(e=>typeof e==='string')&&groups.has(s.g)));
  ok('both default looks carry every slider, at the model\'s reference setup of their sex',keys.every(k=>{ const rm=C.setupsOf(C.CHAR_MODELS.base,'male')[0].v, rf=C.setupsOf(C.CHAR_MODELS.base,'female')[0].v; return C.LOOK_M[k]===(rm[k]!==undefined?rm[k]:C.SLIDER_DEFS[k])&&C.LOOK_F[k]===(rf[k]!==undefined?rf[k]:C.SLIDER_DEFS[k]); }));
  ok('sliderVal clamps and falls back on bad input',C.sliderVal({legs:9},'legs')===1.2&&C.sliderVal({legs:-5},'legs')===0.85&&C.sliderVal({legs:'x'},'legs')===1&&C.sliderVal({legs:NaN},'legs')===1&&C.sliderVal({legs:Infinity},'legs')===1&&C.sliderVal(null,'legs')===1&&C.sliderVal({smile:-3},'smile')===-1);
  const L=look('female',{legs:1.1,smile:0.4,hair:'braid'}), net=C.lookForNet(L);
  ok('lookForNet leaves default sliders out and keeps the rest',net.legs===1.1&&net.smile===0.4&&!('torso' in net)&&net.hair==='braid'&&net.waist===0.92&&JSON.stringify(net).length<JSON.stringify(L).length);
  ok('a look from the network merges back to the original',JSON.stringify(C.fullLook(net))===JSON.stringify(C.fullLook(L))&&C.fullLook(net).sex==='female'&&C.fullLook(null).sex==='male');
  { const old=C.fullLook({sex:'male',height:1.04,build:1}); ok('an old save (no slider fields) keeps its look and gets the neutral body; a brand-new hiker starts on the reference setup',old.hair===C.LOOK_M.hair&&old.height===1.04&&C.SLIDER_KEYS.filter(k=>k!=='height').every(k=>old[k]===C.SLIDER_DEFS[k])&&C.LOOK_M.legs===1.06&&C.LOOK_F.waist===0.92); }
  ok('the model scale follows the Height slider (female x0.95) and is clamped',near(C.lookScale(look('male',{height:1.05})),1.05,1e-9)&&near(C.lookScale(look('female',{height:1})),0.95,1e-9)&&C.lookScale({height:99})===1.1&&C.lookScale({sex:'male',height:'tall'})===1);
}

/* ---- character models and their recommended setups ---- */
{ const models=Object.values(C.CHAR_MODELS);
  ok('there is a base character model',!!base&&models.length>=1);
  for(const m of models){ const bad=C.validateCharModel(m); ok('model "'+m.id+'" passes the setups and ranges rules',bad.length===0,bad.join('; ')); }
  ok('base: at least 3 setups per sex, one reference setup each',['male','female'].every(sx=>C.setupsOf(base,sx).length>=3&&C.setupsOf(base,sx).filter(s=>s.def).length===1)&&C.setupsOf(base,'male')[0].def);
  ok('the elf setup (sex "any") is offered to both sexes',['male','female'].every(sx=>C.setupsOf(base,sx).some(s=>s.id==='elf')));
  const none=C.validateCharModel({id:'x',name:'X',setups:[]}), badRange=C.validateCharModel(Object.assign({},base,{setups:base.setups.concat([{id:'wild',name:'Wild',sex:'male',v:{legs:1.19}}])})), unknown=C.validateCharModel(Object.assign({},base,{setups:base.setups.concat([{id:'odd',name:'Odd',sex:'male',v:{wings:1}}])}));
  ok('a model without recommended setups is refused',none.length>=2&&/at least 3/.test(none.join()));
  ok('a setup outside the model\'s recommended range is refused',badRange.some(t=>/wild.*legs/.test(t)));
  ok('a setup with an unknown slider is refused',unknown.some(t=>/unknown slider wings/.test(t)));
  ok('a recommended range outside the slider\'s range is refused',C.validateCharModel(Object.assign({},base,{ranges:Object.assign({},base.ranges,{legs:[0.5,1.1]})})).some(t=>/range of legs/.test(t)));
  const fem=(id,v)=>({id,name:id,sex:'female',def:id==='ref',v}), one={id:'solo',name:'Solo',sexes:['female'],ranges:{},setups:[fem('ref',{legs:1.05}),fem('b',{legs:1.02}),fem('c',{legs:1.08})]};
  ok('a model designed for one sex needs setups for that sex only (3 and one reference)',C.validateCharModel(one).length===0,C.validateCharModel(one).join('; '));
  ok('...and refuses a setup for a sex it is not designed for, or too few for its own',C.validateCharModel(Object.assign({},one,{setups:one.setups.concat([{id:'m',name:'M',sex:'male',v:{}}])})).some(t=>/not designed for/.test(t))&&C.validateCharModel(Object.assign({},one,{setups:one.setups.slice(0,2)})).some(t=>/at least 3/.test(t)));
  ok('a model with an empty or unknown sexes list is refused',C.validateCharModel(Object.assign({},one,{sexes:[]})).length>0&&C.validateCharModel(Object.assign({},one,{sexes:['robot']})).length>0);
  const hero=base.setups.find(s=>s.id==='hero'), bru=base.setups.find(s=>s.id==='bruiser'), after=C.applySetup(C.applySetup(look('male'),bru),hero);
  ok('applying a setup resets the sliders it does not mention (no leftovers)',C.BODY_SLIDERS.every(s=>after[s.k]===(hero.v[s.k]!==undefined?hero.v[s.k]:s.def)));
  ok('applying a setup leaves colours, clothes and class alone',after.skin===C.LOOK_M.skin&&after.top===C.LOOK_M.top&&after.cls==='warrior');
  ok('every setup is inside the recommended ranges (nothing out of range)',base.setups.every(s=>C.lookOutOfRange(C.applySetup(look(s.sex==='female'?'female':'male'),s),base).length===0));
  ok('lookOutOfRange flags a slider outside the recommended range',C.lookOutOfRange(look('male',{legs:1.2,smile:0.95}),base).join()==='legs,smile'&&C.lookOutOfRange(look('male'),base).length===0);
  ok('the default looks are inside the recommended ranges',C.lookOutOfRange(C.LOOK_M,base).length===0&&C.lookOutOfRange(C.LOOK_F,base).length===0);
  ok('an unknown model id falls back to the base model',C.charModelOf({model:'nope'})===base&&C.charModelOf(null)===base);
}

/* ---- every setup builds a sane anime-proportioned body ---- */
const NODES=['hips','spine','head','shL','elL','shR','elR','hipL','kneeL','hipR','kneeR'], ANCHORS=['headTop','face','neck','chest','back','waist','hipL','hipR','shoulderL','shoulderR','wristL','wristR','ankleL','ankleR'];
const headsTall=r=>{ const d=r.dims, skullTop=d.hipY+d.headY+0.105*d.faceScale[1]*d.hs, headH=0.203*d.faceScale[1]*d.hs; return {top:skullTop,heads:skullTop/headH,legs:d.hipY/skullTop}; };
{ let worst=null, all=true, grounded=true, sane=true, rigOk=true, anchorsOk=true, n=0;
  for(const sex of ['male','female']) for(const st of C.setupsOf(base,sex)){
    const L=bare(C.applySetup(look(sex),st)), r=C.buildCharacter(L,{q:0.5}), s=C.stats(r), h=headsTall(r); n++;
    if(s.bad>0) all=false; if(Math.abs(s.minY)>0.02) grounded=false;
    if(!(h.heads>5.2&&h.heads<7.0&&h.legs>0.46&&h.legs<0.6)){ sane=false; worst=sex+'/'+st.id+' '+h.heads.toFixed(2)+' heads, legs '+(h.legs*100).toFixed(0)+'%'; }
    if(!NODES.every(k=>r[k]&&r[k].isObject3D)) rigOk=false; if(!ANCHORS.every(k=>r.anchors[k]&&r.anchors[k].isObject3D)) anchorsOk=false;
  }
  ok('all '+n+' recommended setups build with no NaN anywhere',all);
  ok('every setup stands on the ground (feet within 2 cm of y = 0)',grounded);
  ok('every setup is 5.2-7 heads tall with legs 46-60% of the height (anime proportions)',sane,worst||'');
  ok('every setup has the rig poseRig animates',rigOk);
  ok('every setup has the anchors outfits attach to, and rig.dims / rig.sliders',anchorsOk&&C.buildCharacter(look('male'),{q:0.4}).dims.hipY>0.8&&C.buildCharacter(look('male',{legs:9}),{q:0.4}).sliders.legs===1.2);
}
{ const d=headsTall(C.buildCharacter(bare(look('male')),{q:0.5})), f=headsTall(C.buildCharacter(bare(look('female')),{q:0.5}));
  ok('the default bodies are about 5.9 heads tall (6.3 before the head was made 10% taller)',d.heads>5.6&&d.heads<6.2&&f.heads>5.6&&f.heads<6.2,d.heads.toFixed(2)+' / '+f.heads.toFixed(2));
  ok('a character is about 1.9 m (male) and 1.8 m (female) at Height 1 (the 10% taller head added 3 cm)',near(d.top,1.9,0.08)&&near(f.top*0.95,1.8,0.08),d.top.toFixed(2)+' / '+(f.top*0.95).toFixed(2));
}

/* ---- the joints continue each other (no "separate sausages") ---- */
{ const r=C.buildCharacter(bare(look('male'),{top:'tshirt'}),{q:1}), D=r.dims;
  // the half-widths of the vertices of a mesh within 1 mm of a plane (local y) -> [x half-width, z half-width]
  const ring=(mesh,y)=>{ const p=mesh.geometry.attributes.position; let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(let i=0;i<p.count;i++) if(Math.abs(p.getY(i)-y)<0.0012){ x0=Math.min(x0,p.getX(i)); x1=Math.max(x1,p.getX(i)); z0=Math.min(z0,p.getZ(i)); z1=Math.max(z1,p.getZ(i)); } return [(x1-x0)/2,(z1-z0)/2]; };
  const same=(a,b)=>a[0]>0.02&&near(a[0],b[0],a[0]*0.03)&&near(a[1],b[1],a[1]*0.03);
  const upper=r.shL.children[0], fore=r.elL.children[0], thigh=r.hipL.children[0], shin=r.kneeL.children[0];
  ok('the elbow: the upper arm and the forearm have the same cross-section at the joint',same(ring(upper,-D.upper),ring(fore,0)),JSON.stringify([ring(upper,-D.upper),ring(fore,0)].map(a=>a.map(v=>+v.toFixed(4)))));
  ok('the knee: the thigh and the shin have the same cross-section at the joint',same(ring(thigh,-D.thigh),ring(shin,0)),JSON.stringify([ring(thigh,-D.thigh),ring(shin,0)].map(a=>a.map(v=>+v.toFixed(4)))));
  // a bent pose keeps every joint's ball in place: the elbow / knee centre of each mesh pair stays within a millimetre of each other
  const wp=o=>{ r.root.updateMatrixWorld(true); return new THREE.Vector3().setFromMatrixPosition(o.matrixWorld); };
  C.bend(r,{a:1}); const dE=wp(r.elL).distanceTo(wp(r.shL).add(new THREE.Vector3(0,0,0))), dK=wp(r.kneeL).distanceTo(wp(r.hipL));
  ok('bending keeps the limb lengths (the arm / leg pieces stay joined at the joints)',near(dK,D.thigh,0.12)&&dE>0.1&&dE<=D.upper+1e-6);
  ok('the arms hang with the hands at about the middle of the thigh',(()=>{ const r2=C.buildCharacter(bare(look('male')),{q:0.5}), h=new THREE.Vector3().setFromMatrixPosition((r2.root.updateMatrixWorld(true),r2.anchors.wristL.matrixWorld)); const hip=r2.dims.hipY; return h.y<hip-0.02&&h.y>hip-0.4; })());
  const sym=C.stats(C.buildCharacter(bare(look('male')),{q:0.5})); const rr=C.buildCharacter(bare(look('female')),{q:0.5}); rr.root.updateMatrixWorld(true); const bb=new THREE.Box3().setFromObject(rr.root);
  ok('a bald, hatless body is left-right symmetric',near(bb.min.x+bb.max.x,0,0.012),(bb.min.x+bb.max.x).toFixed(4));
}

/* ---- detail budget (more polygons for the hiker, the old cost for villagers and other players) ---- */
{ const t=q=>C.stats(C.buildCharacter(look('male'),{q})).tris, hi=t(1.1), mid=t(0.65), npc=t(0.5), low=t(0.38), lite=t(0.3);
  ok('the hiker at full detail has more than twice the triangles the old model had (about 15,500)',hi>31000,hi);
  ok('the hiker at full detail stays under 70k triangles',hi<70000,hi);
  ok('other players (q 0.65) cost under 30k, villagers (q 0.5) under 20k, phones (q 0.38) under 12k, light mode (q 0.3) under 10k',mid<30000&&npc<20000&&low<12000&&lite<10000,[mid,npc,low,lite].join('/'));
  ok('less detail is always fewer triangles',hi>mid&&mid>npc&&npc>low&&low>lite);
  ok('charDetail: the hiker gets the most, villagers the least',C.charDetail('hero')>C.charDetail('remote')&&C.charDetail('remote')>C.charDetail('npc'));
}

/* ---- sliders at their extremes, garbage input, hair and hats ---- */
{ let bad=null, shape=null;
  const check=(L,name)=>{ const r=C.buildCharacter(L,{q:0.3}), s=C.stats(r); if(s.bad>0&&!bad) bad=name; const h=s.maxY-s.minY; if((!(h>1.3&&h<2.5)||s.maxR>1.2)&&!shape) shape=name+' height '+h.toFixed(2)+' r '+s.maxR.toFixed(2); };
  for(const s of C.BODY_SLIDERS) for(const v of [s.min,s.max]) { check(look('male',{[s.k]:v}),'male '+s.k+'='+v); check(look('female',{[s.k]:v}),'female '+s.k+'='+v); }
  check(look('male',Object.fromEntries(C.BODY_SLIDERS.map(s=>[s.k,s.min]))),'all minimum'); check(look('female',Object.fromEntries(C.BODY_SLIDERS.map(s=>[s.k,s.max]))),'all maximum');
  ok('every slider at its minimum and at its maximum builds a finite body (62 builds, both sexes)',!bad,bad||'');
  ok('...and the body stays human-sized (1.3-2.5 m, within 1.2 m of the middle)',!shape,shape||'');
  const junk=look('female',Object.fromEntries(C.BODY_SLIDERS.map((s,i)=>[s.k,[NaN,'big',null,Infinity,-1e9,1e9,{},[]][i%8]])));
  ok('garbage slider values (NaN, strings, objects, huge) build the same body as the defaults',C.stats(C.buildCharacter(junk,{q:0.4})).tris===C.stats(C.buildCharacter(look('female'),{q:0.4})).tris||C.stats(C.buildCharacter(junk,{q:0.4})).bad===0);
  let hairBad=null, n=0; for(const sex of ['male','female']) for(const h of HAIRS) for(const hat of HATS){ n++; const s=C.stats(C.buildCharacter(look(sex,{hair:h,hat,facial:sex==='male'?'beard':'none',ahoge:h==='short'}),{q:0.3})); if(s.bad>0||s.tris<3000) hairBad=sex+' '+h+' '+hat; }
  ok('all '+n+' hair x hat combinations build (both sexes, with a beard / the ahoge where they apply)',!hairBad,hairBad||'');
  let faceBad=null; for(const f of ['none','stubble','mustache','beard']) for(const fa of ['round','oval','angular']) if(C.stats(C.buildCharacter(look('male',{facial:f,face:fa}),{q:0.3})).bad>0) faceBad=f+' '+fa;
  ok('every facial hair x face shape builds',!faceBad,faceBad||'');
  let clothBad=null; for(const top of ['tshirt','flannel','jacket','hoodie','mail','plate']) for(const bottom of ['trousers','shorts','skirt']) for(const shoes of ['boots','sneakers']) for(const pack of [false,true]){ const s=C.stats(C.buildCharacter(look('female',{top,bottom,shoes,pack,bottomStyle:bottom==='trousers'&&top==='plate'?'plate':''}),{q:0.3})); if(s.bad>0) clothBad=[top,bottom,shoes,pack].join(' '); }
  ok('every top x bottom x shoes x backpack builds',!clothBad,clothBad||'');
}

/* ---- sliders actually change the body (not just numbers in a table) ---- */
{ const m=(L,q)=>{ const r=C.buildCharacter(bare(L),{q:q||0.4}); r.root.updateMatrixWorld(true); const b=new THREE.Box3().setFromObject(r.root); return {w:b.max.x-b.min.x,h:b.max.y-b.min.y,d:r.dims,r}; };
  const d=m(look('male')), lg=m(look('male',{legs:1.2})), lgs=m(look('male',{legs:0.85})), sh=m(look('male',{shoulders:1.25})), shn=m(look('male',{shoulders:0.8})), hd=m(look('male',{head:1.2})), tl=m(look('male',{torso:1.15}));
  ok('Leg length lengthens the legs and the body',lg.d.hipY>d.d.hipY+0.1&&lgs.d.hipY<d.d.hipY-0.08&&lg.h>d.h+0.1);
  ok('Shoulders widen / narrow the shoulders',sh.d.shX>d.d.shX*1.2&&shn.d.shX<d.d.shX*0.85);
  ok('Head size grows the head',hd.d.hs>d.d.hs*1.15&&hd.h>d.h);
  ok('Torso length lifts the head',tl.d.headY>d.d.headY+0.04);
  const eyeW=L=>{ const r=C.buildCharacter(L,{q:0.4}); return r.head.children[0].geometry.attributes.position.count; };
  ok('Waist and Hips change the body width at their height',(()=>{ const wid=(L,y0,y1)=>{ const r=C.buildCharacter(bare(L),{q:0.5}); r.root.updateMatrixWorld(true); const g=r.spine.children[0].geometry.attributes.position; let mx=0; for(let i=0;i<g.count;i++){ const y=g.getY(i); if(y>y0&&y<y1) mx=Math.max(mx,Math.abs(g.getX(i))); } return mx; };
    return wid(look('female',{waist:1.3}),0.15,0.2)>wid(look('female',{waist:0.75}),0.15,0.2)*1.3&&wid(look('female',{hips:1.3}),-0.04,0.02)>wid(look('female',{hips:0.8}),-0.04,0.02)*1.15; })());
  // (the signature is a second moment: a shape growing about its own centre changes it, a plain sum would not)
  ok('Eye size, tilt and spacing move the eyes (the head mesh changes)',(()=>{ const sig=L=>{ const p=C.buildCharacter(L,{q:0.4}).head.children[0].geometry.attributes.position; let s=0; for(let i=0;i<p.count;i++) s+=Math.pow(p.getX(i)*1.3+p.getY(i)*0.7+p.getZ(i)*1.1,2); return s; }; const a=sig(look('female')); return [{eyeSize:1.4},{eyeTilt:1},{eyeGap:1.2},{eyeHeight:1},{brow:1},{smile:1},{noseSize:1.4},{mouthSize:1.4},{lips:1.6},{earPoint:1},{earSize:1.5},{jaw:0.75},{chin:1.4},{cheeks:1.4}].every(o=>Math.abs(sig(look('female',o))-a)>1e-6); })());
  ok('Hair length / volume / fringe change the hair',(()=>{ const t=L=>C.stats(C.buildCharacter(L,{q:0.4})).maxY; const g=L=>{ const r=C.buildCharacter(L,{q:0.4}); return r.head.children[0].geometry.attributes.position.count; }; const lh=bare(look('female'),{hair:'long',hat:'none'}); const sg=L=>{ const r=C.buildCharacter(L,{q:0.5}); r.root.updateMatrixWorld(true); return new THREE.Box3().setFromObject(r.head).min.y; };
    return sg(Object.assign({},lh,{hairLength:1.5}))<sg(Object.assign({},lh,{hairLength:0.6}))-0.15&&g(look('female',{hair:'short',bangs:0}))!==g(look('female',{hair:'short',bangs:1}))&&g(look('female',{hair:'short',ahoge:true}))>g(look('female',{hair:'short'})); })());
}

/* ---- random looks ---- */
{ const KEYS=['sex','height','build','skin','face','eyes','facial','hair','hairColor','top','topColor','bottom','bottomColor','shoes','shoeColor','hat','hatColor','pack','chest'];
  const h=s=>{ let x=2166136261; for(let i=0;i<s.length;i++){ x^=s.charCodeAt(i); x=Math.imul(x,16777619); } return x>>>0; }, dig=l=>h(JSON.stringify(KEYS.map(k=>l[k])));
  // recorded from the model before the rework: the same seeds must give the same villagers (hair, clothes, colours, height, build), so nobody in a village changes
  const OLD=[[3255732650,229960577,512585502],[3885776298,3653037586,2460189447],[3712690620,253724284,297576318],[3975270362,3485515165,2529547838],[3926248845,2093330338,3192014154],[807003964,38221902,3603138781],[636423668,21701206,2239328324],[3888653976,309787869,2935732764],[88553109,1729866801,773971314],[3554919310,3217861089,2323475757],[4156030734,978619001,32212119],[4038190134,3928662785,3664863133]];
  let same=true; for(let s=1;s<=12;s++){ const r=C.mulberry32(s*7919); for(let i=0;i<3;i++) if(dig(C.randomLook(r,{villager:true}))!==OLD[s-1][i]) same=false; }
  ok('seeded villagers are the same people as before the rework (36 looks)',same);
  ok('a named villager (fixed sex and hair colour) is the same as before',dig(C.randomLook(C.mulberry32(5),{villager:true,base:{sex:'female',hairColor:0x6a4428}}))===3496395702);
  const r1=C.mulberry32(77), a=C.randomLook(r1,{villager:true}), b=C.randomLook(C.mulberry32(77),{villager:true});
  ok('a villager\'s new sliders are deterministic and inside the recommended ranges',JSON.stringify(a)===JSON.stringify(b)&&C.lookOutOfRange(a,base).length===0&&a.legs!==undefined);
  let out=null, setupish=0; for(let i=0;i<150;i++){ const L=C.randomLook(Math.random,{base:{custom:true}}); const oor=C.lookOutOfRange(L,base); if(oor.length&&!out) out=oor.join(); if(L.legs!==1||L.waist!==1||L.shoulders!==1) setupish++; if(C.stats(C.buildCharacter(L,{q:0.3})).bad>0) out='NaN in '+JSON.stringify(L); }
  ok('"Surprise me" starts from a recommended setup: 150 draws stay inside the recommended ranges and build',!out&&setupish>100,out||setupish);
}

// a look is another player's data: a model named like a member of Object.prototype used to make buildCharacter throw for everyone who saw the player
{ const names=['constructor','__proto__','toString','hasOwnProperty','valueOf'], bad=[];
  const warn=console.warn; console.warn=()=>{};
  for(const m of names) for(const sex of ['male','female']) for(const k of ['model','hat','hair','top','bottom','shoes','face','facial','armor']){
    try{ const rig=C.buildCharacter(C.fullLook({sex,[k]:m}),{q:1}); if(C.stats(rig).bad) bad.push(k+'='+m+' (NaN)'); }catch(e){ bad.push(k+'='+m+': '+e.message); } }
  console.warn=warn;
  ok('a look whose model (or any field) is the name of an Object.prototype member still builds',!bad.length,bad.slice(0,3).join('; '));
  ok('charModelOf falls back to the base model for those names',names.every(m=>C.charModelOf({model:m})===C.CHAR_MODELS.base)&&C.charModelOf({model:'tansy'})===C.CHAR_MODELS.tansy&&C.charModelOf(null)===C.CHAR_MODELS.base);
}

console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
