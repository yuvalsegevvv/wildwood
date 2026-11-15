//@ The Abyss's stat artifacts (B4): twelve plain plus artifacts (damage, health, defence, healing, crit, cooldown, attack speed, lifesteal), two rarities; each entry is one defineAbArt row
/* agent map (docs/ABYSS.md section 5; registry: shared/abyss.js defineAbArt)
   exports: nothing (the rows fill AB_ARTS)
   users: server/abyss/arts.js (abP, offers), game/abyss/choice.js (the cards and the bar)
   test: tools/abyss-smoke.js
   SIZING (plan section 4: a full, well-picked bar of 20 must reach about x400-800 damage and x45-80 toughness by the end of Difficulty V; the multiplying is the point). A copy's factor
   is what you read; damage factors 1.35 / 1.5 (common) and 1.9 (rare): 11 copies of the average ~1.65 give x270 and 13 give x750, so a bar that is mostly damage lands in the band and the rest
   of the 20 places are what you give up. Toughness is health x (1 / damage taken) x healing: 1.4 / 1.9 health and 0.85 / 0.68 damage taken per copy, so 5 health copies (~x15) with 4 defence
   copies (~x3.7) give ~x55, and the two rate-free multipliers fight for the same places as the damage. The rates (crit +5, cooldown +6, attack speed +8 points a copy, capped by AB_CAPS) are the
   small useful picks that never run away. FIRST GUESS: B6's sim (tools/abyss-sim.js) tunes every number here. */
defineAbArt({id:'ab_edge',name:'Honed Edge',fam:'stat',rar:'common',icon:'▲',k:{atk:1.35},text:'Damage dealt x1.35.'});
defineAbArt({id:'ab_fang',name:"Ravener's Fang",fam:'stat',rar:'common',icon:'◣',k:{atk:1.5},text:'Damage dealt x1.5.'});
defineAbArt({id:'ab_dread',name:'Dread Sigil',fam:'stat',rar:'rare',icon:'✶',k:{atk:1.9},text:'Damage dealt x1.9.'});
defineAbArt({id:'ab_heart',name:'Heartwood Knot',fam:'stat',rar:'common',icon:'●',k:{hp:1.4},text:'Maximum health x1.4.'});
defineAbArt({id:'ab_marrow',name:"Titan's Marrow",fam:'stat',rar:'rare',icon:'⬢',k:{hp:1.9},text:'Maximum health x1.9.'});
defineAbArt({id:'ab_scale',name:'Slate Scale',fam:'stat',rar:'common',icon:'■',k:{def:0.85},text:'Damage taken x0.85.'});
defineAbArt({id:'ab_carapace',name:'Void Carapace',fam:'stat',rar:'rare',icon:'◈',k:{def:0.68},text:'Damage taken x0.68.'});
defineAbArt({id:'ab_thread',name:"Mender's Thread",fam:'stat',rar:'common',icon:'✚',k:{heal:1.35},text:'Healing received x1.35.'});
defineAbArt({id:'ab_eye',name:'Keen Eye',fam:'stat',rar:'common',icon:'◉',k:{crit:0.05},text:'Crit chance +5 points (at most +50).'});
defineAbArt({id:'ab_glass',name:'Quick Hourglass',fam:'stat',rar:'common',icon:'⧖',k:{cdr:0.06},text:'Cooldowns 6 points shorter (at most 40).'});
defineAbArt({id:'ab_wraps',name:'Fleet Wraps',fam:'stat',rar:'common',icon:'▶',k:{aspd:0.08},text:'Attack speed +8 points (at most +60).'});
defineAbArt({id:'ab_leech',name:'Leech Charm',fam:'stat',rar:'rare',icon:'❀',k:{lifesteal:0.02},text:'Heal 2% of the damage you deal (at most 20%).'});
