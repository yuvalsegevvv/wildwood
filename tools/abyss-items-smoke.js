// The Abyss's roll items (B11: shared/abyss-items.js, server/abyss/items.js, the markers in shared/rolls.js): the roll code's '!' (Ascendant Prism) and '*' (Void Anchor) markers: parse / format round trip for
// every combination, bad codes, the grade rule (prism: +10 capped at 99, 99 about 11% of the rolls, never below 10), the lock through 50 rerolls, moving it, the refusals, and every path that carries an id
// (enhance, merge, reroll, sacrifice, player shops, save sanitizing, the item record). Usage: node tools/abyss-items-smoke.js
const {loadServer}=require('./load'), {memoryAccounts}=require('./headless');
const {store,auth}=memoryAccounts(); const sent=[];
const {api:W,x}=loadServer({dev:true,store,auth,send(to,m){ sent.push([to,m]); },broadcast(){}},['ITEM','RL_STATS','RL_CODE_RE','rlRoll','rlParseFull','rlParseCode','rlFormatCode','rlPrismCode','rlLockCode','rlLinesOf','rlGradeQ','dgParse','dgIdOfQ','dgEnhanceNext','mergedId','dgRaisedId','abPrismWhy','abLockWhy','VIL','sanitizeGear']);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i!==undefined?'  ('+i+')':'')); if(!c) fails++; };
const tick=n=>{ for(let i=0;i<n;i++) W.tick(0.05); }, J=JSON.stringify, I=x.ITEM;
// a seeded rnd (mulberry32) so a failing run repeats
const seeded=a=>()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
// ---- the format
const combos=[]; for(const n of [1,2,3]) for(const g of [0,1]) for(let l=-1;l<n;l++){ if(l>=0&&n<2) continue; combos.push([n,g,l]); }
{ let bad=0; for(const [n,g,l] of combos){ const lines=['a','g','m'].slice(0,n).map((k,i)=>({k,q:i===1?5:i===2?99:57})); const c=x.rlFormatCode(lines,g,l), P=x.rlParseFull(c,n);
    if(!P||P.g!==g||P.lock!==l||P.lines.length!==n||x.rlFormatCode(P.lines.map(o=>({k:o.s.k,q:o.q})),P.g,P.lock)!==c||x.rlParseCode(c,n).length!==n) bad++; }
  ok('format / parse round trip for every marker combination ('+combos.length+')',bad===0&&combos.length===2*(1+3+4)-0*1||bad===0,bad+' bad of '+combos.length); }
ok('the spellings',x.rlFormatCode([{k:'a',q:57},{k:'k',q:12},{k:'c',q:90}],1,0)==='~!*a57k12c90'&&x.rlFormatCode([{k:'a',q:57},{k:'k',q:12}],0,1)==='~a57*k12'&&x.rlFormatCode([{k:'a',q:5}],1,-1)==='~!a05');
for(const bad of ['~!!a57','~a57!','~*a57k12*c90','~*a57*k12','~a57k12*','~*a57','~!*a57','~a57k12c90a10','~**a57k12','~*!a57k12','~!','~*','~a57*','~z57','~a5','~a57k1','~a57k12c90m10','~!*a57k12c90m10','~ !a57','!~a57','~a57 k12'])
  ok('bad code rejected: '+bad,x.rlParseFull(bad)===null&&x.rlParseFull(bad)===null);
