"use strict";
/* ============================================================
   10. NÚT BẤM
   ============================================================ */
/* Nút mic là kiểu "giữ để nói": đè xuống thì nghe, thả ra là gửi (xem batGiu/nhaGiu).
   Dùng pointer event để chuột và ngón tay đi chung một đường, và setPointerCapture để
   bé có kéo ngón ra ngoài nút thì lúc thả vẫn nhận được. */
const nutMic = $("#nutMic");
nutMic.addEventListener("contextmenu", e=>e.preventDefault());   // giữ lâu trên di động không hiện menu
nutMic.addEventListener("pointerdown", e=>{
  if(!dangChay) return;
  e.preventDefault();
  try{ nutMic.setPointerCapture(e.pointerId); }catch(err){}
  batGiu();
});
const thaNut = e=>{
  if(!dangChay) return;
  e.preventDefault();
  nhaGiu();
};
nutMic.addEventListener("pointerup", thaNut);
nutMic.addEventListener("pointercancel", thaNut);

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
