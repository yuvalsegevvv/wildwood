//@ Cave skill Grapple Line (floor 1, method G): pull yourself up to 15 m to a target or a spot; your next hit within 2 s deals +30%
defineCaveSkill({id:'grapple',name:'Grapple Line',floor:1,method:'G',set:null,cost:20,mult:1,range:15,anim:'cast',
  desc:'Pull yourself up to 15 m to a target or a spot. Your next hit within 2 seconds deals 30% more.',
  fx:{dash:{ahead:15},grapple:{k:1.3,sec:2},vis:{r:2}}});
