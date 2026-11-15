// Headless test of version 3's rolled level-40 gear (shared/rolls.js, the level-40 ids in shared/dungeon-rewards.js, server/rolls.js): ids and records, the 13 stats with three
// different lines, weapons rolling higher offence than armour, caps (cooldown reduction 40%), sacrifice stones 1/2/4/8/16, rolling and rerolling, saves, accuracy / resistance.
// Usage: node tools/rolls-smoke.js
const {loadServer}=require('./load');
const {api:W,x}=loadServer({dev:true,send(){}},['ITEM','RL_STATS','RL_CAPS','RL_SAC','RL_COST','rlRoll','rlParseCode','rlLinesOf','rlLinesFor','rlSacFor','rlSumOf','dgPieceId','dgIdOfQ','dgClearRewards','dgEqPick','DG_TIERS','dgItem','dgvMigrate','dgGearId','dgPendantId40','dgAllPendantIds40','dgTalismanId','rlP','dgParse','dgGearId40','dgRingId40','dgAllRingIds40','dgAllIds40','dgEnhanceNext','mergedId','sanitizeGear','recalcP','rollDmgS','abilityCd','newGearFor']);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const tick=n=>{ for(let i=0;i<n;i++) W.tick(0.05); };
const I=x.ITEM;
ok('13 stats, 1-3 lines a roll (default one)',x.RL_STATS.length===13&&x.rlParseCode(x.rlRoll()).length===1&&x.rlParseCode(x.rlRoll(null,2)).length===2&&x.rlParseCode(x.rlRoll(null,3)).length===3);
{ let bad=0; for(let i=0;i<500;i++){ const c=x.rlRoll(null,3), L=x.rlParseCode(c,3); if(!L||new Set(L.map(l=>l.s.id)).size!==3||x.rlParseCode(c,2)||x.rlParseCode(c,1)) bad++; } ok('500 rolls: always three different stats',bad===0); }
ok('245 unrolled level-40 ids, lv 40, tier 7',x.dgAllIds40().length===245&&x.dgAllIds40().every(id=>I[id]&&I[id].lv===40&&I[id].tier===7&&I[id].dg&&I[id].roll0));
ok('a base level-40 sword is stronger than the level-30 one',I['sword8'].atk>I['sword7'].atk);
{ const id=x.dgGearId40('sword',2,0,'~a57'); const it=I[id];
  ok('a rolled level-40 id becomes a record with its 1 line',!!it&&it.roll.length===1&&it.roll[0].stat==='atk'&&it.rcode==='~a57'&&it.atk===I['sword8-e'].atk); }
