//@ Cosmetics on the server (version 3): making an aura or a cape at a Wayfarers' Lodge from ore, logs, herbs and coins; the owned list is gear.cos
/* Message: cosmake{type:'a'|'c', id} (in a village; the cost is shared/cosmetics.js cosCost). The made piece is added to gear.cos and the player is told by a toast and a 'you' update; wearing
   it is a look change (the editor's Cosmetics tab: the look message, which cosCleanLook cuts down to what you own in api.js and newPlayer). Nothing is consumed twice and nothing is refused for level:
   a cosmetic changes no number. test: tools/revamp-smoke.js */
function cosMakeP(p,type,id){
  if(p.dead||(type!=='a'&&type!=='c')) return;
  const D=cosDef(type,id), C=D&&cosCost(type,id); if(!D) return;
  if(!nearLodge(p.x,p.z)&&!homeAt(p.x,p.z)){ toastTo(p.id,'Cosmetics are made at a Wayfarers\' Lodge in a village, or at your home\'s bench','bad'); return; }
  if(p.gear.cos.includes(cosKey(type,id))){ toastTo(p.id,'You already have '+D.name,'bad'); return; }
  for(const [r,n] of C.res) if((p.gear.res[r]||0)<n){ toastTo(p.id,'You need '+n+' '+RES[r].name,'bad'); return; }
  if(p.gear.coins<C.coins){ toastTo(p.id,'The fee is '+C.coins+' coins','bad'); return; }
  if(p.gear.cos.length>=COS_MAX) return;
  for(const [r,n] of C.res){ p.gear.res[r]-=n; if(!p.gear.res[r]) delete p.gear.res[r]; }
  p.gear.coins-=C.coins; p.gear.cos.push(cosKey(type,id)); p.dirty=true;
  toastTo(p.id,'Made: '+D.name+' ('+(type==='a'?'aura':'cape')+'). Wear it in the character editor.','loot r3');
}
MSG.cosmake=(p,msg)=>cosMakeP(p,msg.type,msg.id);
