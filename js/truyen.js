"use strict";
/* Truyện kể sẵn — file thu âm thật (đường dẫn từ audio.md), ưu tiên hơn tự sáng tác khi bé xin
   đúng tên. Slug id ở đây phải khớp với danh sách liệt kê cho model trong LUAT_MIMI(). */
const TRUYEN = {
  cong_chua_ngu_trong_rung:      { ten:"Công chúa ngủ trong rừng",              duong:"audio/b1470d85dd15601199df3812bc506dfb_1767750015.mp3" },
  co_be_lo_lem:                  { ten:"Cô bé Lọ Lem",                          duong:"audio/501c25f960c21199bc6402eecdf7b3a3_1767750015.mp3" },
  bach_tuyet_va_bay_chu_lun:     { ten:"Bạch Tuyết và bảy chú lùn",             duong:"audio/29bf6706a64c02f4982ea0e1506de5d7_1767750015.mp3" },
  co_be_quang_khan_do:           { ten:"Cô bé quàng khăn đỏ",                   duong:"audio/cf2e483d0aee1a4a0e198574e6f51cb7_1767750015.mp3" },
  hansel_va_gretel:              { ten:"Hansel và Gretel",                      duong:"audio/32bc1a13cb11250792226de762bc059f_1767750015.mp3" },
  hoang_tu_ech:                  { ten:"Hoàng tử Ếch",                          duong:"audio/8141e36322636a5e288ea46f5de109b4_1767750015.mp3" },
  bac_tho_giay_va_hai_chu_ti_hon:{ ten:"Bác thợ giày và hai chú tí hon",        duong:"audio/41bba8bb517add249705f9e7d347efa9_1767750015.mp3" },
  cho_soi_va_bay_chu_de_con:     { ten:"Chó sói và bảy chú dê con",             duong:"audio/0489af0c3dd8c3126aa5f484f8b1f07c_1767750015.mp3" },
  nhung_nhac_si_thanh_bremen:    { ten:"Những nhạc sĩ thành Bremen",            duong:"audio/c827a4956e4d7620edf71e1c5adca624_1767750015.mp3" },
  chu_be_ti_hon:                 { ten:"Chú bé Tí Hon",                         duong:"audio/12e00f525d904d6681bdbe07b311e374_1767750015.mp3" },
  chu_meo_di_hia:                { ten:"Chú mèo đi hia",                        duong:"audio/6f0b2edee01fe473c9a6909c407a748c_1767750015.mp3" },
  cong_chua_toc_dai_rapunzel:    { ten:"Công chúa tóc dài Rapunzel",            duong:"audio/8902d95856da4d317d4e596335a8b023_1767750015.mp3" },
  chang_tho_may_nho_dung_cam:    { ten:"Chàng thợ may nhỏ dũng cảm",            duong:"audio/193de5bd55654d8400ece3d55f9b5a0f_1767750015.mp3" },
  ba_anh_em:                     { ten:"Ba anh em",                             duong:"audio/1ba35c4ded8097b42f86c5fc613fb496_1767750015.mp3" },
  co_gai_chan_ngong:             { ten:"Cô gái chăn ngỗng",                     duong:"audio/a67d3350d44c676c0977252b832da5ab_1767750015.mp3" },
  bay_con_qua:                   { ten:"Bảy con quạ",                           duong:"audio/c595c1af1ae363df94b380e6cdbb44a1_1767750015.mp3" },
  co_gai_khon_ngoan:             { ten:"Cô gái khôn ngoan",                     duong:"audio/1d527c3fa11f8ec0a34c4346471ec445_1767750015.mp3" },
  chu_cho_sultan_trung_thanh:    { ten:"Chú chó Sultan trung thành",            duong:"audio/6284bb701e7c8f0abd37a288a8fde18f_1767750015.mp3" },
  con_ngong_vang:                { ten:"Con ngỗng vàng",                        duong:"audio/5040b4df8f1b802819372f232d4fd20f_1767750015.mp3" },
  chu_du_thien_ha_de_hoc_rung_minh:{ten:"Chu du thiên hạ để học rùng mình",     duong:"audio/b40d2e277ec71d18b2cedeb9c1a60d4e_1767750015.mp3" },
  hai_vo_chong_ong_lao_danh_ca:  { ten:"Hai vợ chồng ông lão đánh cá",          duong:"audio/39d2f276626c6d88ef669761f8a0b389_1767750015.mp3" },
  tho_va_nhim:                   { ten:"Thỏ và Nhím",                           duong:"audio/35e4631a4884ff25725f09451fb4ecc9_1767750015.mp3" },
  vi_than_trong_chai_thuy_tinh:  { ten:"Vị thần trong chai thủy tinh",          duong:"audio/047b84e32b4c8f06295897d80fe41f47_1767750015.mp3" },
  muoi_hai_nang_cong_chua_thich_khieu_vu:{ten:"Mười hai nàng công chúa thích khiêu vũ", duong:"audio/f41fbb2b63b6f430ecbf264515128e9d_1767750015.mp3" }
};
/* Chuẩn hoá tên/id về dạng a-z0-9_ để so khớp bất kể dấu tiếng Việt hay cách viết của model */
function chuanId(s){
  return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")
    .replace(/đ/g,"d").replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");
}
/* Model hay viết id gần đúng (thiếu chữ, viết cả tên truyện có dấu). Trước đây id lệch là
   rơi thẳng xuống ketThucLuot() không một lời nào — im lặng, rất khó lần ra. */
