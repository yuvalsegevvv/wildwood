//@ Raid: the Sunken Citadel, the Sunscar's sandstone citadel half buried by a dune (garrison, site, material)
defineRaid({id:'sunken', name:'The Sunken Citadel', land:'sun', x:-780, z:440, look:'sand', mat:'Citadel Sunstone',
  garrison:{gate:['raider','dunescorpion'], yard:['mummy','tombguard'], wall:['sunpriest','raider'], elite:'sandgolem', reinf:['raider','mummy','dunescorpion']},
  up:['raider','mummy','sandgolem','sunpriest']});
