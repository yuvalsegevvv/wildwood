//@ The Versions panel (button left of the map): version 1 = everything in the released game, version 2 = what is new
/* Agent map: owns #versions (#vrTabs, #vrBody), the #bVer button. Text only, written by hand: keep it in step with PATCHNOTES.md (the same lists, shorter).
   Users: panels.js (the id is in PANELS). Test: client-smoke (opens it, two tabs). */
const VER_TAB_KEY='wildwood-versions-tab';
let verTab='v2';
const verKey=a=>'<kbd>'+kbName(a)+'</kbd>';
function verPages(){ return {
  v1:{t:'Version 1',h:`
    <p>Everything in the game today (the released <b>main</b> version).</p>
    <h4>World</h4>
    <ul>
      <li><b>The home forest</b>: a large procedural forest with a village, roads, a river and bridge, lakes, the south beach and the Sunwall; about 555 monsters in 19 zones, levels 1-20.</li>
      <li><b>The Sakura Vale</b> (east, levels 16-25): the village Hanami, 240 monsters in 10 zones, reached through a tunnel the Rootwarden's fall opens.</li>
      <li><b>The Hoarfrost Reach</b> (north, levels 22-30): a frozen plateau through Frostgate Pass, the village Rimehold, 216 monsters in 9 zones, snow instead of rain, teleport circles between the three villages.</li>
      <li>Day and night (20-minute day), rain and storms, music for every village, level range and boss.</li>
    </ul>
    <h4>Story and bosses</h4>
    <ul>
      <li>A main quest in three acts (Wren's sickness, from the village to the Rimeking, levels 1-25) and a board of daily notices (hunts and bounties).</li>
      <li>Six bosses with moves of their own: the Rootwarden, Carapax the Tide King, Akaoni, Kyuubi, Ymrik and Vetrmaw.</li>
    </ul>
    <h4>Heroes</h4>
    <ul>
      <li>Three classes (warrior, archer, mage) with a basic attack, a skill (level 3) and a burst (level 10); skills upgrade five levels with coins and monster drops; 48 boss skills drop at 10%.</li>
      <li>Elements: your soul is bound at level 15 in Hanami; skills and monsters carry elements with a x1.5 wheel.</li>
      <li>Passive skills, 210 items in 6 tiers and 5 rarities, a forge that merges three into the next rarity, shops with rising prices.</li>
      <li>Zone tiers I-III: beat a land's second boss to set it harder, for better rewards and a +10% symbol.</li>
    </ul>
    <h4>Crafting and trades</h4>
    <ul>
      <li>Mining, woodcutting and gathering, learned at a Wayfarers' Lodge; ore makes weapons, logs make armour, herbs make potions (keys Z, X, C).</li>
    </ul>
    <h4>Playing together</h4>
    <ul>
      <li>Chat, names, guest or name-and-password accounts, server-side saves, solo / shared / online play, a map and minimap.</li>
    </ul>`},
  v2:{t:'Version 2',h:`
    <p>What is new on top of version 1. The full list is in the patch notes.</p>
    <h4>New places</h4>
    <ul>
      <li><b>The Greyspine</b>: a fourth land north-west of the forest (levels 26-32), the village Highmark, two bosses, rain below and snow on the peaks, chamois on the slopes, and <b>Act IV</b> of the main quest.</li>
      <li><b>World map of Eldmere</b> (key ${verKey('world')}), curved borders and coasts with bays and islets, a bigger Hoarfrost Reach, and a <b>bridge over the Greyfall River</b> instead of the tunnel.</li>
      <li><b>The Proving Isle</b>: a PvP island south on the beach.</li>
    </ul>
    <h4>Dungeons</h4>
    <ul>
      <li>Runs alone or in a party of 4, seven mission types, four dungeons with bosses, the Delve board, and the free <b>Trial Roots</b> practice dungeon.</li>
      <li>Level-30 rings and pendants (a new necklace slot), and Tempering Stones.</li>
    </ul>
    <h4>PvP</h4>
    <ul>
      <li>Fight other players on equal footing with <b>your own favourite skills at skill level 1</b>, the same gear and level for all, no rewards.</li>
    </ul>
    <h4>Heroes</h4>
    <ul>
      <li>A reworked character model and eight <b>signature outfits</b> whose pieces mix.</li>
      <li><b>Skill sets</b> (eight to try), three passive slots at levels 13 / 16 / 20, <b>elemental reactions</b> (see the Guide).</li>
      <li>Zone tiers IV and V, a soft level cap at 50, retuned late-game balance, boss health as a percentage.</li>
    </ul>
    <h4>Screens and comfort</h4>
    <ul>
      <li>The <b>Guide</b> (key ${verKey('guide')}), this Versions list, a world map, new minimap, thousands separators in XP numbers, and a <b>Graphics</b> setting (Light, Medium, Standard, High) in Settings.</li>
      <li>A better sunset, and a first load about 47% faster on a sturdier server.</li>
    </ul>`}
}; }
function verRender(){
  const V=verPages(), keys=Object.keys(V); if(!V[verTab]) verTab='v2';
  $('#vrTabs').innerHTML=keys.map(id=>`<button class="chip" aria-pressed="${id===verTab}" data-vt="${id}">${V[id].t}</button>`).join('');
  $('#vrBody').innerHTML=V[verTab].h; $('#vrBody').scrollTop=0;
  $('#vrTabs').querySelectorAll('[data-vt]').forEach(b=>b.onclick=()=>{ verTab=b.dataset.vt; try{ localStorage.setItem(VER_TAB_KEY,verTab); }catch(_){} UI_SFX.click(); verRender(); });
}
function openVersions(){ try{ const s=localStorage.getItem(VER_TAB_KEY); if(s&&verPages()[s]) verTab=s; }catch(_){} openPanel('versions'); verRender(); }
$('#bVer').addEventListener('click',e=>{ if(!$('#versions').hidden) closePanels(); else openVersions(); e.currentTarget.blur(); });
