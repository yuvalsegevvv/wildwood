//@ The Stuck button in the settings panel: asks the server to send you to the nearest village (the same as typing /stuck in chat)
/* Agent map. Markup #sStuck in index.html; the server side is server/unstuck.js (message stuck, refused in combat, in a dungeon, on the Proving Isle, and for 60 s after a use). Test: tools/unstuck-smoke.js (server side). */
$('#sStuck').addEventListener('click',()=>{ netSend({t:'stuck'}); closePanels(); $('#sound').hidden=true; });
