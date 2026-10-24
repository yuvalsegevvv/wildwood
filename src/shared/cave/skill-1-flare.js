//@ Cave skill Flare (floor 1, method B, light): a 10 m burst of light; normal monsters are blinded for 2 s and miss, bosses deal 20% less for 4 s
defineCaveSkill({id:'flare',name:'Flare',floor:1,method:'B',set:null,cost:25,mult:0.4,range:10,el:'light',anim:'nova',
  desc:'A 10 m burst of light. Normal monsters are blinded for 2 seconds and miss; bosses deal 20% less for 4 seconds.',
  fx:{ring:{r:10},flare:{blind:2,boss:0.2,bossDur:4}}});
