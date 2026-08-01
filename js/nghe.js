"use strict";
/* ============================================================
   9. NGHE BÉ NÓI  —  giữ nút để nói, thả ra là gửi
   ============================================================
   Kiểu chạm-rồi-nói cũ bắt bé phải nói ngay trong vài giây, còn micro thì mở suốt nên
   chỗ ồn là nghe loạn. Giữ nút thì micro chỉ mở đúng lúc bé đang nói, bé có bao nhiêu
   thời gian tuỳ thích, và không còn vòng tự bật lại nào để mà chạy lung tung. */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

const GIU_TOI_DA = 30000;   // lỡ nút kẹt hoặc bé quên thả: 30 giây là tự chốt
const NOI_LAI_TOI_DA = 20;  // số lần nối lại phiên khi trình duyệt tự ngắt giữa chừng

let nhanDang = null;
let dangNghe = false;       // bộ nhận dạng đang chạy
let dangGiu  = false;       // ngón tay bé đang đè nút
let cauChot  = "";          // những mẩu đã nghe chắc chắn, gom lại chờ thả nút
let choGui   = false;       // đã thả nút, đang đợi mẩu chốt cuối cùng
let hetGioGiu = null, dungCoY = false, soNoiLai = 0;

function xoaHenGiu(){ clearTimeout(hetGioGiu); hetGioGiu = null; }

function taoNhanDang(){
  if(!SR) return null;
  const n = new SR();
  /* continuous: giữ phiên chạy suốt lúc bé đè nút, không tự chốt khi bé ngập ngừng.
     interimResults: có chữ hiện lên ngay để bé thấy Skye đang nghe được. */
  n.lang="vi-VN"; n.continuous=true; n.interimResults=true; n.maxAlternatives=1;

  /* bé nhả nút nhanh hơn cả lúc micro kịp mở: phiên vừa mở ra là đóng lại ngay,
     nếu không nó sẽ chạy tiếp không ai tắt và chốt một câu chẳng ai chờ */
  n.onstart = ()=>{
    dangNghe = true;
    if(!dangGiu){ try{ n.stop(); }catch(e){} return; }
    datTrangThai("nghe");
  };

  n.onresult = e=>{
    let tam = "";
    for(let i = e.resultIndex; i < e.results.length; i++){
      const r = e.results[i];
      if(r.isFinal) cauChot += r[0].transcript;
      else          tam     += r[0].transcript;
    }
    const hien = (cauChot + tam).trim();
    if(hien) hienLoi(thoat(hien), true);
  };

  n.onerror = e=>{
    dangNghe = false;
    if(e.error==="not-allowed" || e.error==="service-not-allowed"){
      dangGiu = false; xoaHenGiu(); choPhepNghe = false; datTrangThai("ngu");
      hienLoi("Skye cần bố mẹ cho phép dùng micro trong cài đặt trình duyệt nhé.", true);
      return;
    }
    /* các lỗi khác (no-speech, network…) để onend lo — onend luôn nổ ngay sau onerror,
       xử lý ở cả hai chỗ sẽ thành hai luồng chồng nhau */
  };

  n.onend = ()=>{
    dangNghe = false;
    if(dungCoY){ dungCoY = false; return; }          // bị tắt có chủ ý, nơi gọi tự lo trạng thái
    /* Safari hay tự kết thúc phiên dù bé còn đang giữ — nối lại cho bé nói tiếp */
    if(dangGiu && ++soNoiLai <= NOI_LAI_TOI_DA){ try{ n.start(); }catch(e){} return; }
    dangGiu = false;
    guiCauDaNghe();
  };
  return n;
}

/* bé đè nút xuống */
function batGiu(){
  if(!dangChay || dangGiu) return;
  if(!choPhepNghe){ datTrangThai("ngu"); return; }
  dungNhac(); imNgay();                    // đè nút là cắt lời Skye, tới lượt bé nói
  if(!nhanDang) nhanDang = taoNhanDang();
  if(!nhanDang){
    hienLoi("Trình duyệt này chưa nghe được giọng nói. Bố mẹ mở bằng Safari hoặc Chrome giúp Skye nhé.", true);
    return;
  }
  dangGiu = true; choGui = false; cauChot = ""; soNoiLai = 0;
  xoaHenGiu();
  datTrangThai("nghe");
  hienLoi("Tớ nghe đây, cậu nói đi…", true);
  try{ nhanDang.start(); }catch(e){}       // đang chạy dở thì cứ dùng tiếp phiên đó
  hetGioGiu = setTimeout(nhaGiu, GIU_TOI_DA);
}

/* bé thả nút ra — chỉ ra hiệu dừng, việc gửi để onend làm, để mọi ngả chỉ gửi đúng một lần */
function nhaGiu(){
  if(!dangGiu) return;
  dangGiu = false; choGui = true; xoaHenGiu();
  if(!nhanDang){ guiCauDaNghe(); return; }
  datTrangThai("nghi");
  if(dangNghe){ try{ nhanDang.stop(); }catch(e){} }
  /* chưa kịp onstart thì onstart sẽ tự stop; lỡ chẳng có sự kiện nào về thì lưới an toàn này gửi */
  hetGioGiu = setTimeout(()=>{ try{ nhanDang.abort(); }catch(e){} guiCauDaNghe(); }, 3000);
}

function guiCauDaNghe(){
  if(!choGui) return;                       // gác cửa: chỉ gửi một lần cho mỗi lần giữ nút
  choGui = false; xoaHenGiu();
  const cau = cauChot.trim(); cauChot = "";
  if(cau){ ting(); hienLoi(thoat(cau), true); hoiMimi(cau); return; }
  hienLoi("Tớ chưa nghe thấy gì. Cậu giữ nút rồi nói to hơn một chút nhé!", true);
  datTrangThai("ngu");
}

/* Tắt ngay, không gửi gì (hết giờ chơi, mở góc bố mẹ, chuyển tab).
   abort() vô điều kiện: giữa start() và onstart thì dangNghe vẫn false trong khi bộ nhận
   dạng đã chạy — xét theo cờ đó sẽ bỏ sót và để lại một phiên nghe treo. */
function tatNghe(){
  xoaHenGiu(); dangGiu = false; choGui = false; cauChot = "";
  if(nhanDang){ dungCoY = true; try{ nhanDang.abort(); }catch(e){} }
  dangNghe = false;
}

/* Skye nói/hát/kể xong: về thế chờ, KHÔNG tự mở micro — bé giữ nút mới nghe */
function ketThucLuot(){
  khepMieng();
  datTrangThai("ngu");
}
