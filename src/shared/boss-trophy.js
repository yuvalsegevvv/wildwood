//@ Boss trophies: BOSS_TROPHY, the named trophy each world boss drops (2^tier a kill to every helper), the registry defineBossTrophy and its checks
/* Agent map (skills revamp step 10a; PLAN section 8; the costs that ask for them: awakening-cost.js, awkTrophyId).
   exports: BOSS_TROPHY (id -> {boss, id, name, col, text}; no prototype), BT_ORDER (ids, by land), BT_BAD (rows left out, with the reason), BT_MAX (the most of one trophy a hiker holds),
            defineBossTrophy(row), btOf(id) (the row or null; own properties only), btOfBoss(bossId) (the row or null), btCount(kill tier) = 2^tier.
   A row: {boss: a SS_SOURCES boss id, id: 'trophy_<boss>', name, col: '#rrggbb' (the icon's colour), text: one flavour line ('' until written)}. A bad row is listed in BT_BAD and left out.
   Held in gear.awm[id] (server/awakening.js sanitizes, server/combat.js rewardKill pays, server/awakening.js spends); shown by game/ui/item-icons.js (btIconArt) and the inventory.
   Used by: server/combat.js, server/awakening.js, game/economy/inventory.js. Test: tools/awakening-server-smoke.js, tools/boss-smoke.js. Task card: PLAN folder, haiku-trophy-card.md. */
const BOSS_TROPHY=Object.create(null), BT_ORDER=[], BT_BAD=[], BT_MAX=999;
function btSourceBosses(){ const s=[]; for(const l of Object.keys(SS_SOURCES)) s.push(SS_SOURCES[l][0],SS_SOURCES[l][1]); return s; }
function defineBossTrophy(row){
  const bad=why=>{ BT_BAD.push({id:row&&typeof row.id==='string'?row.id:'?',why}); if(typeof console!=='undefined') console.warn('boss trophy left out: '+why); };
  if(!row||typeof row!=='object') return bad('not an object');
  if(typeof row.boss!=='string'||!btSourceBosses().includes(row.boss)) return bad('boss '+row.boss+' is not a land boss (SS_SOURCES)');
  if(row.id!=='trophy_'+row.boss) return bad('id must be trophy_'+row.boss);
  if(BOSS_TROPHY[row.id]) return bad('duplicate id');
  if(typeof row.name!=='string'||!row.name||row.name.length>48) return bad('name');
  if(typeof row.col!=='string'||!/^#[0-9a-fA-F]{6}$/.test(row.col)) return bad('col must be #rrggbb');
  if(typeof row.text!=='string'||row.text.length>200) return bad('text');
  BOSS_TROPHY[row.id]=Object.freeze({boss:row.boss,id:row.id,name:row.name,col:row.col,text:row.text}); BT_ORDER.push(row.id);
}
const btOf=id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(BOSS_TROPHY,id)?BOSS_TROPHY[id]:null;
const btOfBoss=boss=>typeof boss==='string'?btOf('trophy_'+boss):null;
const btCount=tier=>Math.pow(2,Math.max(0,Math.min(10,tier|0)));
// ---- the rows, by land (home, vale, hoar, grey, sun, gloam, amber, isles; two bosses each). The first two are complete; the rest are placeholders for the card in the PLAN folder (name, colour, one line)
defineBossTrophy({boss:'boss', id:'trophy_boss', name:'The Rootwarden Trophy', col:'#6a8a3a', text:"A knot of heartwood still warm from the four seasons, cut from the Rootwarden's crown."});   // home
defineBossTrophy({boss:'carapax', id:'trophy_carapax', name:'Carapax Trophy', col:'#3a8fa8', text:"A pearly plate of Carapax's shell, rimed with salt and older than the beach."});   // home
defineBossTrophy({boss:'akaoni', id:'trophy_akaoni', name:'Akaoni Trophy', col:'#8a2a2a', text:"A horned oni mask of black lacquer, its gilt teeth still warm from the Gate, hung in the Vale shrine."});   // vale
defineBossTrophy({boss:'kyuubi', id:'trophy_kyuubi', name:'Kyuubi Trophy', col:'#d9a441', text:"A tuft from one of nine tails, still glowing with fox-fire that never quite goes out."});   // vale
defineBossTrophy({boss:'ymrik', id:'trophy_ymrik', name:'Ymrik Trophy', col:'#a8e2f5', text:"A shard of pale rime cut from the Rimeking's crown, cold enough to frost the palm that holds it."});   // hoar
defineBossTrophy({boss:'vetrmaw', id:'trophy_vetrmaw', name:'Vetrmaw Trophy', col:'#2f6fa8', text:"A curved fang of the Frost Wyrm, its root still crackling with the cold of the Reach."});   // hoar
defineBossTrophy({boss:'gryphonqueen', id:'trophy_gryphonqueen', name:'The Gryphon Queen Trophy', col:'#c9a24a', text:"A golden-tipped talon of the Gryphon Queen, still sharp enough to split the mountain wind."});   // grey
defineBossTrophy({boss:'mountaingolem', id:'trophy_mountaingolem', name:'The Mountain Golem Trophy', col:'#7a6e62', text:"A chunk of the Mountain Golem's grey core, warm as a hearthstone and heavy as the peak it came from."});   // grey
defineBossTrophy({boss:'glassguardian', id:'trophy_glassguardian', name:'The Glass Guardian Trophy', col:'#9ad8e0', text:"A sliver of fused desert glass from the Guardian's shell, humming faintly as the sun crosses it."});   // sun
defineBossTrophy({boss:'sandwyrm', id:'trophy_sandwyrm', name:'The Sand Wyrm Trophy', col:'#c47a3a', text:"A banded scale of the Sand Wyrm, dry and warm, that sings a low note when the wind moves over it."});   // sun
defineBossTrophy({boss:'drownedcaptain', id:'trophy_drownedcaptain', name:'Captain Dredge Trophy', col:'#4a6a6a', text:"A brass ship bell from the Drowned Captain's wreck, green with salt and tolling by itself at dusk."});   // gloam
defineBossTrophy({boss:'gloamwarden', id:'trophy_gloamwarden', name:'The Gloam Warden Trophy', col:'#5b4a8a', text:"A lantern glass from the Gloam Warden's stave, holding one last gleam of a dusk that never ends."});   // gloam
defineBossTrophy({boss:'oldthunder', id:'trophy_oldthunder', name:'Old Thunder Trophy', col:'#5c6b7a', text:"A grey-black feather from Old Thunder's wing, still crackling faintly with the storm it carried."});   // amber
defineBossTrophy({boss:'oldhorn', id:'trophy_oldhorn', name:'Oldhorn Trophy', col:'#a0683a', text:"A broken horn tip from the Herd-Mother, ringed with the years of her herd and warm to the touch."});   // amber
defineBossTrophy({boss:'ocelo', id:'trophy_ocelo', name:'Ocelo Trophy', col:'#f2a93b', text:"A spotted fang of the Sun-Jaguar, gold-rimmed and faintly warm, as if it still holds the noon."});   // isles
defineBossTrophy({boss:'tuila', id:'trophy_tuila', name:'Tuila Trophy', col:'#2aa6a0', text:"A coral bead strung on sea-grass cord, which hums like a wave whenever the tide turns."});   // isles
