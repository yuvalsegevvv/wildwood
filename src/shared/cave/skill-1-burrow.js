//@ Cave skill Burrow (floor 1, method E): sink into the ground for 1.5 s: nothing can hit you, you move up to 6 m, and normal monsters lose track of you
defineCaveSkill({id:'burrow',name:'Burrow',floor:1,method:'E',set:null,cost:30,mult:1,range:6,el:'earth',anim:'cast',
  desc:'Sink into the ground for 1.5 seconds: nothing can hit you, you move up to 6 m, and normal monsters lose track of you.',
  fx:{burrow:{sec:1.5,dist:6},vis:{r:2.4}}});