ok('junk ids are not items',!I['sword8~a57a12']&&!I['sword7~a57']&&!I['helmet1~a57']&&!I['sword8~z57']&&!I['sword8~a57k12']&&!I['sword8~a57k12c90']&&!I['sword9~a57']&&!I['sword10~a57k12']&&!I['ring9-fire~a57k12c90']);
{ const w=x.rlLinesOf('~a99g99h99','weapon'), a=x.rlLinesOf('~a99g99h99','armor'); ok('weapons roll higher offence than armour',w.every((l,i)=>l.v>a[i].v)); 
  const d=x.rlLinesOf('~b99c99l99','weapon'), e=x.rlLinesOf('~b99c99l99','armor'); ok('armour rolls higher defence than weapons',e.slice(0,2).every((l,i)=>l.v>d[i].v)&&e[2].v<d[2].v); }
{ const its=[1,2,3,4,5].map(()=>({lv:40,roll:[{stat:'cdr',v:0.08}]})); ok('cooldown reduction from gear is capped at 40%',x.rlSumOf(its,'cdr',40)===0.4&&x.rlSumOf(its,'cdr',39)===0); }
ok('enhancing keeps the roll; a rolled piece does not merge',x.dgEnhanceNext('sword8-r+1~a57')==='sword8-r+2~a57'&&x.mergedId('sword8~a57')===null&&x.mergedId('sword8')==='sword8-r');
ok('the cooldown formula takes the gear reduction',Math.abs(x.abilityCd({cd:10,id:'x'},{lv:{}},50,'warrior',0.3)-7)<1e-9);
ok('saves keep a good rolled piece and drop a bad one',x.sanitizeGear({inv:['sword1','sword8~a57','sword8~z57','sword9~a57','sword9~a57k12'],eq:{weapon:'sword1'},rsw:5,rsa:-3,dgv:1},'warrior').inv.join()==='sword1,sword8~a57,sword9~a57k12'&&x.sanitizeGear({rsw:5,rsa:-3},'warrior').rsw===5);
W.join('a',{name:'A',look:{cls:'warrior'},save:{level:50}}); tick(2); const A=W.players.get('a');
A.gear.inv.push('sword8-e','helmet8-l','sword7-u','ring-fire','sword2'); A.gear.rsw=0; A.gear.rsa=0; A.gear.rsr=0; A.gear.dgv=1;
W.receive('a',{t:'sac',id:'sword7-u'}); W.receive('a',{t:'sac',id:'helmet8-l'}); W.receive('a',{t:'sac',id:'sword2'}); tick(1);
ok('sacrificing: unique weapon 8 weapon stones, legendary level-40 armour 24 armour stones (16 x1.5), low gear refused',A.gear.rsw===8&&A.gear.rsa===24&&A.gear.inv.includes('sword2')&&!A.gear.inv.includes('sword7-u'));
W.receive('a',{t:'reroll',id:'sword8-e'}); tick(1);
{ const w=A.gear.inv.find(i=>i.startsWith('sword8-e~')); ok('first roll costs one weapon stone and adds its one line',!!w&&A.gear.rsw===7&&I[w].roll.length===1);
  const old=w; W.receive('a',{t:'reroll',id:w}); tick(1); const w2=A.gear.inv.find(i=>i.startsWith('sword8-e~')); ok('reroll replaces the lines for another stone',A.gear.rsw===6&&w2&&!A.gear.inv.includes(old)||w2===old);
  A.gear.rsa=0; A.gear.inv.push('helmet8'); W.receive('a',{t:'reroll',id:'helmet8'}); tick(1); ok('no stone, no roll',A.gear.inv.includes('helmet8'));
  W.receive('a',{t:'equip',id:w2}); tick(1); ok('wearing it works at level 40+',A.gear.eq.weapon===w2); }
A.level=60; { const id=x.dgGearId40('sword',0,0,'~a99b99c99',10); A.gear.inv.push(id); W.receive('a',{t:'equip',id}); tick(1);
  const base=3*0+0; x.recalcP(A); ok('a level-60 piece (3 lines): the attack, health and defense lines raise the stats (rl sums on the player)',A.rl.atk>0.15&&A.rl.hp>=0.1&&A.rl.def>=0.1); }
// level-40 rings and the Ring Reroll Stone (gear.rsr)
ok('245 unrolled level-40 rings, lv 40, tier 7, unrolled',x.dgAllRingIds40().length===245&&x.dgAllRingIds40().every(id=>I[id]&&I[id].kind==='ring'&&I[id].lv===40&&I[id].tier===7&&I[id].roll0&&!I[id].roll));
ok('a level-40 ring is stronger than the level-30 one, and the old ring ids are unchanged',I['ring8-fire'].ratk>I['ring-fire'].ratk&&I['ring-fire'].lv===30&&!I['ring-fire'].roll0);
{ const id=x.dgRingId40('dark',3,2,'~g50'), it=I[id]; ok('a rolled ring id becomes a record with 1 line',!!it&&it.kind==='ring'&&it.el==='dark'&&it.n===2&&it.roll.length===1&&it.roll[0].stat==='crit'&&it.ratk>I['ring8-dark-u'].ratk);
  ok('enhancing a ring keeps its roll; a rolled ring does not merge',x.dgEnhanceNext(id)==='ring8-dark-u+3~g50'&&x.mergedId(id)===null&&x.mergedId('ring8-dark')==='ring8-dark-r'); }
