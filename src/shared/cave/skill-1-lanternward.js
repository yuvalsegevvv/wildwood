//@ Cave skill Lantern Ward (floor 1, method D): a shield of 15% of your max health for 6 s; allies within 8 m get half of it
defineCaveSkill({id:'lanternward',name:'Lantern Ward',floor:1,method:'D',set:null,cost:35,mult:1,range:8,el:'light',anim:'cast',
  desc:'A shield of 15% of your maximum health for 6 seconds. Allies within 8 m get half of it.',
  fx:{ward:{v:0.15,r:8,ally:0.5,dur:6},vis:{r:3}}});
