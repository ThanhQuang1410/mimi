"use strict";
/* ============================================================
   9. NGHE BÉ NÓI
   ============================================================ */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let nhanDang = null, dangNghe = false;
function taoNhanDang(){
  if(!SR) return null;
  const n = new SR();
  n.lang="vi-VN"; n.continuous=false; n.interimResults=false; n.maxAlternatives=1;
  n.onstart = ()=>{ dangNghe=true; datTrangThai("nghe"); };
  n.onresult = e=>{
    const cau = (e.results[0][0].transcript||"").trim();
    if(!cau) return;
    hienLoi(thoat(cau), true); ting(); hoiMimi(cau);
  };
  n.onerror = e=>{
    dangNghe = false;
    if(e.error==="not-allowed" || e.error==="service-not-allowed"){
      choPhepNghe = false; datTrangThai("ngu");
      hienLoi("Skye cần bố mẹ cho phép dùng micro trong cài đặt trình duyệt nhé.", true); return;
    }
    if(trangThai==="nghe") setTimeout(batNghe,500);
  };
  n.onend = ()=>{ dangNghe=false; if(choPhepNghe && trangThai==="nghe") setTimeout(batNghe,260); };
  return n;
}
function batNghe(){
  if(!choPhepNghe || dangNghe) return;
  if(trangThai==="noi" || trangThai==="nghi") return;
  if(!nhanDang) nhanDang = taoNhanDang();
  if(!nhanDang){ hienLoi("Trình duyệt này chưa nghe được giọng nói. Bố mẹ mở bằng Safari hoặc Chrome giúp Skye nhé.", true); return; }
  try{ nhanDang.start(); }catch(e){}
}
function tatNghe(){ if(nhanDang && dangNghe){ try{ nhanDang.abort(); }catch(e){} } dangNghe = false; }
function ketThucLuot(){
  khepMieng();
  if(!choPhepNghe){ datTrangThai("ngu"); return; }
  datTrangThai("nghe"); setTimeout(batNghe,320);
}

