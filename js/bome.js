"use strict";
/* ============================================================
   11. GÓC BỐ MẸ
   ============================================================ */
let tepDangXem = null;
function veTep(){
  const hop = $("#tep"); hop.innerHTML = "";
  const ds = FS.duong();
  if(!ds.length){ hop.innerHTML = '<span class="ghi">Chưa có tệp nào.</span>'; $("#noiDung").value=""; return; }
  if(!ds.includes(tepDangXem)) tepDangXem = ds[0];
  ds.forEach(p=>{
    const b = document.createElement("button");
    b.className = "tepn" + (p===tepDangXem ? " chon" : "");
    b.innerHTML = `${p.replace("/nho/","")} <span class="sz">${(FS.doc(p)||"").length}</span>`;
    b.addEventListener("click", ()=>{ luuTepDangXem(); tepDangXem = p; veTep(); });
    hop.appendChild(b);
  });
  $("#noiDung").value = FS.doc(tepDangXem) || "";
}
function luuTepDangXem(){
  if(tepDangXem && $("#noiDung").value !== (FS.doc(tepDangXem)||"")) FS.ghi(tepDangXem, $("#noiDung").value);
}
$("#toc").addEventListener("input", e=>{ CAI.toc = +e.target.value; $("#tocSo").textContent = CAI.toc.toFixed(2); });
$("#giongGem").addEventListener("change", e=>{ CAI.giongGem = e.target.value; $("#ngheThu").click(); });
$("#ngheThu").addEventListener("click", ()=>{
  imNgay(); amThanh();
  const b = $("#ngheThu"); b.textContent = "… đang đọc";
  noi(`Chào ${ten()}! Tớ là Skye, bạn chó cứu hộ của cậu đây. Hôm nay mình học từ <en>butterfly|con bướm</en> nhé!`,
      ()=>{ b.textContent = "▶︎ Nghe thử"; });
});

function veQuota(){
  kiemNgay();
  const thanh = (d,t,mau)=>{
    const ti = Math.min(100, d/t*100);
    return `<div style="margin-bottom:9px">
      <div style="display:flex;justify-content:space-between;font-size:.84rem;font-weight:700">
        <span>${mau[2]}</span><span style="color:var(--than-mo)">${d} / ${t}</span></div>
      <div style="height:8px;border-radius:99px;background:rgba(169,139,154,.2);overflow:hidden;margin-top:3px">
        <div style="height:100%;width:${ti}%;background:${ti>85?"var(--hong-dam)":ti>60?"var(--nang)":"var(--bac-ha)"}"></div>
      </div></div>`;
  };
  $("#dongHoQuota").innerHTML =
    `<div style="width:min(480px,100%)">` +
    thanh(DUNG.chat, TRAN.chat, [0,0,"Lượt trò chuyện"]) +
    thanh(DUNG.tts,  TRAN.tts,  [0,0,"Lượt giọng Gemini"]) +
    `<p class="ghi" style="margin-top:2px">Model đang dùng: <b>${thoat(modelChat || "chưa dò")}</b>` +
    (hangCho.length ? ` · còn ${hangCho.length} lượt chờ ghi trí nhớ` : "") + `</p></div>`;
}

function moBoMe(nhac){
  tatNghe(); dungNhac(); imNgay();
  choPhepNghe = false; datTrangThai("ngu");
  chayThuThu();                       // dọn nốt trí nhớ đang chờ trước khi bố mẹ xem
  $("#loi").textContent = nhac || "";
  $("#key").value = CAI.key; $("#proxy").value = CAI.proxy;
  $("#keyTts").value = CAI.keyTts;
  $("#ten").value = CAI.ten; $("#tuoi").value = CAI.tuoi;
  $("#phut").value = CAI.phut; $("#nghi").value = CAI.nghi;
  $("#toc").value = CAI.toc; $("#tocSo").textContent = (+CAI.toc).toFixed(2);
  $("#giongGem").value = CAI.giongGem || "Leda";
  $("#dungGem").value = CAI.dungGem || "diem";
  veQuota(); veTep();
  $("#bome").classList.remove("an");
}
$("#rang").addEventListener("click", ()=>{ if(congBoMe()) moBoMe(); });
$("#huy").addEventListener("click", ()=>{
  luuTepDangXem(); $("#bome").classList.add("an");
  if(dangChay && sanSang() && !dangKhoa()){ choPhepNghe = true; ketThucLuot(); }
});
$("#xoaTep").addEventListener("click", ()=>{
  if(!tepDangXem || !confirm(`Xoá ${tepDangXem}?`)) return;
  FS.xoa(tepDangXem); tepDangXem = null; veTep();
});
$("#xoaHet").addEventListener("click", ()=>{
  if(!confirm("Xoá toàn bộ trí nhớ của Skye và bắt đầu lại từ đầu?")) return;
  FS.datLai(); lichSu = []; tepDangXem = null; veTep();
  $("#loi").textContent = "Đã xoá sạch trí nhớ.";
});
$("#luu").addEventListener("click", ()=>{
  luuTepDangXem();
  const k = $("#key").value.trim(), p = $("#proxy").value.trim();
  if(!k && !p){ $("#loi").textContent = "Cần mã API hoặc địa chỉ máy chủ trung gian."; return; }
  const tenCu = CAI.ten;
  CAI = { ...CAI, key:k, keyTts:$("#keyTts").value.trim(), proxy:p, ten:$("#ten").value.trim(), tuoi:+$("#tuoi").value,
          phut:+$("#phut").value, nghi:+$("#nghi").value,
          toc:+$("#toc").value, giongGem:$("#giongGem").value, dungGem:$("#dungGem").value };
  luuCai();
  if(CAI.ten && CAI.ten !== tenCu)
    FS.them("/nho/ho_so.md", `- Tên: ${CAI.ten}, ${CAI.tuoi} tuổi`);
  lichSu = [];
  $("#bome").classList.add("an");
  if(!dangChay){ $("#phuBatDau").classList.remove("an"); return; }
  choPhepNghe = true; chayDongHo();
  const c = `Tớ sẵn sàng rồi ${ten()} ơi. Cậu muốn nghe hát hay nghe chuyện?`;
  hienLoi(c); noi(c, ketThucLuot);
});
