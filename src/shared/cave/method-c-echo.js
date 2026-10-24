//@ Cave method C, Echo trial: stand on the plinth, an echo sets a feat (win against a spawned pack without being hit on floor 1; a set's own feat on the others, from its skill's `feat` field)
defineCaveMethod({id:'C',name:'Echo trial',short:'Stand on the plinth and win the feat',blurb:'A stone echo at the plinth sets a feat. On the first floor: beat the spawned pack without being hit once. Deeper floors set their set\'s own feat.',
  dress:['Glowworm plinth','Prism plinth','Drowned plinth','Magma plinth'],p:{hold:1.5,reach:4,failLock:6,kind:3,leash:45}});
