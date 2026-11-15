//@ The Abyss's combat artifacts (B6): ten rules and procs (kills heal, every 5th hit, boss damage, a round-start shield, thorns, execute, Last Breath: death prevention); one defineAbArt row each
/* agent map (docs/ABYSS.md section 3c; registry: shared/abyss.js defineAbArt)
   exports: nothing (the rows fill AB_ARTS)
   users: server/abyss/combat.js (the rules: abHitS, abKillP, abThornsS, abLastS, abShieldS), server/abyss/arts.js (abP), game/abyss/choice.js
   test: tools/abyss-smoke.js; the numbers were tuned with tools/abyss-sim.js (docs/ABYSS.md section 3e)
   Stats (shared/abyss.js): boss / exec / nth are factors that multiply with the bar; killheal / shield / thorns / last are amounts that add up, capped (AB_CAPS). "Every 5th hit" is AB_NTH. */
defineAbArt({id:'ab_bloodletter',name:'Bloodletter',fam:'combat',rar:'common',icon:'♥',k:{killheal:0.03},text:'Every kill heals you for 3% of your maximum health (at most 30%).'});
defineAbArt({id:'ab_echo',name:'Echoing Strike',fam:'combat',rar:'common',icon:'≋',k:{nth:2.5},text:'Every 5th hit deals x2.5 damage.'});
defineAbArt({id:'ab_bane',name:'Titanbane',fam:'combat',rar:'common',icon:'♛',k:{boss:1.7},text:'Damage to bosses x1.7.'});
defineAbArt({id:'ab_ward',name:'Round Ward',fam:'combat',rar:'common',icon:'◌',k:{shield:0.12},text:'Each round starts with a shield of 12% of your maximum health (at most 300%).'});
defineAbArt({id:'ab_thorn',name:'Thornmail',fam:'combat',rar:'common',icon:'✸',k:{thorns:0.004},text:'A monster that hits you loses 0.4% of its maximum health (a boss a tenth of that).'});
defineAbArt({id:'ab_exec',name:'Executioner',fam:'combat',rar:'common',icon:'☠',k:{exec:1.55},text:'Hits on a monster under 20% health deal x1.55.'});
defineAbArt({id:'ab_last',name:'Last Breath',fam:'combat',rar:'rare',icon:'☥',k:{last:0.3},text:'When a hit would kill you, you stand up with 30% health instead. One copy is used up.'});
defineAbArt({id:'ab_vampedge',name:'Vampiric Edge',fam:'combat',rar:'rare',icon:'⚔',k:{killheal:0.05,lifesteal:0.0006},text:'Kills heal 5% of your maximum health and you heal 0.06% of the damage you deal.'});
defineAbArt({id:'ab_bastion',name:'Bastion Sigil',fam:'combat',rar:'rare',icon:'⛨',k:{shield:0.4},text:'Each round starts with a shield of 40% of your maximum health.'});
defineAbArt({id:'ab_warbrand',name:'Warbrand',fam:'combat',rar:'rare',icon:'⚡',k:{nth:5},text:'Every 5th hit deals x5 damage.'});
