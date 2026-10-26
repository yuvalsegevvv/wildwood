//@ Friends and the ranking: a mutual friend list (gear.fr, names; added by a request the other player accepts), who of them is online, and the top of the level ranking
/* agent map
   message in:  fr{a:'add'|'accept'|'decline'|'remove'|'list'|'rank', name}   (MSG.fr)
   events out (each to one player: e[1] is their pid):
     frl [pid, rows]            rows = [[name, online 0|1, level, class], ...] online first, then by name; sent on 'list' and after every change
     fri [pid, fromName, secs]  a friend request from fromName: answer with fr{a:'accept'|'decline', name:fromName} within secs
     rnk [pid, rows, myRank, total]   rows = [[rank, name, level, class, online 0|1], ...] the best FR_RANK_TOP, myRank 0 = not ranked
   exports: frSanitize(g.fr) (players.js sanitizeGear), frNoteP(p) (a leaving player's place in the ranking, api.js leave), FR_MAX
   the ranking: live players, plus RANK, the offline players' last (level, exp), loaded once from io.store.ranks() (node/main.js); level, then exp
   users: server/api.js (leave), server/players.js (sanitizeGear)   test: tools/friends-smoke.js   Panel: game/ui/friends.js */
const FR_MAX=50, FR_REQ_S=60, FR_RANK_TOP=50;
const RANK=new Map();   // lowercase name -> {n: name, l: level, x: exp, c: class}
/* The ranking is read from the saves once at start. A free Postgres that is still waking (Neon suspends when idle, and a Render redeploy restarts us cold) can fail that
   first read; with no retry the ranking then showed only whoever logged in since, as if it had reset. So a failed read is tried again, 5 s, 10 s... up to 5 min apart. */
function frRankLoad(wait){
  Promise.resolve().then(()=>io.store.ranks()).then(list=>{ for(const r of list||[]) frRankPut(r.n,r.l,r.x,r.c); })
    .catch(e=>{ if(io.log) io.log('could not load the ranking, trying again in '+wait+' s',e&&e.message); const t=setTimeout(()=>frRankLoad(Math.min(300,wait*2)),wait*1000); if(t.unref) t.unref(); });
}
if(io.store&&io.store.ranks) frRankLoad(5);
function frRankPut(n,l,x,c){
  n=String(n||'').slice(0,16); l=clampInt(l,1,PLAYER_MAX_LV,1); if(!n) return; x=Math.max(0,+x||0);
  const k=n.toLowerCase(), o=RANK.get(k); if(o&&(o.l>l||(o.l===l&&o.x>=x))) return;
  RANK.set(k,{n,l,x,c:String(c||'').slice(0,12)});
}
const frNoteP=p=>frRankPut(p.name,p.level,p.exp,p.look&&p.look.cls);
function frSanitize(a){
  const out=[]; if(!Array.isArray(a)) return out;
  for(const n of a){ if(typeof n!=='string') continue; const s=n.trim().slice(0,16); if(s&&!out.some(m=>m.toLowerCase()===s.toLowerCase())) out.push(s); if(out.length>=FR_MAX) break; }
  return out;
}
function frFind(name){ const n=String(name||'').trim().toLowerCase(); if(!n) return null; for(const q of S.players.values()) if(q.name.toLowerCase()===n) return q; return null; }
const frList=p=>p.gear.fr||(p.gear.fr=[]);   // (a brand-new hiker's gear comes from newGearFor, which has no list yet)
const frHas=(p,name)=>frList(p).some(m=>m.toLowerCase()===String(name).toLowerCase());
function frSendP(p){
  const rows=frList(p).map(n=>{ const q=frFind(n), r=RANK.get(n.toLowerCase()); return [n,q?1:0,q?q.level:r?r.l:0,q?(q.look&&q.look.cls)||'':r?r.c:''];
  }).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  ev('frl',p.id,rows).to=p.id;
}
function frRankP(p){
  if(io.test){ ev('rnk',p.id,[],0,0).to=p.id; return; }   // testworld: no ranking
  const all=new Map(RANK);
  for(const q of S.players.values()){ const k=q.name.toLowerCase(), o=all.get(k); if(!o||o.l<=q.level) all.set(k,{n:q.name,l:q.level,x:q.exp,c:(q.look&&q.look.cls)||''}); }
  const list=[...all.values()].sort((a,b)=>b.l-a.l||b.x-a.x||a.n.localeCompare(b.n));
  const me=list.findIndex(r=>r.n.toLowerCase()===p.name.toLowerCase());
  const rows=list.slice(0,FR_RANK_TOP).map((r,i)=>[i+1,r.n,r.l,r.c,frFind(r.n)?1:0]);
  ev('rnk',p.id,rows,me+1,list.length).to=p.id;
}
function frMsgP(p,msg){
  const a=msg&&msg.a, name=typeof msg.name==='string'?msg.name.trim().slice(0,16):'';
  if((a==='list'||a==='rank')&&S.t-((p.frT||(p.frT={}))[a]||-99)<0.5) return;   // (a client polling faster than twice a second)
  if(a==='list'||a==='rank'){ p.frT[a]=S.t; if(a==='list') frSendP(p); else frRankP(p); return; }
  if(a==='add'){
    const q=frFind(name);
    if(!q){ toastTo(p.id,'Nobody called '+name+' is online. Friends can only be added while both of you are here.','bad'); return; }
    if(q===p){ toastTo(p.id,'You cannot add yourself.','bad'); return; }
    if(frHas(p,q.name)){ toastTo(p.id,q.name+' is already your friend.','bad'); return; }
    if(frList(p).length>=FR_MAX){ toastTo(p.id,'Your friend list is full ('+FR_MAX+').','bad'); return; }
    const o=q.frReq||(q.frReq=new Map());
    if(o.has(p.id)&&o.get(p.id)>S.t){ toastTo(p.id,'You already asked '+q.name+'.','bad'); return; }
    if(o.size>20) o.clear();
    o.set(p.id,S.t+FR_REQ_S);
    ev('fri',q.id,p.name,FR_REQ_S).to=q.id; toastTo(p.id,'Friend request sent to '+q.name+'.',''); return;
  }
  if(a==='accept'||a==='decline'){
    const q=frFind(name), o=p.frReq;
    if(!q||!o||!(o.get(q.id)>S.t)){ toastTo(p.id,'That request is no longer open.','bad'); return; }
    o.delete(q.id);
    if(a==='decline'){ toastTo(q.id,p.name+' declined your friend request.',''); return; }
    if(!frHas(p,q.name)&&frList(p).length<FR_MAX) frList(p).push(q.name);
    if(!frHas(q,p.name)&&frList(q).length<FR_MAX) frList(q).push(p.name);
    p.dirty=true; q.dirty=true;
    toastTo(p.id,'You and '+q.name+' are friends now.','good'); toastTo(q.id,'You and '+p.name+' are friends now.','good');
    frSendP(p); frSendP(q); return;
  }
  if(a==='remove'){
    const i=frList(p).findIndex(m=>m.toLowerCase()===name.toLowerCase());
    if(i<0) return;
    frList(p).splice(i,1); p.dirty=true; frSendP(p);
  }
}
MSG.fr=(p,msg)=>frMsgP(p,msg);
