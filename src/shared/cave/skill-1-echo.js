//@ Cave skill Echo (floor 1, method A): repeats your last skill or burst at 60% power, with no cooldown
defineCaveSkill({id:'echo',name:'Echo',floor:1,method:'A',set:null,cost:30,mult:1,range:12,anim:'cast',
  desc:'Repeats your last skill or burst at 60% power, without its cooldown. Nothing to repeat? Nothing is spent.',
  fx:{echo:{k:0.6},vis:{r:3.5}}});   // mult 1 is the level scale (x1.1 per level); server/cave/skills.js runs `echo`, `vis` is the placeholder look (C5 draws the real one)