ok('junk ring ids are not items',!I['ring-fire~a57k12c90']&&!I['ring8-fire~a57a12']&&!I['ring8-wind']&&!I['ring8-fire-e+9']);
ok('a ring takes three lines, offence a little higher than a plain stat',x.rlLinesOf('~a99g99h99','ring').length===3&&x.rlLinesOf('~a99g99h99','ring')[0].v>x.rlLinesOf('~a99g99h99','armor')[0].v);
A.gear.rsr=0; A.gear.inv.push('ring-water-r','ring8-fire-u','ring-fire-e+2'); W.receive('a',{t:'sac',id:'ring-water-r'}); W.receive('a',{t:'sac',id:'ring8-fire-u'}); tick(1);
ok('sacrificing rings pays ring stones: rare 2 + level-40 unique 12 (8 x1.5)',A.gear.rsr===14&&A.gear.rsw>=0&&!A.gear.inv.includes('ring-water-r')&&!A.gear.inv.includes('ring8-fire-u'));
A.gear.inv.push('ring8-earth-e'); W.receive('a',{t:'reroll',id:'ring8-earth-e'}); tick(1);
{ const r=A.gear.inv.find(i=>i.startsWith('ring8-earth-e~')); ok('first ring roll costs one ring stone and adds one line',!!r&&A.gear.rsr===13&&I[r].roll.length===1);
  const rsw=A.gear.rsw; W.receive('a',{t:'reroll',id:r}); tick(1); ok('reroll costs another ring stone and no other kind',A.gear.rsr===12&&A.gear.rsw===rsw);
  A.gear.rsr=0; A.gear.inv.push('ring8-air'); W.receive('a',{t:'reroll',id:'ring8-air'}); tick(1); ok('no ring stone, no roll',A.gear.inv.includes('ring8-air'));
  A.gear.rsr=5; W.receive('a',{t:'reroll',id:'ring-fire'}); tick(1); ok('a level-30 ring cannot be rolled',A.gear.rsr===5&&A.gear.inv.includes('ring-fire')); }
{ const id=x.dgRingId40('basic',4,0,'~a99b99c99',10); A.gear.inv.push(id); W.receive('a',{t:'equip',id}); tick(1); x.recalcP(A);
  ok('a worn rolled ring adds its lines to the player sums',A.gear.eq.ring===id&&A.rl.atk>0.1&&A.rl.hp>0.1); }
ok('saves keep ring stones and a good rolled ring, drop a bad one',(()=>{ const g=x.sanitizeGear({inv:['ring8-fire~a57','ring8-fire~z57'],eq:{},rsr:7,dgv:1},'warrior'); return g.rsr===7&&g.inv.includes('ring8-fire~a57')&&!g.inv.includes('ring8-fire~z57')&&x.sanitizeGear({rsr:-3},'warrior').rsr===0; })());

