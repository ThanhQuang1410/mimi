"use strict";
/* ============================================================
   9. NGHE BÉ NÓI
   ============================================================ */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

/* Chỗ ồn (tivi, quạt, nhiều người nói) làm bộ nhận dạng không bao giờ thấy khoảng lặng để
   chốt câu: onresult không nổ, phiên nghe treo vô hạn, Skye đứng mãi ở "đang nghe". Vì vậy
   mỗi lượt nghe phải có hạn giờ, và nghe hụt vài lần liên tiếp thì tạm nghỉ chờ bé chạm. */
const GIOI_HAN_NGHE = 12000;   // một lượt nghe tối đa 12 giây rồi chốt lại
const CHO_CHOT      = 2500;    // sau khi bảo dừng, chờ ngần này rồi cắt hẳn
const NGHI_KHI_ON   = 3;       // hụt liên tiếp bấy nhiêu lần thì thôi tự bật lại

let nhanDang = null, dangNghe = false;
let hetGio = null, choChot = null, coKetQua = false, hutLienTiep = 0, dungCoY = false;

function xoaHenGio(){ clearTimeout(hetGio); clearTimeout(choChot); hetGio = choChot = null; }

/* Hết giờ: gọi stop() trước (bộ nhận dạng còn cơ hội trả về câu nó đã nghe được),
   nếu vẫn im thì abort() cho dứt điểm. */
function henGioNghe(n){
  xoaHenGio();
  hetGio = setTimeout(()=>{
    try{ n.stop(); }catch(e){}
    choChot = setTimeout(()=>{ try{ n.abort(); }catch(e){} }, CHO_CHOT);
  }, GIOI_HAN_NGHE);
}

function tamNghiVoiTiengOn(){
  hutLienTiep = 0;
  xoaHenGio();
  datTrangThai("ngu");
  micChu.textContent = "Chỗ này ồn quá…";
  hienLoi("Ở đây ồn quá, tớ nghe không rõ. Cậu chạm vào nút hồng rồi nói với tớ nhé!", true);
}

function taoNhanDang(){
  if(!SR) return null;
  const n = new SR();
  n.lang="vi-VN"; n.continuous=false; n.interimResults=false; n.maxAlternatives=1;
  n.onstart = ()=>{ dangNghe=true; coKetQua=false; dungCoY=false; datTrangThai("nghe"); henGioNghe(n); };
  n.onresult = e=>{
    const cau = (e.results[0][0].transcript||"").trim();
    if(!cau) return;
    coKetQua = true; hutLienTiep = 0; xoaHenGio();
    hienLoi(thoat(cau), true); ting(); hoiMimi(cau);
  };
  n.onerror = e=>{
    dangNghe = false; xoaHenGio();
    if(e.error==="not-allowed" || e.error==="service-not-allowed"){
      choPhepNghe = false; datTrangThai("ngu");
      hienLoi("Skye cần bố mẹ cho phép dùng micro trong cài đặt trình duyệt nhé.", true); return;
    }
    /* không tự bật lại ở đây — onend luôn nổ ngay sau onerror và lo việc đó,
       đặt lịch ở cả hai chỗ sẽ thành hai vòng bật lại chồng lên nhau */
  };
  n.onend = ()=>{
    dangNghe = false; xoaHenGio();
    /* chỉ tính là "nghe hụt" khi phiên tự tắt vì không nghe ra gì — bị tắt có chủ ý
       (bé chạm nút, hết giờ chơi, chuyển tab) thì không được tính */
    if(dungCoY){ dungCoY = false; return; }
    if(!coKetQua && ++hutLienTiep >= NGHI_KHI_ON){ tamNghiVoiTiengOn(); return; }
    if(choPhepNghe && trangThai==="nghe") setTimeout(batNghe, 260);
  };
  return n;
}
function batNghe(){
  if(!choPhepNghe || dangNghe) return;
  if(trangThai==="noi" || trangThai==="nghi") return;
  if(!nhanDang) nhanDang = taoNhanDang();
  if(!nhanDang){ hienLoi("Trình duyệt này chưa nghe được giọng nói. Bố mẹ mở bằng Safari hoặc Chrome giúp Skye nhé.", true); return; }
  try{ nhanDang.start(); }catch(e){}
}
/* abort() vô điều kiện: giữa lúc start() và onstart thì dangNghe vẫn còn false trong khi
   bộ nhận dạng đã chạy — xét theo cờ đó sẽ bỏ sót và để lại một phiên nghe treo. */
function tatNghe(){
  xoaHenGio();
  if(nhanDang){ dungCoY = true; try{ nhanDang.abort(); }catch(e){} }
  dangNghe = false;
}
function ketThucLuot(){
  khepMieng();
  if(!choPhepNghe){ datTrangThai("ngu"); return; }
  hutLienTiep = 0;
  datTrangThai("nghe"); setTimeout(batNghe,320);
}
