"use strict";
document.addEventListener("visibilitychange", ()=>{
  if(document.hidden){ tatNghe(); dungNhac(); imNgay(); }
  else if(dangChay && sanSang() && $("#bome").classList.contains("an") && $("#ngu").classList.contains("an")){
    xinKhoaManHinh();
    if(conLai() <= 0) ketThucPhien(); else { chayDongHo(); ketThucLuot(); }
  }
});

(function khoiDong(){
  if(CAI.ten) $("#chaoMo").textContent = `Skye đang đợi ${CAI.ten} đó!`;
  veDongHo();
  if(dangKhoa()){ $("#phuBatDau").classList.add("an"); moManNgu(); }
  if(!KHO.ok) console.warn("Trình duyệt chặn localStorage — trí nhớ sẽ mất khi đóng tab.");
})();