// ---- dungeon revamp D2: levels 50 / 60, lines by level, the migration, sacrifice by level, rerolls ----
{ const L=t=>x.rlLinesFor(t);
  ok('lines by level digit: 7 none, 8 one, 9 two, 10 three',L(7)===0&&L(8)===1&&L(9)===2&&L(10)===3);
  const k=(id)=>{ const q=x.dgParse(id); return q&&q.t; };
  ok('ids of levels 50 and 60 parse for gear, rings and pendants (digit 9 / 10)',k('sword9-e+3')===9&&k('helmet10-l')===10&&k('ring9-fire')===9&&k('ring10-basic-r+2')===10&&k('pendant9-xp')===9&&k('pendant10-critdmg-u')===10&&k('ring-fire')===7&&k('talisman8-atk')===8&&!x.dgParse('talisman9-atk'));
  ok('lv of a record: 30 / 40 / 50 / 60',[I['sword7'],I['sword8'],I['sword9'],I['sword10']].map(i=>i.lv).join()==='30,40,50,60'&&[I['ring-fire'],I['ring8-fire'],I['ring9-fire'],I['ring10-fire']].map(i=>i.lv).join()==='30,40,50,60'&&I['pendant9-xp'].lv===50&&I['pendant10-xp'].lv===60);
  ok('stats x1.25 per step above level 40 (weapon, armour, ring, pendant)',I['sword9'].atk===Math.round(I['sword8'].atk*1.25)&&I['sword10'].atk===Math.round(I['sword8'].atk*1.5625)&&I['top9'].hp===Math.round(I['top8'].hp*1.25)&&I['top10'].hp===Math.round(I['top8'].hp*1.5625)&&I['ring9-fire'].ratk===Math.round(I['ring8-fire'].ratk*1.25)&&I['ring10-fire'].ratk>I['ring9-fire'].ratk&&Math.abs(I['pendant9-xp'].v/I['pendant8-xp'].v-1.25)<0.001&&I['pendant10-xp'].v>I['pendant9-xp'].v&&I['top9'].def>I['top8'].def);
  ok('the all-lists for levels 50 and 60 are items (245 gear, 245 rings, 175 pendants each), unrolled',[9,10].every(t=>x.dgAllIds40(t).length===245&&x.dgAllRingIds40(t).length===245&&x.dgAllPendantIds40(t).length===175&&[...x.dgAllIds40(t),...x.dgAllRingIds40(t),...x.dgAllPendantIds40(t)].every(id=>I[id]&&I[id].dg&&I[id].roll0&&!I[id].roll&&I[id].lv===30+(t-7)*10)));
  const good={'sword8':'~a50','sword9':'~a50b20','sword10':'~a50b20c70','ring9-fire':'~g10l20','pendant10-xp':'~a10b20c30','pendant8-coin':'~d10'};
  ok('a code is accepted only with its level\'s line count',Object.entries(good).every(([b,c])=>!!I[b+c]&&I[b+c].roll.length===x.rlLinesFor(x.dgParse(b).t))&&!I['sword8~a50b20']&&!I['sword9~a50']&&!I['sword9~a50b20c70']&&!I['sword10~a50b20']&&!I['ring10-fire~g10']&&!I['pendant9-xp~a10b20c30']&&!I['sword7~a50']&&!I['ring-fire~a50']);
  ok('a duplicate stat in a code is refused at every level',!I['sword9~a50a20']&&!I['sword10~a50b20a30']);
  // reroll: all lines replaced with the level's count
  const B=new Set(); A.level=60; A.gear.rsw=20; A.gear.rsa=20; A.gear.rsr=20; A.gear.inv.length=0; A.gear.inv.push('sword9-r','helmet10-e','ring9-fire','pendant10-xp-r','sword8-u~a10');
  for(const id of ['sword9-r','helmet10-e','ring9-fire','pendant10-xp-r']) W.receive('a',{t:'reroll',id}); tick(1);
  const out=A.gear.inv.filter(i=>/~/.test(i)&&!/a10$/.test(i));
  ok('a roll on level 50 gives two lines, on level 60 three, on a ring/pendant likewise',out.length===4&&out.every(i=>I[i]&&I[i].roll.length===x.rlLinesFor(x.dgParse(i).t))&&out.some(i=>/^sword9/.test(i))&&out.some(i=>/^helmet10/.test(i)),out.join());
  const w9=out.find(i=>/^sword9/.test(i)), had=w9; W.receive('a',{t:'reroll',id:w9}); tick(1); const w9b=A.gear.inv.find(i=>/^sword9-r~/.test(i));
  ok('a reroll replaces all the lines and keeps the count',!!w9b&&I[w9b].roll.length===2);
  // sacrifice by level
  A.gear.inv.length=0; A.gear.inv.push('sword9-u','sword10-u','sword7-u','sword8-u','helmet10','ring9-fire-r','pendant10-xp-l'); A.gear.rsw=0; A.gear.rsa=0; A.gear.rsr=0;
  for(const id of ['sword7-u','sword8-u','sword9-u','sword10-u','helmet10','ring9-fire-r','pendant10-xp-l']) W.receive('a',{t:'sac',id}); tick(1);
  ok('sacrifice pays x1 / 1.5 / 2 / 3 by level: unique weapons 8 + 12 + 16 + 24 = 60',A.gear.rsw===60,A.gear.rsw);
  ok('...armour common level 60 pays 3, a rare level-50 ring 4 and a legendary level-60 pendant 48 (rsr 52)',A.gear.rsa===3&&A.gear.rsr===52,A.gear.rsa+' '+A.gear.rsr);
  ok('rlSacFor: 1 / 2 / 2 / 3 for commons at 30 / 40 / 50 / 60',[I['sword7'],I['sword8'],I['sword9'],I['sword10']].map(i=>x.rlSacFor(i)).join()==='1,2,2,3');
}
// ---- the migration (gear.dgv) ----
{ const raw={inv:['sword1','sword8-e+2~a57k12c90','ring8-fire~g50h10l90','pendant8-xp-r~d10e20f30','helmet8~a1b','sword9~a10b20'],eq:{weapon:'sword8-e+2~a57k12c90',ring:'ring8-fire~g50h10l90'},psh:[{id:'helmet8-u~b10c20d30',price:5}],rsw:1};
  raw.inv[4]='helmet8~b10c20d30';
  const g=x.sanitizeGear(JSON.parse(JSON.stringify(raw)),'warrior');
  ok('an old three-line level-40 piece keeps its first line: bag, worn and the player shop; nothing is dropped',g.inv.includes('sword8-e+2~a57')&&g.inv.includes('ring8-fire~g50')&&g.inv.includes('pendant8-xp-r~d10')&&g.inv.includes('helmet8~b10')&&g.eq.weapon==='sword8-e+2~a57'&&g.eq.ring==='ring8-fire~g50'&&g.psh.length===1&&g.psh[0].id==='helmet8-u~b10'&&g.dgv===1&&g.inv.includes('sword9~a10b20'),g.inv.join()+' '+JSON.stringify(g.psh));
  const g2=x.sanitizeGear(g,'warrior'); ok('a second pass does nothing (version guard: a level-60 piece keeps its three lines)',g2.inv.join()===g.inv.join());
  const g3=x.sanitizeGear({inv:['sword1','sword10~a10b20c30'],eq:{weapon:'sword1'},dgv:1},'warrior'); ok('a save with gear.dgv is never walked: level-60 three lines stay',g3.inv.includes('sword10~a10b20c30'));
  const g4=x.sanitizeGear({inv:['sword1','sword10~a10b20c30'],eq:{weapon:'sword1'}},'warrior'); ok('a save without gear.dgv never cuts a level-50 / 60 piece (only digit-8 ids are old level-40 ones)',g4.inv.includes('sword10~a10b20c30')); }
