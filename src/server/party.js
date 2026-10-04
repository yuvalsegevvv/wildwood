//@ Parties on the server: up to 4 hikers with a leader, invites that last 30 s, leave / kick / hand on the lead, the roster (pty) pushed to every member about once a second; in memory only. Generic (a dungeon run starts from one)
/* agent map
   message in:  party{a:'invite'|'accept'|'decline'|'leave'|'kick'|'lead', name}   (MSG.party; and the chat command /invite name, chatP in server/economy.js)
   events out (each to one member: e[1] is that member's pid, and only that player is sent it):
     pty  [pid, leaderPid, rows]   rows = [[pid, name, hp, maxHp, level, dead 0|1, run id or 0], ...] in party order; leaderPid 0 and rows [] = you are in no party now
     ptyi [pid, fromPid, fromName, seconds]   an invite to fromPid's party: answer with party{a:'accept'} or party{a:'decline'} within seconds
   exports: PARTIES (id -> {id, lead: pid, mem: [pids], inv: Map pid -> S.t it expires, key}), PARTY_MAX, partyOf(p), partyMembersS(pa) -> the members' players,
            partyMsgP(p,msg), partyGoneP(p) (a disconnect: api.js leave), updatePartiesS(dt) (the tick: expiring invites, the roster refresh)
   users: server/api.js (tick, leave), server/economy.js (chatP), server/dungeons/lobby.js and runs.js (a run's party, join prompts)
   test: tools/party-smoke.js.   Design: docs/DUNGEONS.md section 5 (the party), section 9 (the protocol).
   Rules: a player is in at most one party; only the leader invites, kicks and hands on the lead; the leader leaving or disconnecting hands the lead to the next
   member; a party left with one member and no pending invite dissolves (a lone hiker is a party of one only for runs, without a party object). */
