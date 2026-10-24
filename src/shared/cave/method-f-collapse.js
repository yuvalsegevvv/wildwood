//@ Cave method F, Collapse run: every few minutes a tremor (announced) opens a sealed vault for 90 seconds on a floor; everyone there races to it
defineCaveMethod({id:'F',name:'Collapse run',short:'Reach the vault before the tunnel caves in',blurb:'Every few minutes the floor trembles and a sealed vault opens for 90 seconds before the tunnel caves in. Everyone on the floor races for it.',
  dress:['Sealed vault','Sealed geode vault','Sealed flooded vault','Sealed magma vault'],p:{first:90,every:[360,480],warn:20,open:90,reach:2.8}});
