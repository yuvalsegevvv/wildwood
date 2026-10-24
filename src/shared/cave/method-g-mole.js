//@ Cave method G, The gem mole: a rare mole spawns at a burrow and runs for a hole; slow, stun and kill it before it digs out (everyone who hurt it is paid)
caveMobDef('boar','gemmole','Gem Mole',{level:30,el:'earth',scale:0.5,noXp:true,speed:5,aggro:0,atk:99,noAttack:true,pal:{body:0x6a5a4e,ridge:0x3a2e26,head:0x86705e,snout:0xd89aa0,tusk:0xe8d8a8,legs:0x4a3a2e,eye:0x050505}});
defineCaveMethod({id:'G',name:'The gem mole',short:'Catch the gem mole before it digs out',blurb:'A rare mole grabs a skill shard and runs for a hole. Slow it, root it or stun it and bring it down before it digs out. Control beats raw damage.',
  dress:['Gem mole','Crystal mole','Cave-eel mole','Cinder mole'],p:{first:60,every:[240,420],speed:5.2,dig:1.4,hpK:0.3,credit:30,minRun:22,maxRun:60}});
