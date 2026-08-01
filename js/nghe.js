"use strict";
/* ============================================================
   9. NGHE BÉ NÓI  —  chạm để bắt đầu thu, chạm lần nữa là xong
   ============================================================ */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

const TOI_DA_THU = 20000;   // một lượt thu tối đa 20 giây rồi tự chốt
const NOI_LAI_TOI_DA = 20;  // số lần nối lại phiên khi trình duyệt tự ngắt giữa chừng
const NHIP_GAC = 1500;      // nhịp của lưới chống kẹt

let nhanDang = null;
let dangNghe = false;       // bộ nhận dạng đang thật sự chạy
let dangThu  = false;       // Skye đang trong lượt thu của bé
let cauChot  = "";          // các mẩu đã nghe chắc chắn
let choGui   = false;       // đã chốt, đang đợi mẩu cuối cùng
let hetGio = null, dungCoY = false, soNoiLai = 0, nhipKet = 0;

/* ---------- ô chữ nhỏ: bé nói gì hiện ngay lên đó ---------- */
const oLoiBe = $("#loiBe");
function veLoiBe(chu, xong){
  if(!oLoiBe) return;
  oLoiBe.textContent = chu || "";
  oLoiBe.classList.toggle("hien", !!chu);
  oLoiBe.classList.toggle("xong", !!xong);
}
function xoaLoiBe(){ veLoiBe("", false); }

/* ---------- lưới chống kẹt ----------
   Bất kể vì lý do gì (trình duyệt nuốt sự kiện, micro không mở được, phiên chết âm thầm),
   giao diện không được phép nằm mãi ở "đang nghe". Cứ 1,5 giây soi một lần: đang hiện
   "nghe" mà không có phiên nhận dạng nào sống thì gỡ ra. */
function gacKet(){
  if(trangThai !== "nghe"){ nhipKet = 0; return; }
  /* còn hẹn giờ chốt (hetGio) nghĩa là lượt thu vẫn có hạn chót đàng hoàng, cứ để yên */
  if(dangThu && hetGio){ nhipKet = 0; return; }
  if(choGui){ nhipKet = 0; return; }
  if(++nhipKet < 3) return;                     // cho ~4,5 giây để micro kịp mở
  console.warn("Kẹt ở trạng thái nghe:", {dangThu, dangNghe, choGui, cauChot});
  nhipKet = 0;
  const cau = cauChot.trim();
  thoiThu();
  if(cau){ guiCau(cau); return; }
  hienLoi("Micro chưa mở được. Bố mẹ kiểm tra quyền micro cho Skye giúp nhé!", true);
  datTrangThai("ngu");
}
setInterval(gacKet, NHIP_GAC);

function taoNhanDang(){
  if(!SR) return null;
  const n = new SR();
  /* continuous: bé ngập ngừng giữa câu cũng không bị cắt lượt.
     interimResults: có chữ hiện lên ngay để biết chắc là đã thu được tiếng. */
  n.lang="vi-VN"; n.continuous=true; n.interimResults=true; n.maxAlternatives=1;

  n.onstart = ()=>{
    dangNghe = true;
    if(!dangThu){ try{ n.stop(); }catch(e){} return; }   // đã chốt trước khi micro kịp mở
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
    if(hien) veLoiBe(hien, false);
  };

  n.onerror = e=>{
    dangNghe = false;
    console.warn("Lỗi nhận dạng giọng nói:", e.error);
    if(e.error==="not-allowed" || e.error==="service-not-allowed"){
      thoiThu(); choPhepNghe = false; datTrangThai("ngu");
      hienLoi("Skye cần bố mẹ cho phép dùng micro trong cài đặt trình duyệt nhé.", true);
      return;
    }
    /* lỗi khác (no-speech, network, audio-capture…) để onend lo — onend luôn nổ ngay sau
       onerror, xử lý ở cả hai chỗ sẽ thành hai luồng chồng nhau */
  };

  n.onend = ()=>{
    dangNghe = false;
    if(dungCoY){ dungCoY = false; return; }        // bị tắt có chủ ý, nơi gọi tự lo trạng thái
    /* Safari hay tự kết thúc phiên dù bé còn đang thu — nối lại cho bé nói tiếp */
    if(dangThu && !choGui && ++soNoiLai <= NOI_LAI_TOI_DA){ try{ n.start(); }catch(e){} return; }
    /* ĐÂY LÀ CHỖ TỪNG GÂY KẸT: hết lượt nối lại mà tới thẳng chotVaGui() thì cờ choGui
       vẫn còn false, chotVaGui() lặng lẽ quay ra, không ai đổi trạng thái — giao diện
       nằm lại ở "đang nghe" vĩnh viễn. Phải mở cửa gửi trước khi gọi. */
    if(dangThu){ dangThu = false; choGui = true; clearTimeout(hetGio); hetGio = null; }
    chotVaGui();
  };
  return n;
}

