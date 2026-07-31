"use strict";
/* ============================================================
   4. ĐỒNG HỒ CHƠI
   ============================================================ */
let PHIEN = KHO.doc("mimi_phien", { batDau:0, khoaDen:0 });
let dongHo = null, daNhac5 = false;
const conLai = ()=> !PHIEN.batDau ? CAI.phut*60
  : Math.max(0, CAI.phut*60 - Math.floor((Date.now()-PHIEN.batDau)/1000));
const dangKhoa = ()=> PHIEN.khoaDen > Date.now();
const phutGiay = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

function veDongHo(){
  const s = conLai(), ti = s/(CAI.phut*60);
  $("#catChu").textContent = phutGiay(s);
  $("#catTrong").style.width = (ti*100)+"%";
  $("#catTrong").style.background = ti>.4?"var(--bac-ha)":ti>.15?"var(--nang)":"var(--hong-dam)";
}
function batDauPhien(){ PHIEN.batDau = Date.now(); daNhac5 = false; KHO.ghi("mimi_phien",PHIEN); chayDongHo(); }
function chayDongHo(){
  clearInterval(dongHo); veDongHo();
  dongHo = setInterval(()=>{
    veDongHo();
    const s = conLai();
    if(s<=300 && !daNhac5 && s>240){
      daNhac5 = true;
      if(trangThai!=="noi"){
        const c = `Còn năm phút nữa thôi là tớ phải đi ngủ đó ${ten()}. Mình chơi nốt nhé!`;
        hienLoi(c); tatNghe(); noi(c, ketThucLuot);
      }
    }
    if(s<=0) ketThucPhien();
  },1000);
}
function ketThucPhien(){
  clearInterval(dongHo);
  PHIEN.khoaDen = Date.now() + CAI.nghi*60000; PHIEN.batDau = 0;
  KHO.ghi("mimi_phien",PHIEN);
  choPhepNghe = false; tatNghe(); dungNhac(); nhaKhoaManHinh();
  const c = `Hết giờ chơi rồi ${ten()} ơi. Tớ đi ngủ đây. <en>Good night|chúc ngủ ngon</en>!`;
  hienLoi(dep(c));
  noi(c, ()=>{ khepMieng(); datTrangThai("ngu"); moManNgu(); });
  setTimeout(moManNgu, 9000);
}
function moManNgu(){
  $("#ngu").classList.remove("an"); clearInterval(dongHo);
  dongHo = setInterval(()=>{
    const con = Math.max(0, Math.ceil((PHIEN.khoaDen-Date.now())/1000));
    $("#dem").textContent = phutGiay(con);
    if(con<=0){ clearInterval(dongHo); $("#ngu").classList.add("an"); $("#phuBatDau").classList.remove("an"); }
  },1000);
}
function congBoMe(){
  const a = 6+Math.floor(Math.random()*8), b = 6+Math.floor(Math.random()*8);
  const tl = prompt(`Xác nhận bố mẹ: ${a} × ${b} = ?`);
  return tl!==null && parseInt(tl,10) === a*b;
}
$("#moKhoa").addEventListener("click", ()=>{
  if(!congBoMe()) return;
  clearInterval(dongHo); PHIEN.khoaDen = 0; KHO.ghi("mimi_phien",PHIEN);
  $("#ngu").classList.add("an"); $("#phuBatDau").classList.remove("an");
  xinKhoaManHinh();
});

