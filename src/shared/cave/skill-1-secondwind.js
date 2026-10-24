//@ Cave skill Second Wind (floor 1, method H): heal 20% of your max health over 6 s and clear slows
defineCaveSkill({id:'secondwind',name:'Second Wind',floor:1,method:'H',set:null,cost:40,mult:1,range:6,anim:'cast',
  desc:'Heal 20% of your maximum health over 6 seconds and clear slows and roots.',
  fx:{wind:{heal:0.2,sec:6},vis:{r:3}}});
