//@ Cave method E, The silent chamber: cross from the entry to the shrine past a sleeping guardian; running, fighting and casting add noise, and a full meter throws you out
defineCaveMethod({id:'E',name:'The silent chamber',short:'Cross to the shrine without waking the guardian',blurb:'A guardian sleeps in the chamber between the entry and the shrine. Running, fighting and casting make noise. Fill the meter and it wakes and throws you out.',
  dress:['Sleeping warden','Sleeping crystal giant','Sleeping tide beast','Sleeping magma hound'],
  p:{enter:3.2,shrine:2.6,max:100,run:28,walk:7,still:-10,basic:6,skill:14,runV:7,lock:3,floorK:0.12}});
