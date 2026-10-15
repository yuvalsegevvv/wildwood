//@ The Guide: a short in-game wiki (controls, day and night, skills and gear, dungeons, the Proving Isle) opened by the book button or its key; text only, keys read from the current binds
/* The numbers here are the game's own (DAY_SECONDS, SKILL_SLOT_LV, PASSIVE_LV, PVP.level...) so the Guide cannot drift from the rules; keys come from kbName. Every string is static,
   nothing typed by a player goes in, so innerHTML is safe. Opens with the book button (#bGuide) or the `guide` key; Esc and the X close it like any panel. */
const GUIDE_TAB_KEY='wildwood-guide-tab';
let guideTab='basics';
function guidePages(){
  const k=kbName, mins=Math.round(DAY_SECONDS/60);
  const kl=(...a)=>a.map(x=>'<kbd>'+x+'</kbd>').join(' ');
  return {
    basics:{t:'Basics',h:`
      <p>Wildwood is a forest full of monsters, villages full of people with work for you, and friends to share it with. Kill monsters for XP, coins and drops; spend them on better gear and skills; walk further out as you grow stronger.</p>
      <h4>Controls</h4>
      <dl>
        <dt>${kl(['fwd','left','back','right'].map(k).join(' '))}</dt><dd>Walk. ${kl(k('run'))} runs, ${kl(k('jump'))} jumps. On a phone: left thumb moves, right thumb looks.</dd>
        <dt>${kl(k('basic'))} / click</dt><dd>Attack. It picks the nearest target; ${kl(k('target'))} switches target.</dd>
        <dt>${kl(k('skill'))} / right-click</dt><dd>Your class skill (from level ${SKILL_SLOT_LV}). ${kl(k('burst'))} is the burst skill (from level ${BURST_SLOT_LV}).</dd>
        <dt>${kl(k('talk'))}</dt><dd>Talk to villagers, open shops and the quest board, use a teleport circle. ${kl(k('gather'))} mines, chops or picks what you stand beside.</dd>
        <dt>${kl(k('inv'))} ${kl(k('skills'))} ${kl(k('map'))} ${kl(k('world'))}</dt><dd>Inventory, skills, the map of this land, the world map of Eldmere.</dd>
        <dt>${kl(k('pot1'))} ${kl(k('pot2'))} ${kl(k('pot3'))}</dt><dd>Drink a healing, might or guard potion (brewed by the healers).</dd>
        <dt>${kl(k('party'))}</dt><dd>Your party. ${kl(k('chat'))} opens chat. Hold ${kl('Alt')} to free the mouse for menus. Every key can be changed in Settings.</dd>
      </dl>
      <h4>Where to start</h4>
      <p>Talk to the people in your village: the quest board has four notices at a time (hunts and bounties), the smith and the armourer sell gear, and the Wayfarers' Lodge teaches mining, woodcutting and gathering. The main quest starts with Wren's sickness. Monsters grow stronger the further you walk from the village, and a zone's name and level show in the top left, so turn back if it is far above yours.</p>
      <p>When you are knocked out you wake in the village. Nothing is lost but time.</p>`},
    day:{t:'Day & night',h:`
      <p>A full day lasts ${mins} real minutes. The clock in the top left shows the hour; the hiker's day starts at about 07:00.</p>
      <ul>
        <li><b>Dawn and morning:</b> the sun climbs from the east, light and colour warm up.</li>
        <li><b>Midday and afternoon:</b> the brightest, clearest hours.</li>
        <li><b>Golden hour and dusk:</b> the sun sinks toward the west and sets below the horizon; the sky turns orange, then deep blue.</li>
        <li><b>Night:</b> the moon rises in the east, stars come out, fog closes in and it is much darker. Lanterns burn in the villages and fireflies drift in the forest.</li>
      </ul>
      <p>The world server owns the clock, so everyone playing together sees the same hour and the same weather.</p>
      <h4>Weather</h4>
      <p>Rain comes every so often and sometimes turns into a thunderstorm. In the Hoarfrost Reach it snows instead, and blizzards roll over its high plateau.</p>`},
    skills:{t:'Skills & gear',h:`
      <h4>Classes</h4>
      <p>Warrior (sword and shield, hits in an arc), Archer (homing arrows from far away) and Mage (fire bolts that burst). Wield another class's weapon to switch class; each class keeps its own skills.</p>
      <h4>Skills</h4>
      <p>Every class has three attack slots: the basic attack, a skill (level ${SKILL_SLOT_LV}) and a burst (level ${BURST_SLOT_LV}). Buy more skills in the skills window, drag them onto a slot, and upgrade them up to level 5 with coins and monster drops (+12% damage and shorter cooldown per level). Bosses drop special skills now and then.</p>
      <p>At level ${SOUL_LV} the shrine maiden in Hanami binds a <b>soul</b> element to you. Elements matter: water beats fire, fire beats air, air beats earth, earth beats water, and dark and light beat each other. Passive skills open from level ${PASSIVE_LV}. Skill sets (a signature outfit with its own skills and bonuses) can be unlocked from the Settings popover in this version.</p>
      <h4>Gear and coins</h4>
      <p>Items come in five rarities: Common, Rare, Epic, Unique and Legendary, each stronger than the last. Drag an item onto your body to wear it. Three identical items merge into the next rarity at the forge. Shops never run out but the price rises as you buy more, and resets at sunrise. Sell what you do not need.</p>
      <h4>Professions</h4>
      <p>Learn mining, woodcutting or gathering at a Wayfarers' Lodge (every village has one) and wield a pickaxe, axe or sickle. Ore makes weapons and logs make armour at the smiths and armourers; herbs make potions at the healers.</p>
      <h4>Harder settings</h4>
      <p>Beat a land's second boss and you can set that land to a harder tier on the map in a village: stronger monsters, bigger rewards, and a symbol that makes you stronger everywhere.</p>`},
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
        <li><b>The Trial Gate</b>, a temporary arch in your home village: the easiest run (Hollow Roots), open to everyone, from level 5.</li>
        <li><b>The Hollowed Elder</b> (the home forest), <b>the Falls Door</b> (Sakura Vale), <b>the Barrow Door</b> (Hoarfrost Reach) and <b>the Old Adit</b> (the Greyspine). Each opens once you have reached that land's village.</li>
      </ul>
      <p>Dungeons drop level-30 rings, pendants and other gear, and Tempering Stones to improve it. If you fall in a run a party member can revive you; you can leave through the portal and keep what you already found.</p>`},
    pvp:{t:'PvP island',h:`
      <p>The <b>Proving Isle</b> is a round island in a lake in the south-west of the home forest, south of Slime Meadow. Follow the Shore Road south and take the side road, <b>The Proving Road</b>, west; its plank bridge leads to a gate with red banners.</p>
      <ul>
        <li>On the island you can fight any other player who is there, except your party. Nothing is won or lost: no XP, coins or drops, and your save is never touched.</li>
        <li>Everyone fights at the same level (${PVP.level}) with the same set of gear, your own equipped attacks at skill level 1, and double health, so only skill and choices count.</li>
        <li>Monsters ignore the island, and potions do not work there.</li>
        <li>When you are knocked out you wake on the shore after 3 seconds, and the gate stays shut for ${PVP.lockS} seconds.</li>
        <li>You can wade at the lake's edge but not swim: the bridge is the way in.</li>
      </ul>
      <p>The map shows it as <i>${PVP_ISLE.name}</i>. If you cannot find it, press ${kl(k('map'))} on the home forest's map and look south-west.</p>`}
  };
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
function openGuide(){ try{ const s=localStorage.getItem(GUIDE_TAB_KEY); if(s) guideTab=s; }catch(_){} openPanel('guide'); renderGuide(); }
function toggleGuide(){ if(!$('#guide').hidden) closePanels(); else openGuide(); }
$('#bGuide').addEventListener('click',e=>{ toggleGuide(); e.currentTarget.blur(); });
addEventListener('keydown',e=>{ if(kbIs(e.code,'guide') && started && !customizing && !e.repeat) toggleGuide(); });
