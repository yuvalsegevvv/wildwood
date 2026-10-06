//@ The fifteen elemental reactions as data (one defineReaction row per pair of elements; the names are placeholders)
/* A closed set: six elements make exactly fifteen pairs, so the chart is one file read as a table, not fifteen files (docs/REACTIONS.md section 3).
   The effect of a pair is the two elements' flavours (reactions.js); a row only names it and may override: k (the strength of both flavours, default 0.7)
   or burst (bonus damage as a share of the triggering hit). First-draft overrides: Steam bursts, Eclipse is at full strength. */
defineReaction({a:'fire', b:'water',name:'Steam',   burst:0.6});
defineReaction({a:'fire', b:'earth',name:'Cinder'});
defineReaction({a:'fire', b:'air',  name:'Wildfire'});
defineReaction({a:'fire', b:'dark', name:'Smoulder'});
defineReaction({a:'fire', b:'light',name:'Flare'});
defineReaction({a:'water',b:'earth',name:'Mire'});
defineReaction({a:'water',b:'air',  name:'Squall'});
defineReaction({a:'water',b:'dark', name:'Murk'});
defineReaction({a:'water',b:'light',name:'Prism'});
defineReaction({a:'earth',b:'air',  name:'Dust'});
defineReaction({a:'earth',b:'dark', name:'Barrow'});
defineReaction({a:'earth',b:'light',name:'Flint'});
defineReaction({a:'air',  b:'dark', name:'Dusk'});
defineReaction({a:'air',  b:'light',name:'Halo'});
defineReaction({a:'dark', b:'light',name:'Eclipse', k:1});
