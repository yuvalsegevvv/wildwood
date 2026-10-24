//@ Cave method B, Resonance crystals: three sealed geodes, each cracks only to a named element or to a two-element chain; hit it with the right skills
defineCaveMethod({id:'B',name:'Resonance crystals',short:'Crack the three geodes with the elements shown on them',blurb:'Sealed geodes crack only to the element (or the two-element chain) written on them. Hit them with skills of that element; a basic attack counts as your soul\'s element.',
  dress:['Glowworm geode','Prism geode','Drowned geode','Magma geode'],
  p:{reach:3.6,maxReach:14,chain:8,
    /* what each floor's three geodes ask: an element, or [first, second] (hit the first, then the second within `chain` seconds: the pair reacts). Floors 2-4 are placeholders until their steps tune them */
    need:{1:['water','earth',['fire','air']],2:['light','fire',['water','dark']],3:['air','dark',['earth','light']],4:['fire','water',['air','earth']]}}});
