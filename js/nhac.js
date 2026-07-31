"use strict";
const N = {C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,C5:523.25,G3:196};
const BAI = {
  sao:{nhip:.42,not:[["C4",1],["C4",1],["G4",1],["G4",1],["A4",1],["A4",1],["G4",2],
    ["F4",1],["F4",1],["E4",1],["E4",1],["D4",1],["D4",1],["C4",2],
    ["G4",1],["G4",1],["F4",1],["F4",1],["E4",1],["E4",1],["D4",2],
    ["G4",1],["G4",1],["F4",1],["F4",1],["E4",1],["E4",1],["D4",2],
    ["C4",1],["C4",1],["G4",1],["G4",1],["A4",1],["A4",1],["G4",2],
    ["F4",1],["F4",1],["E4",1],["E4",1],["D4",1],["D4",1],["C4",3]]},
  buom:{nhip:.40,not:[["C4",1],["D4",1],["E4",1],["C4",1],["C4",1],["D4",1],["E4",1],["C4",1],
    ["E4",1],["F4",1],["G4",2],["E4",1],["F4",1],["G4",2],
    ["G4",.5],["A4",.5],["G4",.5],["F4",.5],["E4",1],["C4",1],
    ["G4",.5],["A4",.5],["G4",.5],["F4",.5],["E4",1],["C4",1],
    ["C4",1],["G3",1],["C4",2],["C4",1],["G3",1],["C4",3]]},
  cuu:{nhip:.40,not:[["E4",1],["D4",1],["C4",1],["D4",1],["E4",1],["E4",1],["E4",2],
    ["D4",1],["D4",1],["D4",2],["E4",1],["G4",1],["G4",2],
    ["E4",1],["D4",1],["C4",1],["D4",1],["E4",1],["E4",1],["E4",1],["E4",1],
    ["D4",1],["D4",1],["E4",1],["D4",1],["C4",3]]},
  cau:{nhip:.36,not:[["G4",1.5],["A4",.5],["G4",1],["F4",1],["E4",1],["F4",1],["G4",2],
    ["D4",1],["E4",1],["F4",2],["E4",1],["F4",1],["G4",2],
    ["G4",1.5],["A4",.5],["G4",1],["F4",1],["E4",1],["F4",1],["G4",2],
    ["D4",2],["G4",1],["E4",1],["C4",3]]},
  thuyen:{nhip:.36,not:[["C4",1],["C4",1],["C4",1],["D4",.5],["E4",1.5],
    ["E4",1],["D4",.5],["E4",1],["F4",.5],["G4",2.5],
    ["C5",.5],["C5",.5],["G4",.5],["G4",.5],["E4",.5],["E4",.5],["C4",.5],["C4",.5],
    ["G4",1],["F4",.5],["E4",1],["D4",.5],["C4",3]]},
  nongtrai:{nhip:.34,not:[["G4",1],["G4",1],["G4",1],["D4",1],["E4",1],["E4",1],["D4",2],
    ["B4",1],["B4",1],["A4",1],["A4",1],["G4",3],
    ["D4",1],["G4",1],["G4",1],["G4",1],["D4",1],["E4",1],["E4",1],["D4",2],
    ["B4",1],["B4",1],["A4",1],["A4",1],["G4",3]]}
};

let hetNhac = null;
function phatBai(id){
  const b = BAI[id]; if(!b){ ketThucLuot(); return; }
  dungNhac();
  const c = amThanh(); if(c.state==="suspended") c.resume();
  let t = c.currentTime+.12; const nguon = [];
  b.not.forEach(([tn,dai])=>{
    const f = N[tn]; if(!f) return;
    const d = dai*b.nhip;
    [[f,.30,"sine"],[f*2,.09,"triangle"],[f*.5,.06,"sine"]].forEach(([fr,vol,ty])=>{
      const o=c.createOscillator(), g=c.createGain();
      o.type=ty; o.frequency.value=fr;
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+.015);
      g.gain.exponentialRampToValueAtTime(.0001,t+d*.96);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t+d); nguon.push(o);
    });
    t += d;
  });
  datTrangThai("noi");
  const xong = setTimeout(()=>{ hetNhac=null; ketThucLuot(); },(t-c.currentTime)*1000+260);
  hetNhac = ()=>{ clearTimeout(xong); nguon.forEach(o=>{try{o.stop()}catch(e){}}); hetNhac=null; };
}
function dungNhac(){ if(hetNhac) hetNhac(); dungTruyen(); }
function ting(){
  try{ const c=amThanh(); if(c.state==="suspended") c.resume();
    const o=c.createOscillator(), g=c.createGain();
    o.type="sine"; o.frequency.setValueAtTime(880,c.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320,c.currentTime+.09);
    g.gain.setValueAtTime(.16,c.currentTime); g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.26);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime+.28);
  }catch(e){}
}

