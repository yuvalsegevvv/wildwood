//@ Cave skill Overdrive (floor 1, method C): your next 3 basic attacks are sure crits and come 30% faster
defineCaveSkill({id:'overdrive',name:'Overdrive',floor:1,method:'C',set:null,cost:25,mult:0,range:6,anim:'cast',
  desc:'Your next 3 basic attacks are sure critical hits and come 30% faster.',
  fx:{overdrive:{n:3,sec:15,cd:0.7},vis:{r:2.6}}});
