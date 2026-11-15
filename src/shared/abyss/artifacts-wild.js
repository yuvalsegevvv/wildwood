//@ The Abyss's wildcards (B6): eight artifacts with a real plus and a real minus (damage for health, health for damage, crits for healing...); fam 'wild', the minus is shown in red
/* agent map (docs/ABYSS.md section 3d; registry: shared/abyss.js defineAbArt; a wildcard row also needs `minus`, the text of its price)
   exports: nothing (the rows fill AB_ARTS)
   users: server/abyss/arts.js (abP: the factors multiply with the bar's; one below 1 is a minus, for def one above 1), game/abyss/choice.js (the red line)
   test: tools/abyss-smoke.js; the numbers were tuned with tools/abyss-sim.js (docs/ABYSS.md section 3e)
   A wildcard is thrown away between rounds like any other (abyss{a:'drop'}), which is how its minus is escaped. */
defineAbArt({id:'ab_w_glass',name:'Glass Cannon',fam:'wild',rar:'rare',icon:'✧',k:{atk:2.9,def:1.75},text:'Damage dealt x2.9.',minus:'Damage taken x1.75.'});
defineAbArt({id:'ab_w_colossus',name:'Colossus Heart',fam:'wild',rar:'rare',icon:'⬣',k:{hp:2.6,atk:0.5},text:'Maximum health x2.6.',minus:'Damage dealt x0.5.'});
defineAbArt({id:'ab_w_pact',name:'Bloodless Pact',fam:'wild',rar:'rare',icon:'✦',k:{crit:0.15,heal:0.05},text:'Crit chance +15 points (at most +50).',minus:'Healing received x0.05.'});
defineAbArt({id:'ab_w_berserk',name:'Berserker Mask',fam:'wild',rar:'rare',icon:'☗',k:{atk:2.2,hp:0.5},text:'Damage dealt x2.2.',minus:'Maximum health x0.5.'});
defineAbArt({id:'ab_w_turtle',name:'Turtle Shell',fam:'wild',rar:'common',icon:'⬡',k:{def:0.4,atk:0.62},text:'Damage taken x0.4.',minus:'Damage dealt x0.62.'});
defineAbArt({id:'ab_w_haste',name:'Hummingbird Charm',fam:'wild',rar:'common',icon:'≫',k:{aspd:0.24,cdr:0.12,hp:0.68},text:'Attack speed +24 points and cooldowns 12 points shorter.',minus:'Maximum health x0.68.'});
defineAbArt({id:'ab_w_bargain',name:"Devil's Bargain",fam:'wild',rar:'rare',icon:'⚖',k:{atk:4,hp:0.74,heal:0.4},text:'Damage dealt x4.',minus:'Maximum health x0.74 and healing received x0.4.'});
defineAbArt({id:'ab_w_thirst',name:'Thirsting Blade',fam:'wild',rar:'common',icon:'☾',k:{lifesteal:0.001,def:1.45},text:'Heal 0.1% of the damage you deal (at most 1%).',minus:'Damage taken x1.45.'});