ok('wrong count rejected',x.rlParseFull('~!*a57k12',3)===null&&x.rlParseFull('~!a57k12c90',2)===null&&x.rlParseFull('~a57',2)===null&&!!x.rlParseFull('~!*a57k12',2));
ok('an old unmarked code parses as before',J(x.rlParseCode('~a57k12c90').map(l=>[l.s.k,l.q]))==='[["a",57],["k",12],["c",90]]'&&x.rlParseFull('~a57k12c90').g===0&&x.rlParseFull('~a57k12c90').lock===-1);
// ids: the item Proxy makes one record per spelling and only canonical spellings are items
ok('ids with markers are items (level 40 / 50 / 60)',!!I['sword8~!a57']&&!!I['sword9~!*a57k12']&&!!I['helmet10-e+2~!k12*c90m05']&&!I['sword8~*a57']&&!I['sword9~*a57*k12']&&!I['sword9~!!a57k12']&&!I['sword7~!a57']&&!I['sword9~a57k12*']);
{ const it=I['sword9-e+1~!*a57k12']; ok('the record: prism flag, locked index, locked line marked, same stats as unmarked',it.rprism===1&&it.rlock===0&&it.roll[0].lock===true&&!it.roll[1].lock&&it.atk===I['sword9-e+1'].atk&&it.rcode==='~!*a57k12');
  const u=I['sword9~a57k12']; ok('an old unmarked piece is unchanged',u.rprism===0&&u.rlock===-1&&u.roll.every(l=>!l.lock)); ok('one record a id (the Proxy keeps it)',I['sword9-e+1~!*a57k12']===it); }
ok('dgParse carries the markers in q.roll',x.dgParse('sword9-r+2~!a57*k12').roll==='~!a57*k12');
// ---- the grade rule
{ const rnd=seeded(7), N=20000; let hi=0, lo=99, top=0; for(let i=0;i<N;i++){ const c=x.rlRoll(rnd,1,null,1), P=x.rlParseFull(c,1); if(!P||!P.g||P.lock!==-1) ok('prism roll parses',false,c); const q=P.lines[0].q; if(q<lo) lo=q; if(q===99) top++; }
  ok('prism: no grade under 10 (stored) in '+N+' rolls',lo>=10,lo); ok('prism: 99 comes up about 11% of the time',Math.abs(top/N-0.11)<0.015,(top/N).toFixed(4));
  let n0=0; for(let i=0;i<N;i++){ if(x.rlParseFull(x.rlRoll(rnd,1)).lines[0].q===99) n0++; } ok('no prism: 99 about 1%, and the code has no marker',Math.abs(n0/N-0.01)<0.006&&x.rlRoll(seeded(3),2).indexOf('!')<0); }
ok('rlGradeQ: the extremes',x.rlGradeQ(()=>0,1)===10&&x.rlGradeQ(()=>0.99999,1)===99&&x.rlGradeQ(()=>0,0)===0&&x.rlGradeQ(()=>0.9,1)===99);
// applying a prism to the current lines
ok('rlPrismCode: every line +10 capped at 99, the lock kept, a second prism refused',x.rlPrismCode('~a57*k95c03')==='~!a67*k99c13'&&x.rlPrismCode('~!a57')===null&&x.rlPrismCode('junk')===null&&x.rlPrismCode('~a00')==='~!a10');
ok('rlLockCode: the lock moves, the same line / a 1-line piece / a bad index refused',x.rlLockCode('~a57k12',1)==='~a57*k12'&&x.rlLockCode('~*a57k12',1)==='~a57*k12'&&x.rlLockCode('~*a57k12',0)===null&&x.rlLockCode('~a57',0)===null&&x.rlLockCode('~a57k12',2)===null&&x.rlLockCode('~a57k12',-1)===null&&x.rlLockCode('~a57k12',0.5)===null&&x.rlLockCode('~!a57k12',0)==='~!*a57k12');
// the lock through rerolls: the line keeps its stat, grade and position, the others never take its stat
{ const rnd=seeded(11); let code='~!*a57k12c90'.replace('c90',''), bad=0; code='~k12*a57c90'; for(let i=0;i<50;i++){ const P=x.rlParseFull(code,3), keep={k:P.lines[P.lock].s.k,q:P.lines[P.lock].q,i:P.lock}; code=x.rlRoll(rnd,3,keep,P.g); const R=x.rlParseFull(code,3);
    if(!R||R.lock!==1||R.lines[1].s.k!=='a'||R.lines[1].q!==57||R.lines.filter((l,j)=>j!==1&&l.s.k==='a').length||new Set(R.lines.map(l=>l.s.k)).size!==3) bad++; }
  ok('a lock keeps its stat, grade and position through 50 rerolls, nothing else takes its stat',bad===0,bad); 
  let seen=new Set(), badP=0; for(let i=0;i<400;i++){ const c=x.rlRoll(rnd,2,{k:'m',q:1,i:1},1), R=x.rlParseFull(c,2); if(!R||R.lines[1].s.k!=='m'||R.lines[0].s.k==='m'||R.lines[0].q<10||!R.g) badP++; seen.add(R&&R.lines[0].s.k); }
  ok('lock + prism together: the other line is never the locked stat, never below 10; all 12 other stats appear',badP===0&&seen.size===12,[badP,seen.size]); }
