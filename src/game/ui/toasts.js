//@ Toast messages
/* ----- toasts ----- */
function toast(msg,kind){
  const box=$('#toasts'), el=document.createElement('div'); el.className='toast '+(kind||''); el.textContent=msg; box.append(el);
  while(box.children.length>4) box.firstChild.remove();
  setTimeout(()=>el.classList.add('out'),2800); setTimeout(()=>el.remove(),3400);
}