const PARTY_MAX=4, PARTY_INVITE_S=30, PARTY_SYNC_S=1;   // PARTY_MAX must equal DG_MAX_PARTY (shared/dungeons.js; party-smoke checks it)
const PARTIES=new Map(); let partyNextId=1, partySyncT=0;
// an event for one player only (it carries their pid in e[1], so a Shared-mode client can tell it is not for them)
function partyEvTo(kind,pid,...rest){ const e=ev(kind,pid,...rest); e.to=pid; return e; }
const partyOf=p=>p&&p.party?PARTIES.get(p.party)||null:null;
const partyMembersS=pa=>pa.mem.map(id=>S.players.get(id)).filter(Boolean);
function partyFindS(name){ const n=String(name||'').trim().toLowerCase(); if(!n) return null; for(const q of S.players.values()) if(q.name.toLowerCase()===n) return q; return null; }
const partyRowsS=pa=>partyMembersS(pa).map(q=>[q.id,q.name,Math.max(0,Math.round(q.hp)),q.maxHp,q.level,q.dead?1:0,q.inst|0]);
function partySendS(pa){ const rows=partyRowsS(pa); pa.key=JSON.stringify([pa.lead,rows]); for(const id of pa.mem) partyEvTo('pty',id,pa.lead,rows); }
function partyToastS(pa,text,kind){ for(const id of pa.mem) toastTo(id,text,kind||''); }
function partyNewS(p){ const pa={id:partyNextId++,lead:p.id,mem:[p.id],inv:new Map(),key:''}; PARTIES.set(pa.id,pa); p.party=pa.id; return pa; }
function partyDissolveS(pa){
  for(const id of pa.mem){ const q=S.players.get(id); if(q&&q.party===pa.id) q.party=0; partyEvTo('pty',id,0,[]); }
  for(const id of pa.inv.keys()){ const q=S.players.get(id); if(q&&q.pinv&&q.pinv.party===pa.id) q.pinv=null; }
  PARTIES.delete(pa.id);
}
// take pid out of the party (why: 'left' | 'kicked' | 'gone'); the lead passes on, a party of one with no invite out dissolves
function partyRemoveS(pa,pid,why){
  const i=pa.mem.indexOf(pid); if(i<0) return;
  pa.mem.splice(i,1); const q=S.players.get(pid), name=q?q.name:'Someone', wasLead=pa.lead===pid;
  if(q&&q.party===pa.id) q.party=0;
  partyEvTo('pty',pid,0,[]);
  if(wasLead&&pa.mem.length) pa.lead=pa.mem[0];
  if(pa.mem.length<=1&&!pa.inv.size){ if(pa.mem.length) toastTo(pa.mem[0],name+(why==='kicked'?' was removed':' left')+': the party is over.',''); partyDissolveS(pa); return; }
  if(!pa.mem.length){ partyDissolveS(pa); return; }
  const lead=S.players.get(pa.lead);
  partyToastS(pa,name+(why==='kicked'?' was removed from the party':why==='gone'?' went offline and left the party':' left the party')+(wasLead&&lead?'. '+lead.name+' leads it now.':'.'),'');
  partySendS(pa);
}
function partyInviteP(p,name){
  const q=partyFindS(name);
  if(!q){ toastTo(p.id,'Nobody called '+String(name||'').trim().slice(0,16)+' is here.','bad'); return; }
  if(q===p){ toastTo(p.id,'You cannot invite yourself.','bad'); return; }
  let pa=partyOf(p);
  if(pa&&pa.lead!==p.id){ toastTo(p.id,'Only the party leader can invite.','bad'); return; }
  if(q.party){ toastTo(p.id,q.name+(pa&&q.party===pa.id?' is already in your party.':' is already in a party.'),'bad'); return; }
  if(pa&&pa.inv.has(q.id)&&pa.inv.get(q.id)>S.t){ toastTo(p.id,'You have already invited '+q.name+'.','bad'); return; }
  if((pa?pa.mem.length+pa.inv.size:1)>=PARTY_MAX){ toastTo(p.id,'Your party is full (at most '+PARTY_MAX+').','bad'); return; }
  if(!pa) pa=partyNewS(p);
  pa.inv.set(q.id,S.t+PARTY_INVITE_S); q.pinv={party:pa.id,from:p.id,until:S.t+PARTY_INVITE_S};
  partyEvTo('ptyi',q.id,p.id,p.name,PARTY_INVITE_S);
  toastTo(q.id,p.name+' invites you to a party.','');
  toastTo(p.id,'You invited '+q.name+' to your party.','');
  partySendS(pa);
}
function partyAcceptP(p){
  const iv=p.pinv, pa=iv&&PARTIES.get(iv.party);
  if(!iv||iv.until<S.t||!pa||!pa.inv.has(p.id)){ p.pinv=null; toastTo(p.id,'That invite is no longer open.','bad'); return; }
  if(pa.mem.length>=PARTY_MAX){ p.pinv=null; pa.inv.delete(p.id); toastTo(p.id,'That party is full.','bad'); return; }
  const old=partyOf(p); if(old) partyRemoveS(old,p.id,'left');   // one party at a time
  pa.inv.delete(p.id); p.pinv=null; pa.mem.push(p.id); p.party=pa.id;
  partyToastS(pa,p.name+' joined the party.','good');
  partySendS(pa);
}
function partyDeclineP(p){
  const iv=p.pinv; p.pinv=null; if(!iv) return;
  const pa=PARTIES.get(iv.party); if(!pa) return;
  pa.inv.delete(p.id); toastTo(iv.from,p.name+' declined your invite.','');
  if(pa.mem.length<=1&&!pa.inv.size) partyDissolveS(pa); else partySendS(pa);
}
function partyMsgP(p,msg){
  const a=msg&&msg.a, name=typeof msg.name==='string'?msg.name:'';
  if(a==='invite') partyInviteP(p,name);
  else if(a==='accept') partyAcceptP(p);
  else if(a==='decline') partyDeclineP(p);
  else if(a==='leave'){ const pa=partyOf(p); if(pa) partyRemoveS(pa,p.id,'left'); else partyDeclineP(p); }
  else if(a==='kick'||a==='lead'){
    const pa=partyOf(p); if(!pa) return;
    if(pa.lead!==p.id){ toastTo(p.id,'Only the party leader can do that.','bad'); return; }
    const q=partyMembersS(pa).find(m=>m.name.toLowerCase()===name.trim().toLowerCase());
    if(!q||q===p){ toastTo(p.id,'Nobody called '+name.trim().slice(0,16)+' is in your party.','bad'); return; }
    if(a==='kick'){ toastTo(q.id,'You were removed from the party.','bad'); partyRemoveS(pa,q.id,'kicked'); }
    else { pa.lead=q.id; partyToastS(pa,q.name+' leads the party now.',''); partySendS(pa); }
  }
}
MSG.party=(p,msg)=>partyMsgP(p,msg);
// a disconnect: out of the party (the lead passes on), and out of any invite list
function partyGoneP(p){
  const pa=partyOf(p); if(pa) partyRemoveS(pa,p.id,'gone');
  if(p.pinv){ const ip=PARTIES.get(p.pinv.party); p.pinv=null; if(ip){ ip.inv.delete(p.id); if(ip.mem.length<=1&&!ip.inv.size) partyDissolveS(ip); } }
}
// once a second: invites run out, members who vanished are taken out, and a roster that changed (health, level, downed, in a run) is pushed again
function updatePartiesS(dt){
  partySyncT-=dt; if(partySyncT>0) return; partySyncT=PARTY_SYNC_S;
  for(const pa of [...PARTIES.values()]){
    for(const [id,until] of [...pa.inv]) if(until<S.t){ pa.inv.delete(id); const q=S.players.get(id); if(q&&q.pinv&&q.pinv.party===pa.id) q.pinv=null; toastTo(pa.lead,(q?q.name:'Your invite')+(q?' did not answer your invite.':' ran out.'),''); }
    for(const id of [...pa.mem]) if(!S.players.has(id)) partyRemoveS(pa,id,'gone');
    if(!PARTIES.has(pa.id)) continue;
    if(pa.mem.length<=1&&!pa.inv.size){ partyDissolveS(pa); continue; }
    if(JSON.stringify([pa.lead,partyRowsS(pa)])!==pa.key) partySendS(pa);
  }
}
