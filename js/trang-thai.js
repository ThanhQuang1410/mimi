"use strict";
/* ============================================================
   3. TRẠNG THÁI CHUNG
   ============================================================ */
const $ = s => document.querySelector(s);
const body = document.body, bong = $("#bong"), micChu = $("#micChu");
let lichSu = [], dangChay = false, trangThai = "ngu", choPhepNghe = false;

function datTrangThai(t){
  if(window.Mimi3D && window.Mimi3D.ready) window.Mimi3D.setTrangThai(t);
  trangThai = t;
  body.classList.remove("nghe","nghi","noi");
  if(t !== "ngu") body.classList.add(t);
  /* "ngu" vừa là lúc hết giờ chơi, vừa là thế chờ giữa hai lượt — phân biệt bằng dangChay */
  micChu.textContent = t==="nghe" ? "Skye đang nghe…" : t==="nghi" ? "Skye đang nghĩ…"
                     : t==="noi"  ? "Skye đang nói…"  : dangChay ? "Chạm để nói" : "Skye đang ngủ";
  /* mỗi trạng thái một mặt nút riêng, để bé nhìn là biết chạm sẽ ra gì */
  const bt = $("#nutMicBt"), nh = $("#nutMicNh");
  if(bt && nh){
    bt.textContent = t==="nghe" ? "✅" : t==="nghi" ? "✨" : t==="noi" ? "🔊" : "🎙️";
    nh.textContent = t==="nghe" ? "Nói xong thì chạm" : t==="nghi" ? "Đang nghĩ…" : "Chạm để nói";
  }
}
function hienLoi(t,mo=false){ bong.classList.toggle("mo",mo); bong.innerHTML = t; }
function thoat(s){ const d=document.createElement("div"); d.textContent=s??""; return d.innerHTML; }

(function nen(){
  const n = $("#nen");
  for(let i=0;i<7;i++){ const m=document.createElement("div"); m.className="may"; const w=90+Math.random()*160;
    m.style.cssText=`width:${w}px;height:${w*.42}px;top:${Math.random()*72}%;animation-duration:${38+Math.random()*38}s;animation-delay:-${Math.random()*40}s;opacity:${.3+Math.random()*.3}`;
    n.appendChild(m); }
  for(let i=0;i<16;i++){ const s=document.createElement("div"); s.className="sao"; s.textContent=["✦","✧","·","⋆"][i%4];
    s.style.cssText=`left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:-${Math.random()*4}s;color:${["#FFD98E","#FFB8D2","#C9B6F5"][i%3]}`;
    n.appendChild(s); }
})();

