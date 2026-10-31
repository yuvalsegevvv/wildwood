//@ Atuqa's skill look (The Terrace Wall): woven red and gold threads and stone flecks drift, sun glints flash, stepped terrace rings are laid on the ground
/* Agent map. Palette: woven red 0xb83a2a, sun gold 0xe8c860, terrace stone 0x8a8478, pale sun 0xfff0b0. Engine: game/skillsets/looks.js (data only). */
ssDefineLook('atuqa',{
  cols:[0xb83a2a,0xe8c860,0x8a8478,0xfff0b0], hot:0xfff0b0, hot2:0xe8c860, decal:'cords', arcCol:0xe8c860,
  mote:[{sh:'streak',c:0,s:0.4,w:3,add:1},{sh:'pebble',c:2,s:0.22,w:3,g:0.7,sway:1},{sh:'glint',c:3,s:0.18,w:2,add:1},{sh:'feather',c:1,s:0.2,w:1,g:0.5,sway:1.5}],
  proj:{sh:'streak',c:1,s:0.5,len:1.2,glow:1,trail:{sh:'pebble',c:2,s:0.3}},
  zone:{mode:'orbit',rate:14}
});
