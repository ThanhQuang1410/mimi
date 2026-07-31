"use strict";
/* ============================================================
   7. MIMI NÓI
   ============================================================ */
const tongHop = window.speechSynthesis;

const miengO = $("#miengO"), luoi = $("#luoi");
let nhipMieng = null;
function moMieng(){
  if(window.Mimi3D && window.Mimi3D.ready){ window.Mimi3D.moMieng(); return; }
  if(nhipMieng) return;
  nhipMieng = setInterval(()=>{
    const r = 2+Math.random()*7;
    miengO.setAttribute("ry",r); miengO.setAttribute("rx",12+Math.random()*5);
    luoi.setAttribute("cy",196+r*.55); luoi.setAttribute("ry",Math.max(1,r*.3));
  },105);
}
function khepMieng(){
  if(window.Mimi3D && window.Mimi3D.ready){ window.Mimi3D.khepMieng(); return; }
  clearInterval(nhipMieng); nhipMieng=null;
  miengO.setAttribute("ry",3); miengO.setAttribute("rx",15);
  luoi.setAttribute("cy",200); luoi.setAttribute("ry",2);
}
let hetVoTay = null;
function voTay(){
  if(window.Mimi3D && window.Mimi3D.ready){ window.Mimi3D.nhay(); return; }
  if(hetVoTay) clearTimeout(hetVoTay);
  body.classList.add("votay");
  hetVoTay = setTimeout(()=>{ body.classList.remove("votay"); hetVoTay=null; }, 1500);
}
/* ---------- (A) giọng máy, đã tinh chỉnh cho trẻ con ---------- */
/* chia một đoạn dài thành từng câu để mỗi câu có ngữ điệu riêng */
function chiaCau(t){
  return String(t).split(/(?<=[.!?…])\s+/).map(s=>s.trim()).filter(Boolean);
}
let dungNoi = false;

const CAO_MAY = 1.15;   // giọng máy giờ chỉ còn là lưới an toàn cuối, không cho bố mẹ chỉnh nữa
function noiMay(cau, xongThi){
  const doan = [];
  tachDoan(String(cau||"")).forEach(d=>{
    if(d.en) doan.push(d);
    else chiaCau(d.t).forEach(c=>doan.push({t:c, en:false}));
  });
  if(!tongHop || !doan.length){ xongThi && xongThi(); return; }
  tongHop.cancel(); datTrangThai("noi"); moMieng();
  let i = 0;
  const tiep = ()=>{
    if(dungNoi || i >= doan.length){ khepMieng(); xongThi && xongThi(); return; }
    const d = doan[i++], t = d.t.trim();
    const u = new SpeechSynthesisUtterance(t);
    /* dao động nhỏ để không nghe như máy đọc */
    const rung  = (Math.random()-.5)*.16;
    const reo   = /!/.test(t) ? .14 : /\?/.test(t) ? .07 : 0;
    if(d.en){
      u.lang = "en-US";
      u.pitch = Math.min(2, CAO_MAY + reo);
      u.rate  = Math.max(.4, CAI.toc * .82);      // từ tiếng Anh đọc chậm hơn để bé bắt chước
    } else {
      u.lang = "vi-VN";
      u.pitch = Math.min(2, Math.max(.3, CAO_MAY + rung + reo));
      u.rate  = Math.max(.4, CAI.toc * (/!/.test(t) ? 1.06 : 1));
    }
    u.onend = tiep; u.onerror = tiep;
    tongHop.speak(u);
  };
  tiep();
  setTimeout(()=>{ if(tongHop.paused) tongHop.resume(); },220);
}

/* ---------- (B) giọng Gemini TTS ---------- */
const LOI_DAN_GIONG =
`Người nói là MỘT BÉ GÁI. Giọng nữ, giọng trẻ em, tuyệt đối không phải giọng nam giới hay người lớn.
Hãy đọc bằng giọng của một chú chó cứu hộ nhỏ khoảng năm tuổi: giọng nữ cao và trong trẻo như tiếng chuông,
tươi vui, nũng nịu, ấm áp và trìu mến như đang nói chuyện với em bé.
Nói chậm rãi, rõ ràng, ngân nga và nhấc cao ở cuối câu.
Các từ tiếng Anh phát âm chuẩn giọng Anh–Mỹ, vẫn giữ nguyên chất giọng bé gái đó.
Chỉ đọc phần lời thoại, không thêm bất cứ gì khác:`;

