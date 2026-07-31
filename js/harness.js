"use strict";
/* ============================================================
   8. HARNESS — gọi Gemini, vòng lặp công cụ, thủ thư chạy nền
   ============================================================ */
const sanSang = ()=> !!(CAI.proxy || CAI.key);
function diaChi(model){
  return CAI.proxy ? CAI.proxy.replace(/\/+$/,"") + "?mo=" + encodeURIComponent(model)
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(CAI.key)}`;
}
const AN_TOAN = ["HARASSMENT","HATE_SPEECH","SEXUALLY_EXPLICIT","DANGEROUS_CONTENT"]
  .map(c=>({category:"HARM_CATEGORY_"+c, threshold:"BLOCK_LOW_AND_ABOVE"}));

class HetQuota extends Error {}

async function goiGemini(than){
  if(!conQuota("chat")) throw new HetQuota("het-quota-chat");
  const thu = modelChat ? [modelChat] : UNG_VIEN_CHAT;
  let cuoi = "";
  for(const m of thu){
    demDung("chat");
    const r = await fetch(diaChi(m), { method:"POST", headers:{"Content-Type":"application/json"},
                                       body: JSON.stringify({ ...than, safetySettings:AN_TOAN }) });
    if(r.ok){ if(modelChat !== m){ modelChat = m; KHO.ghi("mimi_model", m); } return r.json(); }
    const t = (await r.text().catch(()=>"")).slice(0,160);
    cuoi = `${m}: HTTP ${r.status} ${t}`;
    /* 429 = hết hạn mức của model này, thử model kế tiếp có hạn mức cao hơn */
    if(r.status !== 404 && r.status !== 400 && r.status !== 429) break;
    if(modelChat){ modelChat = null; }      // model đã nhớ nay hỏng, dò lại từ đầu
  }
  throw new Error(cuoi);
}

/* --- (A) lượt nói: nhanh, không công cụ --- */
async function hoiMimi(cauCuaBe, quanTrong, khongTheTu){
  if(!sanSang()){ moBoMe("Bố mẹ nhập mã API hoặc địa chỉ máy chủ trước nhé."); return; }
  datTrangThai("nghi"); hienLoi("…", true);
  lichSu.push({ role:"user", parts:[{text:cauCuaBe}] });

  try{
    const j = await goiGemini({
      systemInstruction:{parts:[{text:LUAT_MIMI()}]},
      contents: lichSu.slice(-14),
      generationConfig:{ temperature:1.05, maxOutputTokens:900, thinkingConfig:{thinkingBudget:0} }
    });
    const tho = (j?.candidates?.[0]?.content?.parts||[]).map(p=>p.text||"").join("").trim();
    if(!tho) throw new Error("khong-co-cau-tra-loi");

    lichSu.push({ role:"model", parts:[{text:tho}] });
    const kq = bocTach(tho);

    if(kq.tu.length && !khongTheTu) setTimeout(()=>hienThe(kq.tu), 400);
    if(kq.khen) setTimeout(voTay, 200);

    // Skye nói ngay — thủ thư gom lượt, thỉnh thoảng mới dọn trí nhớ
    xepVaoHang(cauCuaBe, tho);

    /* lời chào đầu phiên và lúc kể chuyện đáng để tiêu lượt giọng đẹp */
    const dang = quanTrong || /ngày xửa|ngày xưa/i.test(kq.chu) || kq.chu.length > 260;
    if(kq.truyen)                      noi(kq.chu, ()=>phatTruyen(kq.truyen), dang);
    else if(kq.nhac && BAI[kq.nhac])   noi(kq.chu, ()=>phatBai(kq.nhac), dang);
    else                                noi(kq.chu, ketThucLuot, dang);

  }catch(e){
    console.error(e); lichSu.pop();
    const s = String(e);
    const msg = e instanceof HetQuota || /429|quota|RESOURCE_EXHAUSTED/i.test(s)
        ? `Hôm nay tớ nói nhiều quá nên khản tiếng rồi ${ten()} ơi. Mai mình chơi tiếp nhé!`
      : /401|403|API_KEY|API key|INVALID/i.test(s)
        ? "Mã API chưa đúng. Bố mẹ kiểm tra lại trong phần cài đặt giúp Skye nhé."
        : "Tớ chưa nghe rõ. Cậu thử nói lại nhé!";
    hienLoi(msg, true);
    if(e instanceof HetQuota || /429|quota/i.test(s)){
      choPhepNghe = false;
      noi(msg, ()=>{ khepMieng(); datTrangThai("ngu"); });
    }else{
      noi(msg, ketThucLuot);
    }
  }
}

/* --- (B) thủ thư: gom nhiều lượt rồi ghi một thể --- */
const NHIP_THU_THU = 6;          // cứ 6 lượt mới dọn trí nhớ một lần
let hangCho = [], thuThuDangChay = false;

function xepVaoHang(cauBe, loiMimi){
  hangCho.push({ be:cauBe, mimi:loiMimi });
  if(hangCho.length >= NHIP_THU_THU) chayThuThu();
}

async function chayThuThu(){
  if(thuThuDangChay || !hangCho.length) return;
  if(!conQuota("chat")) return;                 // ưu tiên quota cho việc nói chuyện
  thuThuDangChay = true; body.classList.add("ghinho");

  const lo = hangCho.splice(0);
  const nen = lichSu.length > 20;
  const moTa = lo.map((x,i)=>`--- lượt ${i+1} ---\nBé nói: "${x.be}"\nSkye trả lời: "${x.mimi}"`).join("\n\n")
    + (nen ? "\n\nCuộc trò chuyện đã dài. Hãy tóm tắt những gì đáng giữ vào /nho/nhat_ky.md." : "");

  let noiDung = [{ role:"user", parts:[{text:moTa}] }];
  try{
    for(let vong = 0; vong < 4; vong++){
      const j = await goiGemini({
        systemInstruction:{parts:[{text:LUAT_THU_THU()}]},
        contents: noiDung,
        tools:[{functionDeclarations: CONG_CU}],
        generationConfig:{ temperature:.4, maxOutputTokens:900, thinkingConfig:{thinkingBudget:0} }
      });
      const parts = j?.candidates?.[0]?.content?.parts || [];
      const goi = parts.filter(p => p.functionCall);
      if(!goi.length) break;
      noiDung.push({ role:"model", parts });
      noiDung.push({ role:"user", parts: goi.map(p=>({
        functionResponse:{ name:p.functionCall.name,
                           response: chayCongCu(p.functionCall.name, p.functionCall.args) }
      })) });
    }
    if(nen) lichSu = lichSu.slice(-8);
  }catch(e){
    console.warn("thủ thư lỗi:", e);
    if(!(e instanceof HetQuota)) hangCho.unshift(...lo);   // giữ lại để thử sau
  }finally{
    thuThuDangChay = false; body.classList.remove("ghinho");
  }
}

