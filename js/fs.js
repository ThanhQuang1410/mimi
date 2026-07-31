"use strict";
/* ============================================================
   1. HỆ TỆP TRÍ NHỚ  —  trái tim của harness
   Skye tự đọc/ghi các tệp này bằng công cụ, không theo khuôn cứng.
   ============================================================ */
const GIOI_HAN_TEP = 3000;   // ký tự mỗi tệp

const MAC_DINH = {
  "/nho/ho_so.md":
`# Hồ sơ của bé
(Skye chưa biết gì về bé. Hãy ghi lại khi bé kể.)
`,
  "/nho/tu_vung.md":
`# Sổ từ tiếng Anh
Mỗi dòng: từ = nghĩa | số lần đã ôn | ghi chú
`,
  "/nho/nhat_ky.md":
`# Nhật ký trò chuyện
(Chuyện đã kể, chủ đề đã nói, những khoảnh khắc đáng nhớ.)
`
};

const FS = (()=>{
  let d = KHO.doc("mimi_fs", null);
  if(!d || typeof d !== "object"){ d = { ...MAC_DINH }; KHO.ghi("mimi_fs", d); }
  const luu = ()=>KHO.ghi("mimi_fs", d);
  const chuan = p => { p = String(p||"").trim(); if(!p.startsWith("/nho/")) p = "/nho/" + p.replace(/^\/+/,""); 
                       if(!/\.md$/.test(p)) p += ".md"; return p; };
  return {
    duong(){ return Object.keys(d).sort(); },
    tatCa(){ return d; },
    doc(p){ p = chuan(p); return p in d ? d[p] : null; },
    ghi(p,nd){ p = chuan(p); d[p] = String(nd||"").slice(0,GIOI_HAN_TEP); luu(); return p; },
    them(p,dong){ p = chuan(p);
      const cu = d[p] || "";
      d[p] = (cu.replace(/\s+$/,"") + "\n" + String(dong||"").trim() + "\n").slice(-GIOI_HAN_TEP);
      luu(); return p; },
    thay(p,cu,moi){ p = chuan(p);
      if(!(p in d)) return null;
      if(!d[p].includes(cu)) return null;
      d[p] = d[p].replace(cu, moi).slice(0,GIOI_HAN_TEP); luu(); return p; },
    xoa(p){ p = chuan(p); if(p in d){ delete d[p]; luu(); return p; } return null; },
    datLai(){ d = { ...MAC_DINH }; luu(); },
    cay(){ return Object.entries(d).map(([p,v])=>`${p} (${v.length} ký tự)`).join("\n"); }
  };
})();

/* ---- khai báo công cụ cho Gemini ---- */
const S = t => ({type:"STRING", description:t});
const CONG_CU = [
  { name:"doc_tep",  description:"Đọc toàn bộ nội dung một tệp trí nhớ.",
    parameters:{type:"OBJECT",properties:{duong_dan:S("ví dụ /nho/ho_so.md")},required:["duong_dan"]} },
  { name:"ghi_tep",  description:"Ghi đè toàn bộ một tệp. Dùng khi cần viết lại có cấu trúc.",
    parameters:{type:"OBJECT",properties:{duong_dan:S("đường dẫn tệp"),noi_dung:S("nội dung mới")},required:["duong_dan","noi_dung"]} },
  { name:"them_dong",description:"Thêm một dòng vào cuối tệp. Cách rẻ nhất để ghi nhớ điều mới.",
    parameters:{type:"OBJECT",properties:{duong_dan:S("đường dẫn tệp"),dong:S("dòng cần thêm")},required:["duong_dan","dong"]} },
  { name:"thay_doan",description:"Thay một đoạn văn bản trong tệp bằng đoạn khác. Dùng để cập nhật số lần ôn từ.",
    parameters:{type:"OBJECT",properties:{duong_dan:S("đường dẫn"),cu:S("đoạn cũ, phải khớp chính xác"),moi:S("đoạn mới")},required:["duong_dan","cu","moi"]} },
  { name:"xoa_tep",  description:"Xoá hẳn một tệp không còn cần.",
    parameters:{type:"OBJECT",properties:{duong_dan:S("đường dẫn")},required:["duong_dan"]} }
];

function chayCongCu(ten, a){
  a = a || {};
  try{
    switch(ten){
      case "doc_tep":  { const v = FS.doc(a.duong_dan);
                         return v === null ? {loi:"khong co tep nay"} : {noi_dung:v}; }
      case "ghi_tep":  return {ok:true, duong_dan:FS.ghi(a.duong_dan, a.noi_dung)};
      case "them_dong":return {ok:true, duong_dan:FS.them(a.duong_dan, a.dong)};
      case "thay_doan":{ const r = FS.thay(a.duong_dan, a.cu, a.moi);
                         return r ? {ok:true} : {loi:"khong tim thay doan can thay"}; }
      case "xoa_tep":  { const r = FS.xoa(a.duong_dan);
                         return r ? {ok:true} : {loi:"khong co tep nay"}; }
      default: return {loi:"khong biet cong cu nay"};
    }
  }catch(e){ return {loi:String(e).slice(0,120)}; }
}