function timTruyen(id){
  if(TRUYEN[id]) return id;
  const c = chuanId(id); if(!c) return null;
  const ds = Object.keys(TRUYEN);
  const du = c.length >= 6;
  return ds.find(k => k === c)
      || ds.find(k => chuanId(TRUYEN[k].ten) === c)
      || (du && ds.find(k => k.includes(c) || c.includes(k)))
      || (du && ds.find(k => { const t = chuanId(TRUYEN[k].ten); return t.includes(c) || c.includes(t); }))
      || null;
}

/* iOS/Safari chỉ cho <audio>.play() nếu chính phần tử đó đã từng phát trong một cú chạm thật.
   Truyện luôn bắt đầu SAU khi Skye nói xong câu dẫn — lúc đó không còn cú chạm nào — nên
   phần tử tạo mới bằng new Audio() bị chặn, play() bật lỗi, và luồng rơi về "đang nghe" mà
   không phát gì. Cách chữa: mở khoá sẵn MỘT phần tử ngay lúc bé bấm "Bắt đầu" (giống như đã
   làm với AudioContext và speechSynthesis ở đó) rồi dùng lại đúng phần tử ấy cho mọi truyện. */
const IM_LANG = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
let dangKeTruyen = null, tepTruyen = null;
function tepPhatTruyen(){
  if(tepTruyen) return tepTruyen;
  const au = new Audio();
  au.preload = "auto";
  /* các trình xử lý gắn một lần, chỉ hành động khi đang thật sự kể truyện — để lúc mở khoá
     bằng tệp im lặng không kích hoạt nhầm */
  au.addEventListener("ended", ()=>{
    if(dangKeTruyen !== au) return;
    dangKeTruyen = null; khepMieng(); ketThucLuot();
  });
  au.addEventListener("error", ()=>{
    if(dangKeTruyen !== au) return;
    console.warn("Lỗi tải tệp truyện:", au.currentSrc || au.src, au.error);
    dangKeTruyen = null; khepMieng();
    hienLoi("Tớ không mở được truyện này, xin lỗi cậu nhé.", true);
    ketThucLuot();
  });
  tepTruyen = au;
  return au;
}
function moKhoaTruyen(){
  const au = tepPhatTruyen();
  try{
    au.src = IM_LANG;
    const p = au.play();
    if(p && p.then) p.then(()=>{ try{ au.pause(); au.currentTime = 0; }catch(e){} })
                     .catch(e=>console.warn("Chưa mở khoá được tệp truyện:", e));
  }catch(e){ console.warn("Chưa mở khoá được tệp truyện:", e); }
}

function phatTruyen(idTho){
  const id = timTruyen(idTho);
  const tt = id && TRUYEN[id];
  if(!tt){
    console.warn("Không có truyện nào khớp id model đưa ra:", idTho);
    hienLoi("Tớ chưa có băng ghi âm chuyện đó. Cậu nói lại tên chuyện cho tớ nghe nhé?", true);
    ketThucLuot(); return;
  }
  dungTruyen();
  const au = tepPhatTruyen();
  au.src = tt.duong;          // gán src mới tự đưa vị trí phát về 0
  dangKeTruyen = au;
  datTrangThai("noi"); moMieng();
  const p = au.play();
  if(p && p.then) p.catch(e=>{
    if(dangKeTruyen !== au) return;
    console.warn("Không phát được truyện:", id, tt.duong, e);
    dangKeTruyen = null; khepMieng();
    hienLoi("Tớ chưa mở được truyện. Cậu chạm vào Skye một cái rồi xin lại nhé!", true);
    ketThucLuot();
  });
}
function dungTruyen(){ if(dangKeTruyen){ try{ dangKeTruyen.pause(); }catch(e){} dangKeTruyen=null; } }
