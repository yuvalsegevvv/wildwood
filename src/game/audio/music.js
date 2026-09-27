//@ Generative background music
/* ---------- background music: slow chords, a soft bass and sparse plucked notes ---------- */
const mtof=m=>440*Math.pow(2,(m-69)/12);
const DAY_CH=[[50,57,62,66,69],[47,54,57,62,66],[43,50,55,59,62],[45,52,57,61,64]];
const NIGHT_CH=[[50,57,62,65,69],[46,53,58,62,65],[41,48,53,57,60],[45,52,57,60,64]];
const DAY_SC=[62,64,66,69,71,74,76,78,81], NIGHT_SC=[62,65,67,69,72,74,77,79];
function musicTick(){
  const c=SND.ctx, now=c.currentTime, night=envCur.night>0.5;
  if(now+0.3>SND.nextChord){
    const t0=SND.nextChord, dur=9, chords=night?NIGHT_CH:DAY_CH, ch=chords[SND.chordI%chords.length];
    SND.chordI++;
    ch.forEach((m,i)=>tone({bus:'music',type:i%2?'sine':'triangle',freq:mtof(m),dur:4.5,hold:dur-5,attack:2.8,vol:(night?0.028:0.032)*(i===0?1.2:1),filter:'lowpass',ff:night?700:1100,detune:(i-2)*4,when:t0,verb:true}));
    tone({bus:'music',freq:mtof(ch[0]-12),dur:5,hold:2,attack:1.2,vol:0.05,when:t0});
    SND.nextChord=t0+dur;
  }
  if(now+0.3>SND.nextNote){
    const sc=night?NIGHT_SC:DAY_SC;
    if(Math.random()<(night?0.35:0.5)){
      const m=sc[Math.floor(Math.random()*sc.length)];
      tone({bus:'music',type:'sine',freq:mtof(m),dur:1.6,vol:0.045,when:SND.nextNote,echo:true,verb:true});
      tone({bus:'music',type:'triangle',freq:mtof(m+12),dur:0.5,vol:0.01,when:SND.nextNote});
    }
    SND.nextNote+=[0.5,0.75,1,1.5,2][Math.floor(Math.random()*5)]*(night?1.4:1);
  }
}