// ---- clears: piece counts, eq split, fixed rarity over many seeded clears ----
{ const mul=a=>()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  const bad=[]; const rar=[0,0,0,0,0]; let total=0;
  for(const T of x.DG_TIERS){ const rnd=mul(100+T.t), N=6000, cnt={}, eqn=[0,0,0,0];
    for(let i=0;i<N;i++){ const ids=x.dgClearRewards('hollowroots',rnd,T.t); cnt[ids.length]=(cnt[ids.length]||0)+1;
      if(ids.length<T.n[0]||ids.length>T.n[1]) bad.push('count '+T.t);
      for(const id of ids){ const q=x.dgParse(id), it=I[id]; if(!q||q.n!==0||q.roll||it.kind!=='weapon') bad.push('id '+id); eqn[(q?q.t:7)-7]++; rar[it.rar]++; total++; } }
    const pieces=eqn.reduce((a,b)=>a+b,0);
    for(let e=0;e<4;e++){ const p=T.eq[e]/100, sd=Math.sqrt(pieces*p*(1-p))+1; if(Math.abs(eqn[e]-pieces*p)>5*sd) bad.push('tier '+T.t+' eq'+e+' '+eqn[e]+'/'+pieces); if(T.eq[e]===0&&eqn[e]) bad.push('tier '+T.t+' pays eq'+e); }
    const exp=(T.n[0]+T.n[1])/2; if(Math.abs(pieces/N-exp)>0.05) bad.push('tier '+T.t+' mean pieces '+(pieces/N)); if(T.n[1]>T.n[0]&&Object.keys(cnt).length!==T.n[1]-T.n[0]+1) bad.push('tier '+T.t+' counts '+JSON.stringify(cnt)); }
  const ODD=[0.65,0.25,0.07,0.025,0.005]; for(let r=0;r<5;r++){ const p=ODD[r], sd=Math.sqrt(total*p*(1-p)); if(Math.abs(rar[r]-total*p)>5*sd) bad.push('rarity '+r+' '+rar[r]/total); }
  ok('over many seeded clears of every tier: the piece count stays in DG_TIERS[t].n (and every count comes up), the eq level split follows DG_TIERS[t].eq (a 0% level never pays), every piece is a +0 unrolled piece, the rarity is the fixed 65 / 25 / 7 / 2.5 / 0.5',bad.length===0,bad.slice(0,4).join('; ')); 
  ok('dungeons 5-8 pay their current kinds at the rolled level',['sandglass','gloamvault','termitecathedral','cenote'].every((th,i)=>{ const rr=mul(9+i); for(let k=0;k<400;k++){ const ids=x.dgClearRewards(th,rr,10); if(!ids.length||ids.some(id=>{ const q=x.dgParse(id); return !q||q.t<9||I[id].kind!==({sandglass:'weapon',gloamvault:'armor',termitecathedral:'ring',cenote:'pendant'})[th]; })) return false; } return true; })&&x.dgClearRewards('nope',null,3).length===0); }
process.exit(fails?1:0);
