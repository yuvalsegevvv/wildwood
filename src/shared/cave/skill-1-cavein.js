//@ Cave skill Cave-in (floor 1, method F, earth): rocks fall on a 6 m circle: heavy damage, normal monsters stunned for 1.5 s
defineCaveSkill({id:'cavein',name:'Cave-in',floor:1,method:'F',set:null,cost:35,mult:3.2,range:22,el:'earth',anim:'nova',act:['cv_cavein',0.8,0.5],
  desc:'Rocks fall on a 6 m circle: heavy damage, and normal monsters are stunned for 1.5 seconds.',
  fx:{zone:{r:6,dur:1,once:true,stun:1.5}}});
