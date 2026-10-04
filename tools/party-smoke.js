// Headless test of the parties (server/party.js), straight from src/ (no build): invites by name and by /invite, accepting, the cap of 4, one party at a time,
// the roster (pty) and its refresh when health changes, handing on the lead, kicking, leaving, a disconnect, declining, invites running out, and that party
// events reach the members only. One line per check.
// Usage: node tools/party-smoke.js
const {loadServer}=require('./load');
const got={};   // pid -> events received
const {api:W,x}=loadServer({dev:true,send(pid,m){ const c=JSON.parse(JSON.stringify(m)); if(c.t==='snap'&&c.ev) (got[pid]=got[pid]||[]).push(...c.ev); }},['PARTIES','PARTY_MAX','DG_MAX_PARTY','PARTY_INVITE_S','partyOf','hurtP','S']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++) W.tick(0.05); };
const P=pid=>W.players.get(pid);
const evs=(pid,kind)=>(got[pid]||[]).filter(e=>e[0]===kind);
const last=(pid,kind)=>{ const a=evs(pid,kind); return a[a.length-1]; };
const toasts=pid=>evs(pid,'toast').map(e=>e[2]).join(' | ');
const clear=()=>{ for(const k in got) got[k]=[]; };
const party=(pid,a,name)=>W.receive(pid,{t:'party',a,name});
const names={a:'Ash',b:'Bree',c:'Cole',d:'Dara',e:'Eli',f:'Fern',g:'Gil',h:'Hana'};
for(const pid in names) W.join(pid,{name:names[pid],look:{cls:'warrior'},save:{level:20}});
tick(3); clear();

ok('a party holds at most 4, the same cap as a dungeon run',x.PARTY_MAX===4&&x.DG_MAX_PARTY===x.PARTY_MAX);
party('a','invite','bree'); tick(3);
const iv=last('b','ptyi');
ok('an invite by name (any case) reaches only the invited player: ptyi [pid, from, name, seconds]',!!iv&&iv[1]==='b'&&iv[2]==='a'&&iv[3]==='Ash'&&iv[4]===x.PARTY_INVITE_S&&!evs('c','ptyi').length&&!evs('a','ptyi').length,JSON.stringify(iv));
ok('the inviter leads a new party at once (a party of one with an invite out)',!!x.partyOf(P('a'))&&x.partyOf(P('a')).lead==='a'&&!P('b').party);
clear(); party('b','accept'); tick(3);
{ const pa=x.partyOf(P('a')), r=last('a','pty'), rb=last('b','pty');
  ok('accepting joins: both in one party, A leads',!!pa&&x.partyOf(P('b'))===pa&&pa.mem.join()==='a,b'&&pa.lead==='a');
  ok('the roster goes to each member: pty [pid, leader, [[pid,name,hp,maxHp,level,dead,run]...]]',!!r&&r[1]==='a'&&r[2]==='a'&&r[3].length===2&&r[3][1][1]==='Bree'&&r[3][1][4]===20&&r[3][1][3]===P('b').maxHp&&r[3][1][5]===0&&r[3][1][6]===0&&!!rb&&rb[1]==='b',JSON.stringify(r));
  ok('and to nobody else (party events are for the members only)',!evs('c','pty').length&&!evs('d','pty').length); }
