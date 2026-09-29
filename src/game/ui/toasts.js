//@ Toast messages
/* ----- toasts ----- */
function toast(msg,kind){
  const box=$('#toasts'), el=document.createElement('div'); el.className='toast '+(kind||''); el.textContent=msg; box.append(el);
  while(box.children.length>4) box.firstChild.remove();
  const life=Math.min(9000,Math.max(2800,String(msg).length*55));   // long ones (the main quest's tips) stay long enough to read
  setTimeout(()=>el.classList.add('out'),life); setTimeout(()=>el.remove(),life+600);
}

