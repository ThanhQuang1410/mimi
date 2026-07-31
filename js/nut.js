"use strict";
/* ============================================================
   10. NÚT BẤM
   ============================================================ */
$("#nutMic").addEventListener("click", ()=>{
  if(!dangChay) return;
  ting();
  if(trangThai === "noi"){
    dungNhac(); imNgay();
    hienLoi("Tớ im lặng đây. Cậu muốn nói gì nào?", true); ketThucLuot();
  }else if(trangThai === "nghe" || trangThai === "nghi"){
    dungNhac(); tatNghe(); imNgay();
    ketThucLuot();
  }
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

