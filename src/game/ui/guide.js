//@ The Guide: a short in-game wiki (controls, combat, skills, upgrades, dungeons, the Proving Isle) opened by the book button or its key; text only, keys read from the current binds
/* The numbers here are the game's own (SKILL_SLOT_LV, PASSIVE_LV, PVP.level...) so the Guide cannot drift from the rules; keys come from kbName. Every string is static,
   nothing typed by a player goes in, so innerHTML is safe. Opens with the book button (#bGuide) or the `guide` key; Esc and the X close it like any panel. */
const GUIDE_TAB_KEY='wildwood-guide-tab';
let guideTab='basics';
function guidePages(){
  const k=kbName;
  const kl=(...a)=>a.map(x=>'<kbd>'+x+'</kbd>').join(' ');
  return {
    basics:{t:'Controls',h:`
      <p>Kill monsters for XP, coins and drops, spend them on gear and skills, and walk further out as you grow. Every key can be changed in Settings.</p>
      <dl>
        <dt>${kl(['fwd','left','back','right'].map(k).join(' '))}</dt><dd>Walk. ${kl(k('run'))} runs, ${kl(k('jump'))} jumps. On a phone: left thumb moves, right thumb looks.</dd>
        <dt>${kl(k('basic'))} / click</dt><dd>Basic attack. It picks the nearest target; ${kl(k('target'))} switches target.</dd>
        <dt>${kl(k('skill'))} / right-click</dt><dd>Skill (from level ${SKILL_SLOT_LV}). ${kl(k('burst'))} is the burst (from level ${BURST_SLOT_LV}).</dd>
        <dt>${kl(k('pot1'))} ${kl(k('pot2'))} ${kl(k('pot3'))} ${kl(k('pot4'))} ${kl(k('pot5'))} ${kl(k('pot6'))}</dt><dd>Healing, might and guard potions, then the heal-over-time, exp and loot potions.</dd>
        <dt>${kl(k('talk'))}</dt><dd>Talk to villagers, open shops, the quest board and teleport circles. ${kl(k('gather'))} mines, chops or picks what you stand beside.</dd>
        <dt>${kl(k('inv'))} ${kl(k('skills'))} ${kl(k('map'))} ${kl(k('world'))}</dt><dd>Inventory, skills, the land's map, the world map.</dd>
        <dt>${kl(k('party'))} ${kl(k('chat'))}</dt><dd>Party and chat. Hold ${kl('Alt')} to free the mouse for menus.</dd>
      </dl>
      <p>The quest board offers four notices at a time (hunts and bounties). ${kl(k('quests'))} (or a click on the quest list) opens your quests: the main quest's step with a picture of each monster it asks for, the board's notices and the ones you carry. A zone's name and level show in the top left: turn back if it is far above yours. If you are knocked out you wake in the village and lose nothing but time.</p>`},
    combat:{t:'Combat',h:`
      <h4>Classes</h4>
      <p><b>Warrior:</b> sword and shield, Slash hits everything in an arc. <b>Archer:</b> homing arrows from far away. <b>Mage:</b> Firebolt bursts on impact. Your class is the weapon you hold; each class keeps its own skills.</p>
      <h4>Damage</h4>
      <ul>
        <li>Your damage comes from your level and your weapon; your health from your level and your armour. Armour cuts incoming damage, with diminishing returns at high defence.</li>
        <li><b>Critical hits</b> happen 12% of the time for 1.7x damage.</li>
        <li><b>Levels matter:</b> every level an enemy is above you takes 5% off the damage you deal (down to half at 10 levels above) and makes its hits hurt 5% more. Below you, the reverse.</li>
        <li><b>Elements:</b> water beats fire, fire beats air, air beats earth, earth beats water, dark and light beat each other. A skill that beats the monster's element deals 1.5x; the wrong way, a third less. The target frame shows the monster's element.</li>
      </ul>
      <h4>Bosses</h4>
      <p>Each boss has its own moves, shown first as a warning shape on the ground: step out of it. Bosses change phase at 60% and 30% health, and the bar shows a percentage. They drop skills and better gear than normal monsters.</p>
      <h4>Staying alive</h4>
      <p>Drink potions (brewed at the healers from herbs), dodge the warning shapes, and fight monsters near your own level. In a dungeon, a party member can revive you.</p>`},
    skills:{t:'Skills',h:`
      <h4>Slots</h4>
      <p>Each class has three attack slots: the basic attack, a <b>skill</b> (level ${SKILL_SLOT_LV}) and a <b>burst</b> (level ${BURST_SLOT_LV}). Buy skills in the skills window (${kl(k('skills'))}) and drag them onto a slot. Cooldowns belong to the slot, so swapping skills does not reset them.</p>
      <h4>Boss skills</h4>
      <p>Every boss has six skills it can drop, about a 10% chance per skill per kill for each player who helped. They cannot be bought.</p>
      <h4>Soul and elements</h4>
      <p>At level ${SOUL_LV} the shrine maiden in Hanami binds a <b>soul</b>: your skills of that element hit harder (x1.5), and the opposite element hurts less. Elements are on skills and monsters; pick skills that beat what you hunt.</p>
      <h4>Passives</h4>
      <p>Passive skills work all the time, whatever your class. Their slots open at levels ${PASSIVE_SLOT_LV.join(', ')}.</p>`},
    sets:{t:'Skill sets',h:`
      <p>A skill set is one character's signature kit: <b>six pieces</b> (three attacks for the basic, skill and burst slots, and three passives), a symbol, usually an element, two set bonuses and a matching <b>outfit</b>. Every land has its own sets.</p>
      <h4>How to get the pieces</h4>
      <ul>
        <li>The land's <b>first world boss</b> can drop the set's first attack and passive, the <b>second world boss</b> the second pair, and the land's <b>dungeon boss</b> the third pair.</li>
        <li>A world boss kill has a <b>${Math.round(SS_CHANCE_BOSS*100)}%</b> chance; a won dungeon run has <b>${Math.round(SS_CHANCE_DUNGEON*100)}%</b>. Each land has three sets, one for each difficulty tier: a set drops only when you beat the boss or dungeon at its tier or higher (+0 gives nothing; the <b>All sets</b> tab says which tier each needs). After ${SS_PITY_DUNGEON} such dungeon clears or ${SS_PITY_BOSS} boss kills without a drop, the next one is a sure drop.</li>
        <li>In this version every set can also be unlocked from Settings for testing.</li>
      </ul>
      <h4>Using a set</h4>
      <p>Owned pieces show up in the skills window (${kl(k('skills'))}) with the set's own symbol. Drag attacks onto the three slots and passives onto the passive slots. The window's set effects card shows what you wear: <b>3 pieces</b> of one set light its first bonus and <b>5 pieces</b> its second. You can mix pieces of two sets (3 + 3) to get both first bonuses.</p>
      <h4>Levelling a piece</h4>
      <p>Signature pieces go from level 2 to 5 like other skills, and also cost <b>raid material</b> of the set's land. Clear that land's ruined stronghold (the raid) to earn it: the more difficult the tier you clear, the more you get (1, 2, 4, 8... for tiers 0, I, II, III...). A cleared raid rebuilds 30 minutes later.</p>
      <h4>The outfit</h4>
      <p>Each set has a matching outfit in the character editor's <b>Signature</b> tab. An outfit is <b>locked until you own at least one piece of that set</b>. It is only a look: it changes no stat.</p>`},
    allsets:{t:'All sets',h:guideAllSets()},
    equipment:{t:'Equipment',h:`
      <h4>What you can wear</h4>
      <ul>
        <li><b>Armour:</b> helmet, top, bottom and shoes raise your health and defence.</li>
        <li><b>Weapon:</b> sets your class and your damage. Pick up a bow or a staff to play archer or mage.</li>
        <li><b>Ring and pendant:</b> from dungeons (level 30 and 40). A ring adds attack only when its element matches your soul; a pendant gives one bonus such as XP, drops, coins or crits.</li>
        <li><b>Tools:</b> pickaxe, axe and sickle for the three professions.</li>
      </ul>
      <p>Open the inventory with ${kl(k('inv'))}, click an item to wear it. Gear has a level; wear what is near your own.</p>
      <h4>How to get it</h4>
      <ul>
        <li><b>Shops:</b> the village smith, armourer and general store sell gear for your level. Prices rise 20% per copy until sunrise.</li>
        <li><b>Monster drops:</b> about 2% Common, 0.5% Rare, 0.1% Epic per kill. <b>Bosses</b> drop much better: 50 / 10 / 3 / 1 / 0.1% from Common up to Legendary.</li>
        <li><b>Crafting:</b> ore becomes weapons and logs become armour at the smiths and armourers (see Upgrades).</li>
        <li><b>Dungeons:</b> clears pay level-30 and level-40 weapons, armour, rings and pendants, plus Tempering Stones.</li>
        <li><b>Merging:</b> three identical items become the next rarity at the forge.</li>
      </ul>
      <h4>Rarity</h4>
      <p>Common, Rare, Epic, Unique, Legendary: each multiplies the stats (x1, 1.3, 1.7, 2.2, 3). Tempering Stones then add +1, +2... on top, and level-40 pieces can be rerolled at the forge.</p>`},
    upgrades:{t:'Upgrades',h:`
      <h4>Upgrading a skill</h4>
      <p>Every bought skill goes up to level 5 (boss skills cannot be upgraded yet). Each level adds <b>+12% damage and shorter cooldown</b>. An upgrade costs <b>coins</b> (more for each level) and <b>monster drops</b>: materials that monsters leave behind (about a third of kills), of a kind that fits the skill's level. Level 5 also asks for two boss trophies. Open the skill in the skills window to see what it still needs.</p>
      <h4>Gear</h4>
      <p>Weapons and armour improve with your level and come in five rarities: Common, Rare, Epic, Unique, Legendary (stats x1, 1.3, 1.7, 2.2, 3). <b>Three identical items merge into the next rarity at the forge.</b> Shops never run out, but each copy you buy costs 20% more until sunrise.</p>
      <h4>Dungeon gear: rings, pendants, tempering</h4>
      <ul>
        <li>Dungeons pay level-30 weapons, armour, <b>rings</b> and <b>pendants</b>.</li>
        <li>A ring adds flat attack, but only when its element matches your soul.</li>
        <li>A pendant gives one bonus: more XP, more drops, more coins, higher crit chance or stronger crits.</li>
        <li><b>Tempering Stones</b> raise a piece +1, +2... (up to +2 for Common, up to +10 for Legendary); each step adds 10% of its power.</li>
      </ul>
      <h4>Level-40 gear: rolled lines</h4>
      <ul>
        <li>A level-40 weapon or armour piece starts <b>unrolled</b>. Spend a <b>Reroll Stone</b> at the forge's <b>Roll</b> tab to give it three lines out of 13 stats; roll again to replace all three.</li>
        <li>Weapons roll higher offence (attack, crits, reactions, accuracy), armour higher defence (health, defense, resistance). XP, drops, coins, cooldown and buff duration roll the same on both.</li>
        <li>The <b>Sacrifice</b> tab turns a spare level-30 or level-40 weapon or armour piece into stones: 1 / 2 / 4 / 8 / 16 by rarity. Weapon pieces make weapon stones, armour makes armour stones.</li>
        <li>Cooldown reduction from gear stops at 40%. <b>Resistance</b> is the chance to halve the damage of a hit and shrug off its debuffs; <b>accuracy</b> lowers the target's resistance chance.</li>
      </ul>
      <h4>Professions and crafting</h4>
      <p>Learn mining, woodcutting or gathering at a Wayfarers' Lodge, carry the matching tool, and work the nodes (a node needs a tool of the tier of its land; sometimes you get a double yield). Ore becomes weapons and logs become armour at the smiths and armourers; herbs become potions at the healers.</p>
      <h4>Zone tiers</h4>
      <p>Beat a land's second boss and you can set that land to a harder tier (up to V) on the map in a village. Enemies there gain 10 levels per tier, and pay much more XP and coins. Each unlocked tier also gives you a symbol: +10% attack and health, everywhere.</p>`},
    dungeons:{t:'Dungeons',h:`
      <p>Dungeons are private runs for a party of 1 to 4. Each has its own rooms, monsters and a boss at the end. Everything is balanced for one player; more players make monsters tougher. <b>Everyone in the party gets all of the loot.</b></p>
      <h4>Getting in</h4>
      <ol>
        <li>Form a party with ${kl(k('party'))} or by chatting <code>/invite name</code> (it also works alone).</li>
        <li>Walk to a dungeon door out in the world and press ${kl(k('talk'))} to open the Delve board. The leader chooses a mission; everyone accepts the invite with ${kl(k('accept'))} within 15 seconds.</li>
        <li>No door is locked. Finish the mission's goal (clear the place, defend, survive, sabotage, escort...), and the boss appears in the round hall. Defeat it to clear the run.</li>
      </ol>
      <h4>The doors</h4>
      <ul>
        <li><b>The Trial Gate</b>, a temporary arch in your home village: a level-5 practice run (Hollow Roots) open to everyone, every mission always on offer. It pays nothing.</li>
        <li><b>The Hollowed Elder</b> (the home forest), <b>the Falls Door</b> (Sakura Vale), <b>the Barrow Door</b> (Hoarfrost Reach), <b>the Old Adit</b> (the Greyspine), <b>the Sandglass Door</b> (the Sunscar, in the desert south of Glasswell) and <b>the Gloamvault Door</b> (the Gloamhorn, in the cliffs of Vault Heath): six dungeons. The first four need level ${DG_ENTRY_LV}, at every difficulty (the difficulty tiers make monsters harder, not the way in); the Sandglass and the Gloamvault are level 40 with a level-40 boss and need level ${DG_THEMES.sandglass?DG_THEMES.sandglass.entry:36} and ${DG_THEMES.gloamvault?DG_THEMES.gloamvault.entry:38}. Each opens once you have reached that land's village; the home forest's also needs difficulty +1, unlocked by beating Carapax.</li>
      </ul>
      <p>Dungeons drop level-30 rings, pendants and other gear (the Sandglass a level-40 weapon, the Gloamvault a level-40 armour piece), and Tempering Stones to improve it. If you fall in a run a party member can revive you; you can leave through the portal and keep what you already found.</p>`},
    reactions:{t:'Reactions',h:guideReactions()},
    pvp:{t:'PvP island',h:`
      <p>The <b>Proving Isle</b> is a round island in a lake on the home forest's south beach, with the open sea behind it. Follow the Shore Road all the way south and take the side road, <b>The Proving Road</b>, east; its plank bridge leads to a gate with red banners.</p>
      <ul>
        <li>On the island you can fight any other player who is there, except your party. Nothing is won or lost: no XP, coins or drops, and your save is never touched.</li>
        <li>Everyone fights at the same level (${PVP.level}) with the same set of gear, your own equipped attacks at skill level 1, and double health, so only skill and choices count.</li>
        <li>Monsters ignore the island, and potions do not work there.</li>
        <li>When you are knocked out you wake on the shore after 3 seconds, and the gate stays shut for ${PVP.lockS} seconds.</li>
        <li>You can wade at the lake's edge but not swim: the bridge is the way in.</li>
      </ul>
      <p>The map shows it as <i>${PVP_ISLE.name}</i>. If you cannot find it, press ${kl(k('map'))} on the home forest's map and look at the south beach.</p>`}
  };
}
// the catalogue of every released skill set, written from the registry (shared/skillsets.js) so it cannot drift; the look is the set's palette and symbol
const GUIDE_SS_LAND={home:'the home forest',vale:'the Sakura Vale',hoar:'the Hoarfrost Reach',grey:'the Greyspine',sun:'the Sunscar',gloam:'the Gloamhorn'};
const GUIDE_SS_ROLE={risk:'high-risk damage',safe:'steady damage',grind:'crowd grinder',support:'support',heal:'healer',tank:'tank'};
function guideSrcName(id){ const b=BOSS_DEFS.find(x=>x.def.id===id); if(b) return b.short||b.def.name; const t=typeof DG_THEMES!=='undefined'&&DG_THEMES[id]; return t?t.name+' (dungeon)':id; }
function guideHex(c){ return '#'+c.toString(16).padStart(6,'0'); }
function guideAllSets(){
  const R=r=>GUIDE_SS_ROLE[r]||r, el=e=>Array.isArray(e)?e.join(' + '):e==='basic'?'none (pure basic)':e;
  const cards=SS_ORDER.map(id=>SS_SETS[id]).filter(S=>!S.dev).sort((a,b)=>Object.keys(GUIDE_SS_LAND).indexOf(a.land)-Object.keys(GUIDE_SS_LAND).indexOf(b.land)||a.tier-b.tier).map(S=>{
    const pal=['main','accent','glow'].filter(k=>S.pal[k]!==undefined).map(k=>`<i class="gu-sw" style="background:${guideHex(S.pal[k])}"></i>`).join('');
    const sym=S.emblem?`<svg class="gu-em" viewBox="0 0 24 24" fill="none" stroke="${guideHex(S.emblem.col)}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${S.emblem.glyph}</svg>`:'';
    const role=R(S.role.main)+(S.role.also?' and '+R(S.role.also.role):'');
    const pieces=[1,2,3].map(n=>{ const P=S.pos[n], a=SKILLS[P.ids[0]], ps=PASSIVES[P.passive], o=ssOddsOf(S,n);
      return `<li><b>${a.name}</b> (${['basic','skill','burst'][n-1]}): ${a.desc} <b>${ps.name}</b> (passive): ${ps.text.replace('{}','')}<br><em>From ${guideSrcName(P.from.id)}, ${Math.round(o.chance*100)}% a clear, sure after ${o.pity}.</em></li>`; }).join('');
    const bon=n=>`<b>${S.bonus[n].name}</b> (${n} pieces): ${S.bonus[n].text}`;
    return `<div class="gu-set"><h4>${sym}${S.name} <small>${S.char.name}, ${GUIDE_SS_LAND[S.land]}, difficulty +${S.tier}</small></h4>
      <p class="gu-look">${pal} <span>Look: ${S.char.theme}. A signature outfit in the editor's Signature tab.</span></p>
      <p>Kit: ${role}. Element: ${el(S.el)}.</p><ul>${pieces}</ul><p>${bon(3)}<br>${bon(5)}</p></div>`; }).join('');
  return `<p>Every released skill set, by land and difficulty. A set drops only from its own land's two bosses and dungeon boss, cleared at the tier shown or higher.</p>${cards}`;
}
// the elemental reactions page, written from the chart itself (shared/reactions-chart.js) so it cannot drift
const GUIDE_FLAVOR={fire:'burns',water:'slows',earth:'briefly stuns',air:'spreads the aura to enemies within '+RX_SPREAD_R+' m',dark:'weakens (it deals less)',light:'exposes (it takes more damage)'};
function guideReactions(){
  const el=e=>e[0].toUpperCase()+e.slice(1), rows=Object.keys(RX_CHART).sort().map(k=>{ const r=RX_CHART[k];
    return `<tr><td><b>${r.name}</b></td><td>${el(r.a)} + ${el(r.b)}</td><td>${GUIDE_FLAVOR[r.a]} and ${GUIDE_FLAVOR[r.b]}${r.burst?', plus a burst of '+Math.round(r.burst*100)+'% of the hit':''}${r.k>RX_REACT_K?' (at full strength)':''}</td></tr>`; }).join('');
  return `<p>A hit from an element skill leaves an <b>aura</b> on the monster for ${RX_AURA_DUR} seconds. Hit that monster with a <i>different</i> element while the aura is live and the two <b>react</b>: the aura is used up and both elements' effects land on the monster. The same element only refreshes the aura, and basic attacks do not count.</p>
    <h4>What each element does</h4>
    <dl><dt>Fire</dt><dd>burns the monster over time</dd><dt>Water</dt><dd>slows it</dd><dt>Earth</dt><dd>stuns it for a moment (never bosses)</dd><dt>Air</dt><dd>spreads the aura to nearby enemies</dd><dt>Dark</dt><dd>weakens it, so it hits less hard</dd><dt>Light</dt><dd>makes it take more damage</dd></dl>
    <h4>The fifteen reactions</h4>
    <table class="gu-tab"><tbody>${rows}</tbody></table>
    <p>The same pair cannot react again on one monster for ${RX_ICD} seconds. Weaken and expose never add up: the strongest one counts, for everyone in the party.</p>`;
}
function guideSave(){ try{ localStorage.setItem(GUIDE_TAB_KEY,guideTab); }catch(_){} }
function renderGuide(){
  const pages=guidePages(), keys=Object.keys(pages);
  if(!pages[guideTab]) guideTab='basics';
  $('#guTabs').innerHTML=keys.map(id=>`<button class="chip" aria-pressed="${id===guideTab}" data-gt="${id}">${pages[id].t}</button>`).join('');
  $('#guBody').innerHTML=pages[guideTab].h;
  $('#guBody').scrollTop=0;
  $('#guTabs').querySelectorAll('[data-gt]').forEach(b=>b.onclick=()=>{ guideTab=b.dataset.gt; guideSave(); UI_SFX.click(); renderGuide(); });
}
function openGuide(){ try{ const s=localStorage.getItem(GUIDE_TAB_KEY); if(s) guideTab=s; }catch(_){} openPanel('guide'); renderGuide(); guideMarkSeen(); }
function toggleGuide(){ if(!$('#guide').hidden) closePanels(); else openGuide(); }
$('#bGuide').addEventListener('click',e=>{ toggleGuide(); e.currentTarget.blur(); });
addEventListener('keydown',e=>{ if(kbIs(e.code,'guide') && started && !customizing && !e.repeat) toggleGuide(); });

// the Guide button pulses until the player first opens it (remembered per browser)
const GUIDE_SEEN_KEY='wildwood-guide-seen';
function guideSeen(){ try{ return localStorage.getItem(GUIDE_SEEN_KEY)==='1'; }catch(_){ return true; } }
function guideBlink(on){ $('#bGuide').classList.toggle('blink',on); }
function guideMarkSeen(){ guideBlink(false); try{ localStorage.setItem(GUIDE_SEEN_KEY,'1'); }catch(_){} }
if(!guideSeen()) guideBlink(true);