/* chạm lần đầu: mở micro */
function batThu(){
  if(!dangChay || dangThu) return;
  if(!choPhepNghe){ datTrangThai("ngu"); return; }
  if(!nhanDang) nhanDang = taoNhanDang();
  if(!nhanDang){
    hienLoi("Trình duyệt này chưa nghe được giọng nói. Bố mẹ mở bằng Safari hoặc Chrome giúp Skye nhé.", true);
    return;
  }
  dangThu = true; choGui = false; cauChot = ""; soNoiLai = 0; nhipKet = 0;
  clearTimeout(hetGio);
  datTrangThai("nghe");
  hienLoi("Tớ nghe đây, cậu nói đi…", true);
  veLoiBe("…", false);
  try{ nhanDang.start(); }catch(e){}             // đang chạy dở thì dùng tiếp phiên đó
  hetGio = setTimeout(dungThu, TOI_DA_THU);      // quên chạm lần hai thì tự chốt
}

/* chạm lần hai: chốt lại và gửi. Việc gửi để onend làm, mọi ngả chỉ gửi đúng một lần. */
function dungThu(){
  if(!dangThu) return;
  dangThu = false; choGui = true;
  clearTimeout(hetGio);
  if(!nhanDang){ chotVaGui(); return; }
  datTrangThai("nghi");
  if(dangNghe){ try{ nhanDang.stop(); }catch(e){} }
  /* chưa kịp onstart thì onstart sẽ tự stop; lỡ chẳng có sự kiện nào về thì lưới này gửi */
  hetGio = setTimeout(()=>{ try{ nhanDang.abort(); }catch(e){} chotVaGui(); }, 3000);
}

/* bỏ hẳn lượt thu, không gửi gì */
function thoiThu(){
  clearTimeout(hetGio); hetGio = null;
  dangThu = false; choGui = false; cauChot = "";
  if(nhanDang){ dungCoY = true; try{ nhanDang.abort(); }catch(e){} }
  dangNghe = false;
}

function chotVaGui(){
  if(!choGui) return;                            // gác cửa: mỗi lượt thu chỉ gửi một lần
  choGui = false; clearTimeout(hetGio); hetGio = null;
  const cau = cauChot.trim(); cauChot = "";
  if(cau){ guiCau(cau); return; }
  veLoiBe("(chưa nghe được gì)", true);
  setTimeout(xoaLoiBe, 2600);
  hienLoi("Tớ chưa nghe thấy gì. Cậu chạm vào tớ rồi nói to hơn một chút nhé!", true);
  datTrangThai("ngu");
}

function guiCau(cau){
  veLoiBe(cau, true);
  ting(); hienLoi(thoat(cau), true); hoiMimi(cau);
}

/* Tắt ngay, không gửi gì (hết giờ chơi, mở góc bố mẹ, chuyển tab) */
function tatNghe(){ thoiThu(); xoaLoiBe(); }

/* Skye nói/hát/kể xong: về thế chờ, KHÔNG tự mở micro — bé chạm mới nghe.
   Không được giẫm lên lượt thu: bé chạm nút lúc Skye đang nói sẽ cắt lời, và tiếng nói
   bị cắt đó vẫn gọi nốt callback của nó ngay sau khi bé đã bắt đầu thu. */
function ketThucLuot(){
  khepMieng();
  if(dangThu || choGui) return;
  datTrangThai("ngu");
}
