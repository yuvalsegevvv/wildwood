// Headless test of the puzzle engine (shared/puzzles*.js, server/puzzles.js): every kind and difficulty generates, solves, is unique where it claims, fits its time budget; the server flow (open, solve, floor, renewal, chest, Sigils, track, scrolls, save cleaning).
// Usage: node tools/puzzles-smoke.js [--seeds N]   (N boards per kind and difficulty for the three smallest sizes; the big ones always get 3)
const {loadServer}=require('./load');
const {api:W,x}=loadServer({send(){}},['PZ_KINDS','PZ_KIND_IDS','PZ_BAD','PZ_DIFF','PZ_CHEST','PZ_SITES','PZ_SITE_BAD','PZ_PLACED','PZ_TRACK_COS','cpDef','PZ_KIND_OF','PZ_MIN_GAP','landAt','pzBoard','pzSeed','pzSwitch','pzChestP','pzTrackP','pzSanitize','pzTrackLevel','sanitizeGear','rlSolve','rlNb','pzFloorSecs','PZ_RENEW_MS','PZ_TRACK_LEVELS','PZ_SIG_LEVEL','S']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const N=+(process.argv[process.argv.indexOf('--seeds')+1])||12;
ok('no kind or site was left out as bad',x.PZ_BAD.length===0&&x.PZ_SITE_BAD.length===0,JSON.stringify(x.PZ_BAD)+JSON.stringify(x.PZ_SITE_BAD));
ok('all nine kinds are registered',['rootlines','iceslide','sudoku','akari','slither','bridges','mirrors','nonogram','sokoban'].every(k=>x.PZ_KIND_IDS.includes(k)),x.PZ_KIND_IDS.join(','));
// every kind and difficulty: generate, the stored solution passes the checker, the same seed gives the same board, a wrong answer fails
const budget={1:50,2:150,3:400,4:4000,5:20000}, budgetKind={slither:{5:90000},sokoban:{3:3000}};   // slither d5 (15x15) is the slow one, see docs/PUZZLES.md
const junk=[[],'',null,undefined,5,{},'x'.repeat(5000),new Array(5000).fill(1),new Array(300).fill([0,0,0]),[[1,2,3,4]],{length:9}];   // ms per board, a generous ceiling (the plan's 5 ms for trivial-normal is reported by the table below, not enforced)
for(const kind of x.PZ_KIND_IDS){
  for(let d=1;d<=5;d++){
    const n=kind==='slither'&&d===5?1:d>=4?3:N; let good=0, same=0, mx=0, tot=0, wrong=0, none=0;
    for(let i=1;i<=n;i++){
      const seed=x.pzSeed('smoke-'+kind,d,i), t0=Date.now(), B=x.pzBoard(kind,d,seed), dt=Date.now()-t0; mx=Math.max(mx,dt); tot+=dt;
      if(!B){ none++; continue; }
      if(x.PZ_KINDS[kind].check(B,B.sol)) good++;
      if(JSON.stringify(x.pzBoard(kind,d,seed).sol)===JSON.stringify(B.sol)) same++;
      let bad=0; for(const j of junk){ try{ if(x.PZ_KINDS[kind].check(B,j)) bad++; }catch(e){ bad++; } } if(!bad) wrong++;
    }
    ok(kind+' d'+d+': '+n+' boards generate, solve, repeat and reject junk answers',none===0&&good===n&&same===n&&wrong===n&&mx<=((budgetKind[kind]||{})[d]||budget[d]),'avg '+Math.round(tot/n)+' ms, max '+mx+' ms, missing '+none);
  }
}
// rootlines boards have ONE colouring (the generator's promise); verify with the solver
for(let d=1;d<=3;d++){ let uniq=0; for(let i=1;i<=6;i++){ const B=x.pzBoard('rootlines',d,x.pzSeed('uniq',d,i)); const r=x.rlSolve(B.w,B.h,B.ends,2,200000,x.rlNb(B.w,B.h)); if(!r.aborted&&r.sols===1) uniq++; } ok('rootlines d'+d+' boards are unique',uniq===6,uniq+'/6'); }
ok('a string from a client is never a kind',x.pzBoard('constructor',1,1)===null&&x.pzBoard('__proto__',1,1)===null&&x.pzBoard('rootlines',9,1)===null);
// server flow
x.pzSwitch(true);
// the placed stones: 41 in each of the seven lands (15 / 12 / 8 / 4 / 2), in their own land, spaced, each generating a board
{ const by={}; for(const s of x.PZ_SITES) if(s.id!=='tutorial'){ const land=s.id.split('-')[0]; (by[land]=by[land]||[]).push(s); }
  for(const land in x.PZ_KIND_OF){ const L=by[land]||[], cnt=d=>L.filter(s=>s.diff===d).length;
    ok(land+': 41 stones (15 trivial, 12 easy, 8 normal, 4 hard, 2 extreme)',cnt(1)===15&&cnt(2)===12&&cnt(3)===8&&cnt(4)===4&&cnt(5)===2,[1,2,3,4,5].map(cnt).join('/'));
    ok(land+': every stone is in its land, of its kind, and its board generates',L.every(s=>x.landAt(s.x,s.z)===land&&s.kind===x.PZ_KIND_OF[land]&&!!x.pzBoard(s.kind,s.diff,x.pzSeed(s.id,s.diff,1))));
    let close=0; for(let i=0;i<L.length;i++) for(let j=i+1;j<L.length;j++) if(Math.hypot(L[i].x-L[j].x,L[i].z-L[j].z)<20) close++;
    ok(land+': no two stones within 20 m',close===0,close+' pairs'); } }
W.join('a',{name:'Pia',look:{cls:'warrior'},save:{level:12}}); for(let i=0;i<4;i++) W.tick(0.5);
const p=W.players.get('a'), G=p.gear, out=[]; 
const io2={send(pid,m){ if(m.t==='pz') out.push(m); }}; 
const {api:W2,x:X2}=loadServer(io2,['PZ_SITES','pzBoard','PZ_KINDS','pzSwitch','pzFloorSecs']); X2.pzSwitch(true);
W2.join('a',{name:'Pia',look:{cls:'warrior'},save:{level:12}}); for(let i=0;i<4;i++) W2.tick(0.5);
const q=W2.players.get('a'), site=X2.PZ_SITES[0];
q.x=site.x; q.z=site.z; W2.receive('a',{t:'pz',a:'open',site:site.id});
const op=out.find(m=>m.a==='open');
ok('standing at the tutorial stone opens a first-time Rootlines board',op&&op.kind==='rootlines'&&op.diff===1&&op.first===true&&op.site===site.id,JSON.stringify(op));
const B=X2.pzBoard(op.kind,op.diff,op.seed);
const g0=q.gear.gem, c0=q.gear.coins;
W2.receive('a',{t:'pz',a:'solve',ans:[[0]]}); ok('a wrong answer is refused',out[out.length-1].a==='no');
W2.receive('a',{t:'pz',a:'solve',ans:B.sol}); const done=out.find(m=>m.a==='done');
ok('the right answer pays the chest and the first-solve gem',done&&done.ok&&q.gear.gem===g0+1&&q.gear.coins>c0&&done.chest&&done.chest.coins>0,JSON.stringify(done&&done.chest));
ok('the stone is dim for two hours afterwards',q.gear.pz[site.id].n===1&&q.gear.pz[site.id].t>Date.now()+7000000);
out.length=0; W2.receive('a',{t:'pz',a:'open',site:site.id}); ok('a dim stone does not open',out.length===1&&out[0].a==='no');
q.gear.pz[site.id].t=0; out.length=0; W2.receive('a',{t:'pz',a:'open',site:site.id});
const op2=out.find(m=>m.a==='open'); ok('it lights again with a new board and no first-time flag',op2&&op2.first===false&&op2.seed!==op.seed);
const g1=q.gear.gem; const B2=X2.pzBoard(op2.kind,op2.diff,op2.seed); q.pz.t0=0; W2.receive('a',{t:'pz',a:'solve',ans:B2.sol});
ok('a renewal pays no gems',q.gear.gem===g1);
out.length=0; q.x+=500; W2.receive('a',{t:'pz',a:'open',site:site.id}); ok('too far from the stone: refused',out[0]&&out[0].a==='no');
out.length=0; W2.receive('a',{t:'pz',a:'open',site:'constructor'}); ok('a string from a client is never a stone',out.length===0);
X2.pzSwitch(false); out.length=0; q.x=site.x; W2.receive('a',{t:'pz',a:'open',site:site.id}); ok('with PZ_ON off no stone opens',out[0]&&out[0].a==='no');
// the Sigil track: 40 different cosmetics, every one a real piece or cape or aura
{ const L=x.PZ_TRACK_COS.slice(1); ok('the Sigil track names 40 different cosmetics',L.length===40&&new Set(L).size===40&&L.every(k=>typeof k==='string'&&!!x.cpDef(k[0],k.slice(2))),L.filter(k=>!k||!x.cpDef(k[0],k.slice(2))).join(',')); }
// the Puzzle solver: 50 gems each, skips only a stone's first solve
X2.pzSwitch(true); q.gear.gem=500; q.gear.psv=0; out.length=0; W2.receive('a',{t:'pz',a:'buy',n:2});
ok('two solvers cost 100 gems',q.gear.psv===2&&q.gear.gem===400);
q.gear.pz={}; q.x=site.x; q.z=site.z; out.length=0; W2.receive('a',{t:'pz',a:'open',site:site.id}); W2.receive('a',{t:'pz',a:'skip'});
const sk=out.find(m=>m.a==='done'); ok('a solver skips a first solve and pays its gem and chest',sk&&sk.first&&sk.gems===1&&q.gear.psv===1&&q.gear.pz[site.id].n===1);
q.gear.pz[site.id].t=0; out.length=0; W2.receive('a',{t:'pz',a:'open',site:site.id}); W2.receive('a',{t:'pz',a:'skip'});
ok('...but not a renewal',!out.find(m=>m.a==='done')&&out.some(m=>m.a==='no')&&q.gear.psv===1);
q.gear.gem=10; W2.receive('a',{t:'pz',a:'buy',n:1}); ok('too few gems buys nothing',q.gear.psv===1&&q.gear.gem===10);
// chests: five tiers pay more as they climb; the track pays gems per 10 Sigils and a unique scroll every 50
let prev=0; for(let d=1;d<=5;d++){ const c0b=G.coins; x.pzChestP(p,d,20,d>=4); const dc=G.coins-c0b; ok('chest '+d+' pays '+x.PZ_CHEST[d].coins+'x coins',dc>prev,dc+' coins'); prev=dc; }
G.sig=0; G.sigPaid=0; const gm=G.gem; G.sig=100; const paid=x.pzTrackP(p);
ok('100 Sigils are 10 levels: 100 gems and two unique scrolls, paid once',paid.length===10&&G.gem-gm===100&&G.scr.u===2&&x.pzTrackP(p).length===0);
G.sig=99999; G.sigPaid=0; x.pzTrackP(p); ok('the track ends at its last level',G.sigPaid===x.PZ_TRACK_LEVELS);
// scrolls
G.inv.push('sword2'); G.scr.e=1; G.scr.u=0; W.receive('a',{t:'scroll',id:'sword2',to:'e'});
ok('an epic scroll turns a common sword into an epic one',G.inv.includes('sword2-e')&&G.scr.e===0);
W.receive('a',{t:'scroll',id:'sword2-e',to:'e'}); ok('...and not again without a scroll',G.inv.includes('sword2-e'));
G.scr.e=3; W.receive('a',{t:'scroll',id:'sword2-e',to:'e'}); ok('an epic scroll does not touch an epic piece',G.scr.e===3);
G.scr.u=1; W.receive('a',{t:'scroll',id:'sword2-e',to:'u'}); ok('a unique scroll turns it unique',G.inv.includes('sword2-u')&&G.scr.u===0);
G.scr.u=1; G.inv.push('sword3-l'); W.receive('a',{t:'scroll',id:'sword3-l',to:'u'}); ok('never down from legendary',G.scr.u===1&&G.inv.includes('sword3-l'));
// saves are cleaned
const c=x.sanitizeGear({pz:{a:{n:5,t:1},'__proto__':{n:1},'BAD ID':{n:1},ok1:{n:'x',t:-5}},sig:-4,sigPaid:99,scr:{e:99999,u:'z'}},'warrior');
ok('puzzle saves are cleaned',c.pz.a.n===5&&!('BAD ID' in c.pz)&&c.pz.ok1.n===0&&c.sig===0&&c.sigPaid===0&&c.scr.e===999&&c.scr.u===0,JSON.stringify(c.pz)+' '+c.sig);
console.log(fails?fails+' check(s) failed':'all passed'); process.exit(fails?1:0);