/* Thử lần lượt các API/model TTS, nhớ cái nào chạy được */
const UNG_VIEN_TTS = [
  { kieu:"interactions", model:"gemini-3.1-flash-tts-preview" },
  { kieu:"generate",     model:"gemini-2.5-flash-preview-tts" },
  { kieu:"generate",     model:"gemini-2.5-pro-preview-tts" }
];
let apiTTS = null;      // ứng viên đang dùng
let loiTTS = "";        // lỗi gần nhất, hiện cho bố mẹ xem

function goiTTS(uv, chu){
  const dan = LOI_DAN_GIONG + "\n" + chu;
  const giong = CAI.giongGem || "Leda";
  if(CAI.proxy){
    return fetch(CAI.proxy.replace(/\/+$/,"") + "?m=tts&k=" + uv.kieu + "&mo=" + encodeURIComponent(uv.model), {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ _kieu:uv.kieu, _model:uv.model, _text:dan, _giong:giong }) });
  }
  if(uv.kieu === "interactions"){
    return fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method:"POST",
      headers:{ "Content-Type":"application/json", "x-goog-api-key":CAI.key, "Api-Revision":"2026-05-20" },
      body: JSON.stringify({ model:uv.model, input:dan, response_format:{type:"audio"},
                             generation_config:{ speech_config:[{ voice:giong }] } }) });
  }
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${uv.model}:generateContent`, {
    method:"POST", headers:{ "Content-Type":"application/json", "x-goog-api-key":CAI.key },
    body: JSON.stringify({ contents:[{parts:[{text:dan}]}],
      generationConfig:{ responseModalities:["AUDIO"],
        speechConfig:{ voiceConfig:{ prebuiltVoiceConfig:{ voiceName:giong } } } } }) });
}
function rutAmThanh(j, kieu){
  if(kieu === "interactions") return j?.output_audio?.data || j?.output?.[0]?.audio?.data || null;
  return j?.candidates?.[0]?.content?.parts?.find(p=>p.inlineData)?.inlineData?.data || null;
}
async function taoTieng(chu){
  if(!conQuota("tts")) throw new Error(`het-quota-tts (${DUNG.tts}/${TRAN.tts} lượt hôm nay)`);
  const thu = apiTTS ? [apiTTS] : UNG_VIEN_TTS;
  let cuoi = "";
  for(const uv of thu){
    try{
      demDung("tts");
      const r = await goiTTS(uv, chu);
      const t = await r.text();
      if(!r.ok) throw new Error(`HTTP ${r.status} ${t.slice(0,140)}`);
      const d = rutAmThanh(JSON.parse(t), uv.kieu);
      if(!d) throw new Error("khong co du lieu am thanh");
      apiTTS = uv; loiTTS = "";
      return giaiMaAm(d);
    }catch(e){ cuoi = `${uv.model}: ${String(e.message||e)}`; }
  }
  apiTTS = null; loiTTS = cuoi;
  throw new Error(cuoi);
}
/* base64 -> AudioBuffer. Nhận cả WAV lẫn PCM 16-bit thô */
async function giaiMaAm(b64){
  const c = amThanh();
  const bin = atob(b64), u8 = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) u8[i] = bin.charCodeAt(i);
  if(String.fromCharCode(u8[0],u8[1],u8[2],u8[3]) === "RIFF")
    return c.decodeAudioData(u8.buffer.slice(0));
  const n = (u8.length/2)|0;
  const buf = c.createBuffer(1, n, 24000), ch = buf.getChannelData(0);
  for(let i=0;i<n;i++){
    let v = (u8[i*2+1]<<8) | u8[i*2];
    if(v >= 32768) v -= 65536;
    ch[i] = v/32768;
  }
  return buf;
}

let nguonDangPhat = null;
/* Hạn mức TTS miễn phí chỉ 10 lượt/ngày, nên mỗi câu trả lời chỉ gọi MỘT lượt
   thay vì chia khối. Chậm hơn chút nhưng dùng được gấp ba. */
function chiaKhoi(chu){
  return [ chu.replace(RE_EN,"$1 — $2").replace(RE_DANHDAU,"").trim() ];
}
async function noiGemini(cau, xongThi){
  const khoi = chiaKhoi(String(cau||""));
  datTrangThai("nghi");
  try{
    let ke = taoTieng(khoi[0]);                       // nạp khối đầu
    for(let i=0;i<khoi.length;i++){
      const buf = await ke;
      if(dungNoi) break;
      ke = i+1 < khoi.length ? taoTieng(khoi[i+1]) : null;   // nạp khối sau TRONG LÚC phát khối này
      if(i === 0){ datTrangThai("noi"); moMieng(); }
      await new Promise(xong=>{
        const c = amThanh(); if(c.state==="suspended") c.resume();
        const s = c.createBufferSource();
        s.buffer = buf; s.connect(c.destination);
        s.onended = xong; nguonDangPhat = s; s.start();
      });
    }
    if(ke) ke.catch(()=>{});
    khepMieng(); xongThi && xongThi();
  }catch(e){
    console.warn("Gemini TTS lỗi, quay về giọng máy:", e);
    khepMieng();
    noiMay(cau, xongThi);                              // tự động dự phòng
  }
}

/* ---------- Google Cloud TTS (tầng mặc định) ----------
   Dùng key RIÊNG với key Gemini chat: key Gemini lấy từ AI Studio thường bị gắn service
   account, chỉ được phép gọi Gemini/Vertex, không thêm được Cloud Text-to-Speech vào. Bố mẹ
   cần tạo 1 API key thường (không qua AI Studio) và bật quyền Cloud TTS riêng cho key đó. */
const coCloudTts = ()=> !!(CAI.proxy || CAI.keyTts);
async function taoTiengCloud(chu){
  const r = CAI.proxy
    ? await fetch(CAI.proxy.replace(/\/+$/,"") + "?m=cloudtts", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ _text:chu, _toc:CAI.toc }) })
    : await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(CAI.keyTts)}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          input:{ text: chu },
          voice:{ languageCode:"vi-VN", name:"vi-VN-Wavenet-A" },
          audioConfig:{ audioEncoding:"LINEAR16", speakingRate: CAI.toc }
        }) });
  const t = await r.text();
  if(!r.ok) throw new Error(`HTTP ${r.status} ${t.slice(0,140)}`);
  const j = JSON.parse(t);
  if(!j.audioContent) throw new Error("khong co du lieu am thanh");
  return giaiMaAm(j.audioContent);
}
async function noiCloud(cau, xongThi, quanTrong){
  if(!coCloudTts()){                          // chưa cấu hình key Cloud TTS, bỏ thẳng xuống tầng dưới
    const cs = CAI.dungGem || "diem";
    const xin = cs !== "tat" && (cs === "luon" || quanTrong) && conQuota("tts");
    if(xin) noiGemini(cau, xongThi); else noiMay(cau, xongThi);
    return;
  }
  datTrangThai("nghi");
  const chu = String(cau||"").replace(RE_EN,"$1 — $2").replace(RE_DANHDAU,"").trim();
  try{
    const buf = await taoTiengCloud(chu);
    if(dungNoi) return;
    datTrangThai("noi"); moMieng();
    await new Promise(xong=>{
      const c = amThanh(); if(c.state==="suspended") c.resume();
      const s = c.createBufferSource();
      s.buffer = buf; s.connect(c.destination);
      s.onended = xong; nguonDangPhat = s; s.start();
    });
    khepMieng(); xongThi && xongThi();
  }catch(e){
    console.warn("Cloud TTS lỗi, thử tầng kế tiếp:", e);
    khepMieng();
    const cs = CAI.dungGem || "diem";
    const xin = cs !== "tat" && (cs === "luon" || quanTrong) && conQuota("tts");
    if(xin) noiGemini(cau, xongThi);
    else    noiMay(cau, xongThi);
  }
}

/* ---------- bộ chuyển ----------
   3 tầng tự động: Cloud TTS (mặc định, hạn mức rất lớn) -> Gemini TTS (khoảnh khắc quan trọng,
   hạn mức 8 lượt/ngày) -> giọng máy (lưới an toàn cuối, luôn hoạt động, không cần key). */
function noi(cau, xongThi, quanTrong){
  dungNoi = false;
  if(sanSang()) noiCloud(cau, xongThi, quanTrong);
  else          noiMay(cau, xongThi);
}
function imNgay(){
  dungNoi = true;
  try{ tongHop && tongHop.cancel(); }catch(e){}
  try{ nguonDangPhat && nguonDangPhat.stop(); }catch(e){}
  nguonDangPhat = null; khepMieng();
}

function hienThe(tu){
  const soTu = FS.doc("/nho/tu_vung.md") || "";
  const hop = $("#the"); hop.innerHTML = "";
  tu.slice(0,3).forEach((w,i)=>{
    const cu = new RegExp("^\\s*" + w.en.replace(/[.*+?^${}()|[\]\\]/g,"\\$&") + "\\s*=", "mi").test(soTu);
    const d = document.createElement("div");
    d.className = "tu" + (cu ? " on" : "");
    d.style.animationDelay = (i*.45)+"s";
    d.innerHTML = `<div class="en">${thoat(w.en)}</div><div class="vi">${thoat(w.vi)}</div>`;
    hop.appendChild(d);
    setTimeout(()=>d.remove(), 3600+i*450);
  });
}

