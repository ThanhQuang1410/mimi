"use strict";
/* ============================================================
   6. PHÂN TÍCH ĐÁNH DẤU  <en>từ|nghĩa</en>  và  [nhac:id]
   ============================================================ */
const RE_EN = /<en>([^|<]+)\|([^<]*)<\/en>/gi;
/* doctruyen nhận cả tên có dấu/viết hoa — timTruyen() sẽ chuẩn hoá lại */
const RE_DANHDAU = /\[(?:nhac:[a-z_]+|doctruyen:[^\]]+|khen)\]/gi;
function bocTach(s){
  s = String(s||"");
  let nhac = null, khen = false, truyen = null;
  s = s.replace(/\[nhac:([a-z_]+)\]/gi, (m,id)=>{ nhac = id.toLowerCase(); return ""; });
  s = s.replace(/\[doctruyen:([^\]]+)\]/gi, (m,id)=>{ truyen = id.trim(); return ""; });
  s = s.replace(/\[khen\]/gi, ()=>{ khen = true; return ""; });
  const tu = [];
  RE_EN.lastIndex = 0;
  let m; while((m = RE_EN.exec(s)) !== null) tu.push({ en:m[1].trim(), vi:m[2].trim() });
  return { chu:s.trim(), tu, nhac, khen, truyen };
}
const dep = s => String(s||"").replace(RE_EN,"<em>$1</em>").replace(RE_DANHDAU,"").trim();
/* tách thành đoạn để đọc bằng hai giọng */
function tachDoan(s){
  const ra = []; let vt = 0, m;
  RE_EN.lastIndex = 0;
  while((m = RE_EN.exec(s)) !== null){
    if(m.index > vt) ra.push({t:s.slice(vt,m.index), en:false});
    ra.push({t:m[1], en:true});
    if(m[2] && m[2].trim()) ra.push({t:m[2], en:false});
    vt = m.index + m[0].length;
  }
  if(vt < s.length) ra.push({t:s.slice(vt), en:false});
  return ra.map(d=>({...d, t:d.t.replace(RE_DANHDAU,"")})).filter(d=>d.t.trim().length);
}