// ---- paths: enhance, merge
ok('tempering keeps both markers',x.dgEnhanceNext('sword9-e+1~!*a57k12')==='sword9-e+2~!*a57k12'&&I[x.dgEnhanceNext('shield9-hp~a57*k12')]&&x.dgEnhanceNext('helmet10-r+3~!a57k12*c90')==='helmet10-r+4~!a57k12*c90');
ok('a marked piece does not merge (rolled pieces never do)',x.mergedId('sword9-e~!*a57k12')===null&&x.dgRaisedId(I['sword9-e~!a57k12'],3)===null);
// ---- the server paths
(async()=>{
  const wait=()=>new Promise(r=>setTimeout(r,20));
  W.join('a',{acct:'a'.repeat(32),name:'Ann',look:{cls:'warrior'},save:{level:60}}); W.join('b',{acct:'b'.repeat(32),name:'Bob',look:{cls:'mage'},save:{level:40}}); await wait(); tick(2);
  const A=W.players.get('a'), B=W.players.get('b'); for(const q of [A,B]){ q.user='x'+q.name; q.vbGrace=1e12; if(x.VIL){ q.x=x.VIL.x; q.z=x.VIL.z; } }
  const ab=()=>A.gear.ab, send=(m,p='a')=>W.receive(p,Object.assign({t:'abyss'},m)), has=id=>A.gear.inv.includes(id);
  A.gear.ab={top:5,best:0,clears:[0,0,0,0,0,0],as:0,lock:0,prism:0,sh:{d:0,n:{}},run:null}; A.gear.inv=['sword9-e+1~a57k12','helmet10-r~a10k20c30','sword8-e~a57','sword8-e','sword9-e']; A.gear.rsw=0; A.gear.rsa=60; A.gear.eq={};
  const snap=()=>J([A.gear.inv,A.gear.eq,A.gear.ab.lock,A.gear.ab.prism,A.gear.rsw,A.gear.rsa]);
  // refusals first: no item
  let b=snap(); send({a:'prism',id:'sword9-e+1~a57k12'}); send({a:'lock',id:'sword9-e+1~a57k12',i:0}); ok('no Prism, no Anchor: nothing changes',snap()===b);
  ab().prism=3; ab().lock=3; b=snap();
  for(const id of ['__proto__','constructor','toString','',null,undefined,7,{},[],'sword9-e~a57k12','nope','helmet10-r~!a10k20c30']) { try{ send({a:'prism',id}); send({a:'lock',id,i:0}); }catch(e){ ok('throws on id '+J(id),false,e.message); } }
  ok('bad ids, pieces not owned, a piece that already has the prism: refused, nothing charged',snap()===b);
  send({a:'prism',id:'sword8-e'}); send({a:'prism',id:'sword9-e'}); ok('an unrolled piece cannot take a prism (no lines)',snap()===b);
  send({a:'lock',id:'sword8-e~a57',i:0}); ok('a 1-line piece cannot take an Anchor',snap()===b);
  for(const i of [-1,2,3,0.5,'0','1',null,undefined,NaN,Infinity,{},[],1e9,true]){ try{ send({a:'lock',id:'sword9-e+1~a57k12',i}); }catch(e){ ok('throws on i '+J(i),false,e.message); } }
  ok('i out of range or not an integer: refused, nothing charged',J([ab().lock,ab().prism])==='[3,3]'&&has('sword9-e+1~a57k12')&&!A.gear.inv.some(s=>/[*!]/.test(s)||s.indexOf('~!')>0));
  // the Prism
  send({a:'prism',id:'helmet10-r~a10k20c30'}); ok('a Prism: +10 on every line, one Prism spent, the piece replaced in the bag',has('helmet10-r~!a20k30c40')&&!has('helmet10-r~a10k20c30')&&ab().prism===2&&A.gear.inv.length===5);
  b=snap(); send({a:'prism',id:'helmet10-r~!a20k30c40'}); ok('a second Prism on the same piece: refused',snap()===b);
  ok('the record shows it',I['helmet10-r~!a20k30c40'].rprism===1&&I['helmet10-r~!a20k30c40'].roll[0].q===20);
  // the Anchor and moving it
  send({a:'lock',id:'helmet10-r~!a20k30c40',i:2}); ok('an Anchor locks line 2 (the marker before it), one Anchor spent',has('helmet10-r~!a20k30*c40')&&ab().lock===2);
  b=snap(); send({a:'lock',id:'helmet10-r~!a20k30*c40',i:2}); ok('the same line again: refused',snap()===b);
  send({a:'lock',id:'helmet10-r~!a20k30*c40',i:0}); ok('another Anchor moves the lock (costs one more)',has('helmet10-r~!*a20k30c40')&&ab().lock===1&&!has('helmet10-r~!a20k30*c40'));
  // reroll keeps both; costs a normal stone
  A.gear.rsa=60; let id='helmet10-r~!*a20k30c40'; let bad=0, rolls=0; for(let i=0;i<50;i++){ const nid=(()=>{ send({a:'noop'}); W.receive('a',{t:'reroll',id}); return A.gear.inv.find(s=>s.startsWith('helmet10-r~')); })(); if(!nid||nid===id&&false){ bad++; break; } const R=x.rlParseFull(nid.slice(nid.indexOf('~')),3); if(!R||!R.g||R.lock!==0||R.lines[0].s.k!=='a'||R.lines[0].q!==20||R.lines.slice(1).some(l=>l.s.k==='a'||l.q<10)) bad++; id=nid; rolls++; }
  ok('50 rerolls through rlRollP keep the prism, the locked line (stat, grade, place), never roll its stat, grades >= 10',bad===0&&rolls===50&&A.gear.rsa===10,[bad,rolls,A.gear.rsa]);
  A.gear.inv=A.gear.inv.filter(s=>!s.startsWith('helmet10-r'));
  // worn: an Anchor / a Prism on a worn piece; the slot follows
  A.gear.inv.push('sword9-e~a57k12'); W.receive('a',{t:'equip',id:'sword9-e~a57k12'}); tick(1); ok('wearing a level-50 piece (precondition)',A.gear.eq.weapon==='sword9-e~a57k12');
  send({a:'prism',id:'sword9-e~a57k12'}); ok('a worn piece (no spare): the slot and the bag follow',A.gear.eq.weapon==='sword9-e~!a67k22'&&has('sword9-e~!a67k22')&&!has('sword9-e~a57k12'),A.gear.eq.weapon);
  send({a:'lock',id:'sword9-e~!a67k22',i:1}); ok('...and the Anchor too, recalculated through gearChangedP',A.gear.eq.weapon==='sword9-e~!a67*k22'&&I[A.gear.eq.weapon].rlock===1);
  // spare + worn copy: the bag copy is used unless worn:true
  A.gear.inv.push('sword9-e~!a67*k22'); send({a:'prism',id:'sword9-e~!a67*k22'}); 
  A.gear.inv.push('sword9-e~a40k50'); A.gear.eq.weapon='sword9-e~a40k50'; A.gear.inv.push('sword9-e~a40k50'); send({a:'prism',id:'sword9-e~a40k50'});
  ok('a spare in the bag is used before the worn copy',A.gear.eq.weapon==='sword9-e~a40k50'&&A.gear.inv.includes('sword9-e~!a50k60'));
  ab().prism=5; send({a:'prism',id:'sword9-e~a40k50',worn:true}); ok('worn:true takes the worn copy',A.gear.eq.weapon==='sword9-e~!a50k60',J([A.gear.eq,A.gear.inv,A.gear.ab]));
  // sacrifice works and pays as normal on marked pieces
  A.gear.eq={}; A.gear.inv=['sword9-e~!*a57k12','helmet10-r~!a10*k20c30']; A.gear.rsw=0; A.gear.rsa=0; W.receive('a',{t:'sac',id:'sword9-e~!*a57k12'}); W.receive('a',{t:'sac',id:'helmet10-r~!a10*k20c30'}); tick(1);
  ok('sacrificing marked pieces pays like unmarked (epic lv50 = 4 x2 = 8 weapon stones; rare lv60 = 2 x3 = 6 armour stones)',A.gear.rsw===8&&A.gear.rsa===6&&A.gear.inv.length===0,J([A.gear.rsw,A.gear.rsa,A.gear.inv]));
  // save sanitizing: inv and eq keep marked ids, drop bad spellings
  { const g=x.sanitizeGear({inv:['sword9-e~!*a57k12','sword9-e~*a57*k12','sword9-e~a57k12*','sword8-e~*a57','helmet10-r~!a10*k20c30','sword9-e~!!a57k12'],eq:{weapon:'sword9-e~!*a57k12'},ab:{prism:2,lock:1}},'warrior');
    ok('sanitizeGear keeps marked pieces (inv and eq) and drops the bad spellings',J(g.inv)==='["sword9-e~!*a57k12","helmet10-r~!a10*k20c30"]'&&g.eq.weapon==='sword9-e~!*a57k12'&&g.ab.prism===2&&g.ab.lock===1,J(g.inv));
    const g2=x.sanitizeGear({inv:['sword9-e~a57k12'],eq:{}},'warrior'); ok('an old unmarked piece survives unchanged',g2.inv.includes('sword9-e~a57k12')&&!g2.inv.some(s=>/[!*]/.test(s)),J(g2.inv)); }
  // player shops: list, escrow, buy, unlist keep the id
  A.gear.inv=['sword9-e~!*a57k12']; A.gear.coins=0; B.gear.coins=900; B.gear.inv=[];
  W.receive('a',{t:'pshop',a:'add',id:'sword9-e~!*a57k12',price:100}); ok('listing a marked piece: escrowed in gear.psh with its marker',A.gear.psh&&A.gear.psh.length===1&&A.gear.psh[0].id==='sword9-e~!*a57k12'&&A.gear.inv.length===0,J(A.gear.psh));
  { const g=x.sanitizeGear(JSON.parse(J(A.gear)),'warrior'); ok('the escrow survives a save round trip',g.psh&&g.psh.length===1&&g.psh[0].id==='sword9-e~!*a57k12',J(g.psh)); }
  W.receive('a',{t:'pshop',a:'open'}); tick(1); W.receive('b',{t:'pshop',a:'buy',name:'Ann',i:0,id:'sword9-e~!*a57k12',price:100}); tick(1);
  ok('buying: the buyer gets the same id, the coins move',B.gear.inv.length===1&&B.gear.inv[0]==='sword9-e~!*a57k12'&&B.gear.coins===800&&A.gear.coins===100,J([B.gear.inv,B.gear.coins]));
  // dev testing: still works
  ok('the rldev rolled pieces are still plain codes',(()=>{ W.receive('a',{t:'rldev',cmd:'rolled'}); return A.gear.inv.every(s=>!/[!*]/.test(s)); })());
  console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
})();
