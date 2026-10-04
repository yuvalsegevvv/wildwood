//@ Monster drops (MATS: one material per monster kind), the skills bosses drop (BOSS_SKILLS), and what upgrading a skill costs (upgradeNeeds). Pure.
/* Drops. Every monster kind has its own material (a Slime drops Slime Goo...). A kill drops one with DROP_CHANCE (sometimes two; the Scavenger
   passive raises the chance), a boss always drops BOSS_DROPS. Materials are kept in gear.mats ({id:count}, up to MAT_MAX) and are only used
   to upgrade skills.
   Upgrading a skill or passive to level n (2..SKILL_MAX_LV) costs coins and drops:
   - coins: UP_COINS of its slot x (n-1)^1.7 (the burst's 5 levels cost about 12 800 coins all together, a skill's about 5 100);
   - drops: UP_COUNT[n] of the material of a monster kind at level skill.lv + 2 (n-1) (a passive: PASSIVE_LV + 2 (n-1); one of the skill's own
     element if that level has one),
     so higher levels send you deeper into the woods (bursts and passives into the Sakura Vale); level 5 also needs BOSS_UP of a boss's trophy.
   A skill can list its own price instead: up:{2:{coins,mats:[{id,n}]},...} on its row in SKILLS / PASSIVES.
   Boss skills (rows with drop:'<boss id>' in SKILLS, 6 per boss (six bosses): a skill and a burst for each class) are not for sale: every kill of that boss gives
   every player who helped a BOSS_SKILL_CHANCE roll for each of the boss's skills they do not own yet. They cannot be upgraded yet. */
const MAT_NAMES={slime:'Slime Goo',shroom:'Spore Cap',beetle:'Beetle Shell',boar:'Boar Tusk',goblin:'Goblin Fang',treant:'Living Bark',bogslime:'Bog Ooze',
  deathcap:'Deathcap Venom',ironshell:'Iron Plate',direboar:'Dire Tusk',hobgoblin:'Rusty Buckle',rotwood:'Rotwood Ember',magmaslime:'Magma Core',
  chieftain:"Chieftain's Totem",ancient:'Ancient Sap',crab:'Crab Claw',tideslime:'Sea Glass',scarab:'Scarab Wing',ramboar:'Ram Horn',cragwarden:'Crag Moss',sakuraslime:'Blossom Jelly',kappa:'Kappa Dish',kodama:'Spirit Bell',kabuto:'Kabuto Horn',
  kitsune:'Foxfire Ash',yamaboar:'Mountain Hide',ashigaru:'Lacquered Plate',bamboo:'Singing Bamboo',onibi:'Blue Flame',jorogumo:'Spider Silk',
  oni:'Oni Fang',yurei:'Yurei Shroud',shadowfox:'Night Fur',jadeslime:'Jade Shard',blueoni:'Storm Horn',tengu:'Tengu Feather',samurai:'Samurai Crest',
  goldkabuto:'Gold Shell',sakuratreant:'Elder Blossom',raiju:'Raiju Spark',boss:'Rootwarden Heart',carapax:"Tide King's Claw",akaoni:'Gate Demon Horn',kyuubi:'Kyuubi Tail',
  frostslime:'Frost Jelly',snowboar:'Snow Tusk',icebeetle:'Ice Shell',wolf:'Winter Pelt',reaver:'Reaver Rune',rimewisp:'Rime Spark',rimetreant:'Rimebark',yeti:'Yeti Fur',
  draugr:'Draugr Rune',icewraith:'Wraith Shroud',lynx:'Lynx Claw',crawler:'Glacier Shard',frosttroll:'Troll Tooth',blizzhound:'Hound Fang',revenant:'Revenant Plate',
  barrowwight:'Barrow Ash',alphawolf:'Alpha Fang',glaciergolem:'Golem Core',ymrik:"Rimeking's Crown",vetrmaw:'Wyrm Scale',
  gryphonqueen:"Queen's Plume",mountaingolem:'Black Stone',
  granitslime:'Granite Dust',cliffboar:'Cliff Tusk',crystalbeetle:'Crystal Shard',stonetreant:'Stone Heart',minegoblin:"Miner's Lamp",snowleopard:'Leopard Pelt',cragwyvern:'Wyvern Scale',
  mistwraith:'Mist Essence',quartzslime:'Quartz Core',ibex:'Ibex Horn',rocktroll:'Troll Hide',slatecrawler:'Slate Plate',galedrake:'Drake Scale',granitegolem:'Golem Rune'};
const DROP_CHANCE=0.35, BOSS_DROPS=3, MAT_MAX=999, BOSS_UP=2;
const MATS={}, MAT_IDS=[];
const lighten=c=>'#'+[16,8,0].map(sh=>{ const v=(c>>sh)&255; return Math.round(v+(255-v)*0.35).toString(16).padStart(2,'0'); }).join('');
for(const d of [...MON_DEFS,...BOSS_DEFS.map(b=>b.def)]){ MATS[d.id]={id:d.id,name:MAT_NAMES[d.id],lv:d.level,boss:!!d.boss,col:lighten(d.color),from:d.name}; MAT_IDS.push(d.id); }
const BOSS_SKILL_CHANCE=0.10, BOSS_SKILLS={};   // BOSS_SKILLS[boss id] = the ids of the skills that boss drops
for(const id of SKILL_IDS){ const s=SKILLS[id]; if(s.drop) (BOSS_SKILLS[s.drop]=BOSS_SKILLS[s.drop]||[]).push(id); }
// how many of a monster's material one kill drops (0 = none); bonus is the Scavenger passive
function rollDropCount(def,bonus){ if(def.boss) return BOSS_DROPS; return Math.random()<DROP_CHANCE*(1+(bonus||0))?(Math.random()<0.2?2:1):0; }
const UP_COINS={basic:120,skill:240,burst:600,passive:500}, UP_COUNT=[0,0,4,6,9,14];   // UP_COUNT is indexed by the level you upgrade to
const idHash=str=>[...str].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
// what it costs to raise skill or passive id to level `to`: {coins, mats:[{id,n}]}, or null when there is no such upgrade
function upgradeNeeds(id,to){
  const s=skillDef(id); if(!s||s.drop||!(to>=2)||to>SKILL_MAX_LV) return null;   // (boss skills cannot be upgraded yet)
  if(s.up&&s.up[to]) return s.up[to];
  const lv=Math.min(VALE_TOP_LV,(s.slot==='passive'?PASSIVE_LV:s.lv)+2*(to-1)), pool=MON_DEFS.filter(d=>d.level===lv&&!d.zone), d=pool.find(x=>elOf(x)===elOf(s))||pool[idHash(id)%pool.length];
  const mats=[{id:d.id,n:UP_COUNT[to]}];
  if(to===SKILL_MAX_LV) mats.push({id:lv>=21?'kyuubi':lv>=16?'akaoni':'boss',n:BOSS_UP});
  return {coins:Math.round(UP_COINS[s.slot]*Math.pow(to-1,1.7)/10)*10,mats};
}
