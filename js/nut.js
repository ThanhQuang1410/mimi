"use strict";
/* ============================================================
   10. NÚT BẤM
   ============================================================ */
/* Nút mic bật/tắt: chạm một cái là thu, chạm cái nữa là xong (xem batThu/dungThu). */
$("#nutMic").addEventListener("click", ()=>{
  if(!dangChay) return;
  if(dangThu){ ting(); dungThu(); return; }        // đang thu → chốt lại và gửi
  /* bé chạm lúc Skye đang nói/hát/kể: cắt lời rồi tới lượt bé.
     Phải cắt TRƯỚC khi mở micro — imNgay() làm callback của tiếng nói đang dở chạy nốt,
     mà callback đó gọi ketThucLuot(); ketThucLuot() có chốt bỏ qua khi đang thu. */
  if(trangThai === "noi"){ dungNhac(); imNgay(); }
  ting(); batThu();
});

$("#batDau").addEventListener("click", ()=>{
  if(dangKhoa()){ moManNgu(); return; }
  $("#phuBatDau").classList.add("an");
  dangChay = true; choPhepNghe = true;
  amThanh(); xinKhoaManHinh();
  try{ const u = new SpeechSynthesisUtterance(" "); u.volume=0; tongHop.speak(u); }catch(e){}
  moKhoaTruyen();                       // mở khoá <audio> ngay trong cú chạm này, xem phatTruyen()
  batDauPhien();
  if(!sanSang()){ moBoMe("Bố mẹ nhập mã API miễn phí để Skye biết nói nhé."); return; }
  lichSu = [];
  hoiMimi("(Bé vừa mở Skye lên. Hãy chào bé thật ấm áp, nhắc lại một điều bạn nhớ về bé nếu có, rồi hỏi bé muốn làm gì. Lượt này CHỈ chào hỏi thôi — tuyệt đối không lồng từ tiếng Anh nào, để dành cho các lượt sau.)", true, true);
});