clear(); party('z','invite','ash'); party('a','invite','nobody'); tick(3);
ok('inviting a name nobody has says so',/Nobody called nobody/.test(toasts('a')));
clear(); party('b','invite','cole'); tick(3);
ok('only the leader invites',/Only the party leader/.test(toasts('b'))&&!evs('c','ptyi').length);
party('a','invite','cole'); party('a','invite','dara'); tick(2); party('c','accept'); party('d','accept'); tick(3); clear();
party('a','invite','eli'); tick(3);
ok('a fifth is refused: the party is full',/full/.test(toasts('a'))&&!evs('e','ptyi').length&&x.partyOf(P('a')).mem.length===4);
party('e','invite','fern'); tick(2); party('f','accept'); tick(2); clear();
party('a','leave'); tick(3); const leftRoster=last('a','pty'); party('b','leave'); tick(2);   // (room for one more in A's old party, now led by someone else)
const pa=x.partyOf(P('c')); clear(); party(pa.lead,'invite','fern'); tick(3);
ok('a player is in one party at a time: someone in another party cannot be invited',/already in a party/.test(toasts(pa.lead))&&x.partyOf(P('f'))!==pa);
ok('the leader leaving hands the lead on (to the next member)',pa.lead==='c'&&pa.mem.join()==='c,d'&&!P('a').party&&!P('b').party,'lead '+pa.lead+', members '+pa.mem.join());
ok('who leaves gets an empty roster (pty [pid, 0, []])',!!leftRoster&&leftRoster[1]==='a'&&leftRoster[2]===0&&leftRoster[3].length===0,JSON.stringify(leftRoster));
// roster refresh: health changes reach the frame within about a second
clear(); { const d=P('d'); d.hp=Math.round(d.maxHp*0.5); d.lastHit=x.S.t; } tick(25);
{ const r=last('c','pty'), row=r&&r[3].find(q=>q[0]==='d'); ok('a member\'s health change reaches the others\' party frame within about a second',!!row&&Math.abs(row[2]-Math.round(P('d').maxHp*0.5))<P('d').maxHp*0.2,row?row[2]+' / '+row[3]:'no roster'); }
// lead and kick
clear(); party('c','invite','gil'); tick(2); party('g','accept'); tick(2); party('c','lead','Gil'); tick(3);
ok('the leader can hand on the lead (party{a:\'lead\',name})',pa.lead==='g'&&last('c','pty')[2]==='g');
clear(); party('c','kick','Dara'); tick(2);
ok('only the leader kicks',/Only the party leader/.test(toasts('c'))&&pa.mem.includes('d'));
clear(); party('g','kick','Dara'); tick(3);
{ const r=last('d','pty'); ok('the leader kicks: the kicked one is out and told (an empty roster)',!pa.mem.includes('d')&&!P('d').party&&!!r&&r[2]===0&&r[3].length===0&&/removed/.test(toasts('d'))); }
// a disconnect of the leader
party('g','invite','dara'); tick(2); party('d','accept'); tick(2);
clear(); W.leave('g'); tick(25);
ok('the leader going offline hands the lead on',x.PARTIES.has(pa.id)&&pa.lead==='c'&&pa.mem.join()==='c,d'&&/went offline/.test(toasts('d')),'members '+pa.mem.join());
party('d','leave'); tick(2);
// two left -> one leaves -> the party is over
clear(); party('c','invite','dara'); tick(2); party('d','accept'); tick(2); const pc=x.partyOf(P('c')); clear(); party('c','leave'); tick(3);
ok('a party left with one member dissolves (both get an empty roster)',!!pc&&!x.PARTIES.has(pc.id)&&!P('d').party&&!P('c').party&&last('d','pty')[2]===0&&last('c','pty')[2]===0);
// declining
clear(); party('h','invite','ash'); tick(2); party('a','decline'); tick(3);
ok('declining tells the inviter, and a party of one with no invite out is gone',/declined/.test(toasts('h'))&&!P('h').party&&!P('a').party);
// running out
clear(); party('h','invite','bree'); tick(2); tick(Math.ceil((x.PARTY_INVITE_S+2)/0.05)); party('b','accept'); tick(2);
ok('an invite runs out after '+x.PARTY_INVITE_S+' s (the inviter hears, accepting is refused)',/did not answer/.test(toasts('h'))&&/no longer open/.test(toasts('b'))&&!P('b').party);
// the chat command
clear(); W.receive('h',{t:'chat',text:'/invite Bree'}); tick(3);
ok('/invite name in the chat invites (and is not said aloud)',!!last('b','ptyi')&&last('b','ptyi')[2]==='h'&&!evs('a','chat').length&&!evs('h','chat').length);
party('b','accept'); tick(3);
ok('accepting that invite works',x.partyOf(P('b'))&&x.partyOf(P('b'))===x.partyOf(P('h')));
console.log(fails?fails+' FAILED':'all passed');
process.exit(fails?1:0);
