//@ The puzzle lab's extra difficulties 6-10 (just for fun: the game stops at 5): rows appended to each kind's difficulty table, and PZ_DIFF names
/* Agent map. Inlined by tools/puzzle-lab.js after the shared puzzle files (they share one scope there); it pushes rows onto the kinds' D tables (RL_D, IC_D, SU_D, AK_D, SL_D, BR_D, MR_D, NG_D, SK_D)
   and raises PZ_MAX_DIFF to 10. Never part of the game bundles. Test: tools/puzzles-smoke.js (the lab rows generate: --lab). */
RL_D.push({w:13,h:13,k:8,min:3,kmax:44,cap:30000,merge:14,round:2500},{w:14,h:14,k:9,min:3,kmax:48,cap:30000,merge:14,round:2500},{w:14,h:14,k:10,min:3,kmax:54,cap:30000,merge:12,round:2500},{w:15,h:15,k:10,min:3,kmax:54,cap:30000,merge:10,round:2500},{w:16,h:16,k:11,min:3,kmax:60,cap:30000,merge:8,round:2500});
IC_D.push({w:13,h:13,rock:28,sw:1,cr:6,twin:1,lo:15,hi:24},{w:14,h:14,rock:32,sw:2,cr:7,twin:1,lo:17,hi:26},{w:15,h:15,rock:36,sw:2,cr:8,twin:1,lo:19,hi:28},{w:16,h:16,rock:40,sw:3,cr:9,twin:1,lo:21,hi:30},{w:18,h:18,rock:50,sw:3,cr:10,twin:1,lo:23,hi:34});
SU_D.push({n:9,bh:3,bw:3,blank:50,singles:0},{n:9,bh:3,bw:3,blank:52,singles:0},{n:9,bh:3,bw:3,blank:54,singles:0},{n:9,bh:3,bw:3,blank:56,singles:0},{n:9,bh:3,bw:3,blank:58,singles:0});
AK_D.push({w:14,h:14,rock:0.18},{w:14,h:14,rock:0.18},{w:15,h:15,rock:0.18},{w:15,h:15,rock:0.2},{w:16,h:16,rock:0.2});
SL_D.push({w:13,h:13,fill:0.5,keep:0.45},{w:14,h:14,fill:0.5,keep:0.45},{w:15,h:15,fill:0.5,keep:0.45},{w:16,h:16,fill:0.5,keep:0.45},{w:17,h:17,fill:0.5,keep:0.45});
BR_D.push({w:18,h:18,isl:80,extra:0.3},{w:20,h:20,isl:100,extra:0.3},{w:23,h:23,isl:130,extra:0.3},{w:24,h:24,isl:140,extra:0.3},{w:26,h:26,isl:150,extra:0.3});
MR_D.push({w:13,h:13,mir:14,pr:5,tgt:7,src:3,decoy:8},{w:14,h:14,mir:17,pr:6,tgt:8,src:4,decoy:10},{w:16,h:16,mir:21,pr:7,tgt:9,src:4,decoy:8},{w:18,h:18,mir:26,pr:8,tgt:10,src:5,decoy:10},{w:20,h:20,mir:32,pr:10,tgt:12,src:6,decoy:12});
NG_D.push({n:25,pics:2},{n:30,pics:2},{n:35,pics:2},{n:40,pics:2},{n:45,pics:2});
SK_D.push({w:13,h:12,box:9,pulls:130,lo:30,rects:4,rocks:11,far:30},{w:14,h:12,box:10,pulls:150,lo:30,rects:5,rocks:12,far:36},{w:15,h:13,box:11,pulls:170,lo:30,rects:5,rocks:14,far:42},{w:16,h:14,box:12,pulls:190,lo:30,rects:5,rocks:16,far:48},{w:18,h:15,box:14,pulls:220,lo:30,rects:6,rocks:18,far:60});
PZ_DIFF.push({name:'Brutal',target:900,gems:0,sigils:0},{name:'Savage',target:1200,gems:0,sigils:0},{name:'Merciless',target:1800,gems:0,sigils:0},{name:'Insane',target:2400,gems:0,sigils:0},{name:'Impossible',target:3600,gems:0,sigils:0});
PZ_MAX_DIFF=10;
