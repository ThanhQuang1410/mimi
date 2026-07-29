# Nút mic đơn + Google Cloud TTS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 4-button UI with a single mic button (used for barge-in), and replace the browser-voice default with Google Cloud TTS as the primary voice tier, keeping Gemini TTS for special moments and browser voice as a last-resort fallback.

**Architecture:** Single-file vanilla JS app (`index.html`), no build step, no framework, no test runner. All changes are direct edits to this one file: HTML markup, inline `<style>` CSS, and inline `<script>` JS. Verification is manual (open in a browser, click through, check console/network).

**Tech Stack:** Vanilla HTML/CSS/JS, Web Speech API (`SpeechSynthesis`, `SpeechRecognition`), Web Audio API, Gemini `generateContent`/TTS REST APIs, Google Cloud Text-to-Speech REST API (`texttospeech.googleapis.com/v1/text:synthesize`).

## Global Constraints

- Everything lives in `E:\LMS\mimi\index.html` — no new files, no npm packages, no bundler.
- Keep Vietnamese identifier naming (functions, variables, CSS classes/ids) consistent with the rest of the file.
- No test suite exists — every task's verification is manual browser steps (open file, interact, observe DOM/console/network).
- Never hardcode API keys or secrets; `CAI.key`/`CAI.proxy` remain the only credential inputs, entered by the parent via `#bome`.
- Preserve existing behavior of everything not explicitly touched by a task: `FS`/`CONG_CU` memory tools, `LUAT_MIMI`/`LUAT_THU_THU` prompts, `PHIEN` session clock, `BAI`/`phatBai` music, `SR` speech recognition, `congBoMe` parent gate, chat quota (`TRAN.chat`/`DUNG.chat`/`goiGemini`).
- Spec reference: `docs/superpowers/specs/2026-07-29-mic-button-cloud-tts-design.md`.

---

### Task 1: Simplify `CAI` config and remove giọng-máy voice-selection logic

**Files:**
- Modify: `index.html` (CAI defaults block, `noiMay`, voice-selection block in section 7)

**Interfaces:**
- Consumes: nothing new.
- Produces: `CAI` object with fields `{key, proxy, ten, tuoi, phut, nghi, toc, giongGem, dungGem}` (no more `cheDo`, `giongMay`, `cao`). `noiMay(cau, xongThi)` keeps its existing signature and behavior, minus per-voice pitch selection. Later tasks (2, 4) rely on this exact `CAI` shape.

- [ ] **Step 1: Update `CAI` defaults**

Find (around line 446):
```js
let CAI = KHO.doc("mimi_cai", { key:"", proxy:"", ten:"", tuoi:4, phut:30, nghi:60,
                                cheDo:"may", giongMay:"", cao:1.9, toc:.88, giongGem:"Leda", dungGem:"diem" });
if(CAI.cheDo === undefined){ CAI.cheDo="may"; CAI.giongMay=""; CAI.cao=1.9; CAI.toc=.88; CAI.giongGem="Leda"; }
if(CAI.dungGem === undefined) CAI.dungGem = "diem";
```

Replace with:
```js
let CAI = KHO.doc("mimi_cai", { key:"", proxy:"", ten:"", tuoi:4, phut:30, nghi:60,
                                toc:.88, giongGem:"Leda", dungGem:"diem" });
if(CAI.toc === undefined) CAI.toc = .88;
if(CAI.giongGem === undefined) CAI.giongGem = "Leda";
if(CAI.dungGem === undefined) CAI.dungGem = "diem";
```

This keeps backward compatibility for parents who already have `mimi_cai` saved in `localStorage` — old `cheDo`/`giongMay`/`cao` keys just become unused dead properties on the object, which is harmless.

- [ ] **Step 2: Remove the voice-selection block**

Find (around line 706-736, section 7 header comment stays):
```js
const tongHop = window.speechSynthesis;
let giongVi = null, giongEn = null;
/* Nhận diện giới tính giọng theo tên. Danh sách giọng nam phổ biến trên các hệ máy —
   "Microsoft An" và "NamMinh" (tiếng Việt), Alex/Daniel/Fred… (tiếng Anh). */
const GIONG_NAM = /\b(an|nam\s*minh|namminh|minh|bao|b[aá]o|h[uù]ng|tu[aâ]n|alex|aaron|daniel|fred|thomas|david|mark|george|james|arthur|rishi|ravi|reed|rocko|eddy|gordon|oliver|liam|nathan|junior|male|nam)\b/i;
const GIONG_NU  = /\b(linh|hoai\s*my|hoaimy|mai|lan|ng[oọ]c|th[uủ]y|female|n[uữ]|samantha|karen|moira|tessa|zira|fiona|victoria|ava|allison|susan|zoe|nicky|kate|serena|martha)\b/i;

function gioiTinh(v){
  if(GIONG_NU.test(v.name)) return "nu";
  if(GIONG_NAM.test(v.name)) return "nam";
  return "?";
}
/* Xếp hạng: nữ rõ ràng > chưa rõ > nam. Không bao giờ chọn giọng nam nếu còn lựa chọn khác. */
function xepHang(v){ const g = gioiTinh(v); return g==="nu" ? 0 : g==="?" ? 1 : 2; }

function chonGiong(){
  if(!tongHop) return;
  const ds = tongHop.getVoices();
  const daChon = CAI.giongMay ? ds.find(v=>v.name === CAI.giongMay) : null;
  const vi = ds.filter(v=>/^vi/i.test(v.lang)).sort((a,b)=>xepHang(a)-xepHang(b));
  const en = ds.filter(v=>/^en/i.test(v.lang))
               .sort((a,b)=> (xepHang(a)-xepHang(b)) || ((/en[-_](US|GB)/i.test(b.lang)?1:0)-(/en[-_](US|GB)/i.test(a.lang)?1:0)));
  giongVi = daChon || vi[0] || null;
  giongEn = en[0] || null;
}
chonGiong();
if(tongHop) tongHop.onvoiceschanged = ()=>{
  chonGiong();
  if(!$("#bome").classList.contains("an")) veDanhSachGiong();
};
```

Replace with just:
```js
const tongHop = window.speechSynthesis;
```

- [ ] **Step 3: Simplify `noiMay` to not reference `giongVi`/`giongEn`/`CAI.cao`**

Find (around line 759-789):
```js
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
      u.lang = "en-US"; if(giongEn) u.voice = giongEn;
      u.pitch = Math.min(2, CAI.cao + reo);
      u.rate  = Math.max(.4, CAI.toc * .82);      // từ tiếng Anh đọc chậm hơn để bé bắt chước
    } else {
      u.lang = "vi-VN"; if(giongVi) u.voice = giongVi;
      u.pitch = Math.min(2, Math.max(.3, CAI.cao + rung + reo));
      u.rate  = Math.max(.4, CAI.toc * (/!/.test(t) ? 1.06 : 1));
    }
    u.onend = tiep; u.onerror = tiep;
    tongHop.speak(u);
  };
  tiep();
  setTimeout(()=>{ if(tongHop.paused) tongHop.resume(); },220);
}
```

Replace with:
```js
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
```

- [ ] **Step 4: Manual verification**

Open `index.html` directly in a browser (double-click, or `file://` URL). Open DevTools console.
Expected: no errors on load (in particular no `giongVi is not defined` / `chonGiong is not defined`
reference errors). This confirms nothing else in the file still references the removed symbols —
if the console shows a `ReferenceError`, grep the file for the removed names (`giongVi`, `giongEn`,
`chonGiong`, `gioiTinh`, `xepHang`, `GIONG_NAM`, `GIONG_NU`, `CAI.cao`, `CAI.giongMay`) and remove
those remaining call sites (they'll be cleaned up by Tasks 3–4 if in the settings panel).

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Simplify CAI config, remove browser-voice picker logic"
```

---

### Task 2: Add Google Cloud TTS tier and rewire the `noi()` dispatcher

**Files:**
- Modify: `index.html` (voice dispatcher in section 7, around the existing `noiGemini`/bộ chuyển block)

**Interfaces:**
- Consumes: `CAI.key`, `CAI.proxy`, `CAI.toc`, `CAI.dungGem`, `sanSang()`, `conQuota("tts")`, `giaiMaAm(b64)`, `amThanh()`, `datTrangThai(t)`, `moMieng()`, `khepMieng()`, `noiGemini(cau, xongThi)`, `noiMay(cau, xongThi)`, `RE_EN` (all pre-existing, unchanged).
- Produces: `noiCloud(cau, xongThi, quanTrong)` and `taoTiengCloud(chu)` — new functions. `noi(cau, xongThi, quanTrong)` keeps its exact existing call signature (used unchanged by `hoiMimi`, `ketThucPhien`, `chayDongHo`, `$("#ngheThu")` handler, `$("#luu")` handler — none of those call sites need to change).

- [ ] **Step 1: Replace the dispatcher block**

Find (around line 902-918):
```js
/* ---------- bộ chuyển ----------
   Hạn mức giọng Gemini rất nhỏ (8 lượt/ngày), nên bố mẹ chọn tiêu vào đâu:
   tat  = không dùng     diem = chỉ lời chào và lúc kể chuyện     luon = mọi lượt   */
function noi(cau, xongThi, quanTrong){
  dungNoi = false;
  const cs = CAI.dungGem || "diem";
  const xin = CAI.cheDo === "gemini" && sanSang() && cs !== "tat"
           && (cs === "luon" || quanTrong) && conQuota("tts");
  if(xin) noiGemini(cau, xongThi);
  else    noiMay(cau, xongThi);
}
```

Replace with:
```js
/* ---------- Google Cloud TTS (tầng mặc định) ---------- */
async function taoTiengCloud(chu){
  const r = CAI.proxy
    ? await fetch(CAI.proxy.replace(/\/+$/,"") + "?m=cloudtts", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ _text:chu, _toc:CAI.toc }) })
    : await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(CAI.key)}`, {
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
  datTrangThai("nghi");
  const chu = String(cau||"").replace(RE_EN,"$1 — $2").replace(/\[nhac:[a-z_]+\]/gi,"").trim();
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
```

- [ ] **Step 2: Manual verification — fallback chain with no key**

Open `index.html`, click "Đánh thức Mimi" without ever having entered an API key or proxy.
Expected: `sanSang()` is false, so `noi()` calls `noiMay` directly — Mimi should still speak
(using the browser's built-in voice) instead of hanging silently. Watch the mouth animation
(`moMieng`) run and confirm speech is audible.

- [ ] **Step 3: Manual verification — Cloud TTS failure falls back correctly**

In the parent settings (`#rang` → solve the math captcha), enter a deliberately invalid string in
"Mã API Gemini" (e.g. `AIzaTHISISNOTVALID`), save, and start a session. Open DevTools → Network
tab. Expected: a request to `texttospeech.googleapis.com/v1/text:synthesize` fails (401/403), the
console logs `"Cloud TTS lỗi, thử tầng kế tiếp:"`, and Mimi still speaks audibly (falls through to
Gemini attempt, which also fails on the bad key, and finally to `noiMay`). No silent dead-end.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Add Google Cloud TTS as default voice tier with fallback chain"
```

---

### Task 3: Rebuild the settings panel markup for the 3-tier voice config

**Files:**
- Modify: `index.html` (`#bome` HTML block, `.chon2`/`.truot` CSS)

**Interfaces:**
- Consumes: nothing (pure markup/CSS).
- Produces: `#toc`/`#tocSo` (kept, same ids as before), `#giongGem`, `#dungGem` (kept, same ids).
  Removed ids: `#cheDo`, `#khoiMay`, `#giongMay`, `#chanDoan`, `#cao`, `#caoSo`. Task 4 depends on
  these exact remaining/removed ids.

- [ ] **Step 1: Replace the voice settings HTML block**

Find (around line 275-308):
```html
  <h3>Giọng nói của Mimi</h3>
  <div class="chon2" id="cheDo">
    <button data-cd="may">Giọng máy<br><span style="font-weight:500;font-size:.72rem">miễn phí, tức thì</span></button>
    <button data-cd="gemini">Giọng Gemini<br><span style="font-weight:500;font-size:.72rem">đáng yêu hơn, chậm hơn</span></button>
  </div>

  <div id="khoiMay">
    <label for="giongMay" style="margin-top:10px">Chọn giọng có sẵn trên máy</label>
    <select id="giongMay"></select>
    <p class="ghi" id="chanDoan" style="margin-top:6px"></p>
    <label style="margin-top:10px">Cao độ — kéo phải cho giọng trẻ con</label>
    <div class="truot"><input type="range" id="cao" min="0.6" max="2" step="0.05"><span id="caoSo">1.9</span></div>
    <label>Tốc độ — chậm lại cho bé dễ nghe</label>
    <div class="truot"><input type="range" id="toc" min="0.5" max="1.3" step="0.02"><span id="tocSo">0.88</span></div>
  </div>

  <div id="khoiGemini" style="display:none;width:min(480px,100%)">
    <label for="giongGem" style="margin-top:10px">Chọn nhân vật giọng</label>
    <select id="giongGem">
      <option value="Leda">Leda — trẻ trung, trong trẻo ⭐</option>
      <option value="Achernar">Achernar — mềm, nhẹ nhàng</option>
      <option value="Zephyr">Zephyr — tươi sáng</option>
      <option value="Laomedeia">Laomedeia — nhí nhảnh</option>
      <option value="Aoede">Aoede — thoáng đãng</option>
      <option value="Autonoe">Autonoe — rạng rỡ</option>
    </select>
    <label for="dungGem" style="margin-top:12px">Tiêu hạn mức giọng Gemini vào đâu?</label>
    <select id="dungGem">
      <option value="diem">Chỉ khoảnh khắc đáng nhớ — lời chào và lúc kể chuyện ⭐</option>
      <option value="luon">Mọi lượt nói — hết hạn mức rất nhanh</option>
      <option value="tat">Tắt hẳn, chỉ dùng giọng máy</option>
    </select>
    <p class="ghi" style="margin-top:8px">Giọng do AI tạo, nghe như bé thật và đọc chuẩn cả tiếng Việt lẫn tiếng Anh. Đổi lại: hạn mức miễn phí chỉ <b>10 lượt mỗi ngày</b> và mỗi câu mất khoảng 7 giây. Hết hạn mức, Mimi tự quay về giọng máy.</p>
  </div>
```

Replace with:
```html
  <h3>Giọng nói của Mimi</h3>
  <p class="ghi">Mimi dùng <b>Google Cloud Text-to-Speech</b> làm giọng chính. Vào
    <a href="https://console.cloud.google.com/apis/library/texttospeech.googleapis.com" target="_blank" rel="noopener">Google Cloud Console</a>
    và bật API này cho cùng project với mã API Gemini phía trên. Nếu chưa bật hoặc lỗi mạng, Mimi
    tự chuyển sang giọng dự phòng của máy.</p>

  <label for="toc">Tốc độ nói — chậm lại cho bé dễ nghe</label>
  <div class="truot"><input type="range" id="toc" min="0.5" max="1.3" step="0.02"><span id="tocSo">0.88</span></div>

  <h3>Giọng Gemini cho khoảnh khắc đặc biệt</h3>
  <div id="khoiGemini" style="width:min(480px,100%)">
    <label for="giongGem">Chọn nhân vật giọng</label>
    <select id="giongGem">
      <option value="Leda">Leda — trẻ trung, trong trẻo ⭐</option>
      <option value="Achernar">Achernar — mềm, nhẹ nhàng</option>
      <option value="Zephyr">Zephyr — tươi sáng</option>
      <option value="Laomedeia">Laomedeia — nhí nhảnh</option>
      <option value="Aoede">Aoede — thoáng đãng</option>
      <option value="Autonoe">Autonoe — rạng rỡ</option>
    </select>
    <label for="dungGem" style="margin-top:12px">Tiêu hạn mức giọng Gemini vào đâu?</label>
    <select id="dungGem">
      <option value="diem">Chỉ khoảnh khắc đáng nhớ — lời chào và lúc kể chuyện ⭐</option>
      <option value="luon">Mọi lượt nói — hết hạn mức rất nhanh</option>
      <option value="tat">Tắt hẳn, chỉ dùng Cloud TTS / giọng máy</option>
    </select>
    <p class="ghi" style="margin-top:8px">Giọng do AI tạo, nghe như bé thật. Hạn mức miễn phí chỉ <b>10 lượt mỗi ngày</b> và mỗi câu mất khoảng 7 giây. Hết hạn mức, Mimi tự quay về Cloud TTS hoặc giọng máy.</p>
  </div>
```

- [ ] **Step 2: Remove the now-unused `.chon2` CSS rule**

Find (around line 123-126):
```css
/* chỉnh giọng */
.chon2{display:flex;gap:8px;width:min(480px,100%)}
.chon2 button{flex:1;background:#fff;border:3px solid rgba(201,182,245,.6);border-radius:16px;
  padding:12px 8px;font-family:var(--dm);font-weight:700;font-size:.88rem;color:var(--than-mo);cursor:pointer}
.chon2 button.chon{border-color:var(--hong-dam);color:var(--hong-dam);background:#FFF5F9}
```

Delete these 5 lines entirely (the `.truot` rules immediately below stay — `#toc` still uses them).

- [ ] **Step 3: Manual verification**

Open `index.html`, solve the parent captcha (`#rang`), open settings. Expected: the panel shows
the Cloud TTS explanation paragraph with a working link, one "Tốc độ nói" slider, then the
"Giọng Gemini cho khoảnh khắc đặc biệt" section with its two dropdowns — no leftover "Giọng máy /
Giọng Gemini" toggle buttons, no "Cao độ" slider, no "Chọn giọng có sẵn trên máy" dropdown.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Rebuild settings panel markup for 3-tier voice config"
```

---

### Task 4: Wire settings panel JS handlers to the new fields

**Files:**
- Modify: `index.html` (section 11 — `veCheDo`, slider listeners, `moBoMe`, `$("#luu")` handler)

**Interfaces:**
- Consumes: the ids produced by Task 3 (`#toc`, `#tocSo`, `#giongGem`, `#dungGem`), the `CAI` shape
  from Task 1.
- Produces: `moBoMe(nhac)` keeps its existing call signature (called from `$("#rang")` click and
  `chayDongHo`'s early-return paths are unaffected). `$("#luu")` handler keeps saving into the same
  `mimi_cai` key via `luuCai()`.

- [ ] **Step 1: Remove `veCheDo` and its button listeners**

Find (around line 1173-1180):
```js
function veCheDo(){
  document.querySelectorAll("#cheDo button").forEach(b=>
    b.classList.toggle("chon", b.dataset.cd === CAI.cheDo));
  $("#khoiMay").style.display    = CAI.cheDo === "may" ? "" : "none";
  $("#khoiGemini").style.display = CAI.cheDo === "gemini" ? "" : "none";
}
document.querySelectorAll("#cheDo button").forEach(b=>
  b.addEventListener("click", ()=>{ CAI.cheDo = b.dataset.cd; veCheDo(); }));
```

Delete these 8 lines entirely.

- [ ] **Step 2: Remove the `#cao` and `#giongMay` listeners, keep `#toc` and `#giongGem`**

Find (around line 1181-1184):
```js
$("#cao").addEventListener("input", e=>{ CAI.cao = +e.target.value; $("#caoSo").textContent = CAI.cao.toFixed(2); });
$("#toc").addEventListener("input", e=>{ CAI.toc = +e.target.value; $("#tocSo").textContent = CAI.toc.toFixed(2); });
$("#giongMay").addEventListener("change", e=>{ CAI.giongMay = e.target.value; chonGiong(); veDanhSachGiong(); });
$("#giongGem").addEventListener("change", e=>{ CAI.giongGem = e.target.value; $("#ngheThu").click(); });
```

Replace with:
```js
$("#toc").addEventListener("input", e=>{ CAI.toc = +e.target.value; $("#tocSo").textContent = CAI.toc.toFixed(2); });
$("#giongGem").addEventListener("change", e=>{ CAI.giongGem = e.target.value; $("#ngheThu").click(); });
```

- [ ] **Step 3: Remove `veDanhSachGiong` (no longer called by anything after Step 1–2)**

Find (around line 1146-1172), the whole function:
```js
function veDanhSachGiong(){
  const ds = (tongHop ? tongHop.getVoices() : [])
    .filter(v=>/^(vi|en)/i.test(v.lang))
    .sort((a,b)=> ((/^vi/i.test(b.lang)?1:0)-(/^vi/i.test(a.lang)?1:0)) || (xepHang(a)-xepHang(b)));
  const nhan = { nu:"♀", nam:"♂", "?":"·" };
  const sel = $("#giongMay");
  sel.innerHTML = '<option value="">Tự động chọn giọng nữ</option>' +
    ds.map(v=>`<option value="${thoat(v.name)}">${nhan[gioiTinh(v)]} ${thoat(v.name)} · ${thoat(v.lang)}</option>`).join("");
  sel.value = CAI.giongMay || "";

  const viNu = ds.filter(v=>/^vi/i.test(v.lang) && gioiTinh(v)==="nu");
  const viTat = ds.filter(v=>/^vi/i.test(v.lang));
  const d = $("#chanDoan");
  if(loiTTS && CAI.cheDo === "gemini"){
    d.innerHTML = `⚠️ <b>Giọng Gemini đang lỗi</b> nên Mimi phải dùng tạm giọng máy:<br>`+
                  `<code style="font-size:.76rem">${thoat(loiTTS)}</code>`;
  }else if(!viTat.length){
    d.innerHTML = "⚠️ Máy này <b>không có giọng tiếng Việt nào</b>. Trình duyệt sẽ đọc tiếng Việt bằng "+
                  "giọng mặc định — thường là giọng nam tiếng Anh, nghe rất thô. Hãy dùng <b>Giọng Gemini</b>.";
  }else if(!viNu.length){
    d.innerHTML = `⚠️ Máy chỉ có giọng tiếng Việt <b>${thoat(viTat.map(v=>v.name).join(", "))}</b>, `+
                  `không giọng nào là giọng nữ. Hãy chuyển sang <b>Giọng Gemini</b>.`;
  }else{
    d.innerHTML = `Đang đọc bằng: <b>${thoat(giongVi ? giongVi.name : "—")}</b> (tiếng Việt) và `+
                  `<b>${thoat(giongEn ? giongEn.name : "—")}</b> (tiếng Anh).`;
  }
}
```

Delete the whole function.

- [ ] **Step 4: Update `moBoMe` to stop referencing removed ids/functions**

Find (around line 1211-1225):
```js
function moBoMe(nhac){
  tatNghe(); dungNhac(); imNgay();
  choPhepNghe = false; datTrangThai("ngu");
  chayThuThu();                       // dọn nốt trí nhớ đang chờ trước khi bố mẹ xem
  $("#loi").textContent = nhac || "";
  $("#key").value = CAI.key; $("#proxy").value = CAI.proxy;
  $("#ten").value = CAI.ten; $("#tuoi").value = CAI.tuoi;
  $("#phut").value = CAI.phut; $("#nghi").value = CAI.nghi;
  $("#cao").value = CAI.cao; $("#caoSo").textContent = (+CAI.cao).toFixed(2);
  $("#toc").value = CAI.toc; $("#tocSo").textContent = (+CAI.toc).toFixed(2);
  $("#giongGem").value = CAI.giongGem || "Leda";
  $("#dungGem").value = CAI.dungGem || "diem";
  veDanhSachGiong(); veCheDo(); veQuota(); veTep();
  $("#bome").classList.remove("an");
}
```

Replace with:
```js
function moBoMe(nhac){
  tatNghe(); dungNhac(); imNgay();
  choPhepNghe = false; datTrangThai("ngu");
  chayThuThu();                       // dọn nốt trí nhớ đang chờ trước khi bố mẹ xem
  $("#loi").textContent = nhac || "";
  $("#key").value = CAI.key; $("#proxy").value = CAI.proxy;
  $("#ten").value = CAI.ten; $("#tuoi").value = CAI.tuoi;
  $("#phut").value = CAI.phut; $("#nghi").value = CAI.nghi;
  $("#toc").value = CAI.toc; $("#tocSo").textContent = (+CAI.toc).toFixed(2);
  $("#giongGem").value = CAI.giongGem || "Leda";
  $("#dungGem").value = CAI.dungGem || "diem";
  veQuota(); veTep();
  $("#bome").classList.remove("an");
}
```

- [ ] **Step 5: Update the `#luu` handler to stop saving removed fields**

Find (around line 1240-1258):
```js
$("#luu").addEventListener("click", ()=>{
  luuTepDangXem();
  const k = $("#key").value.trim(), p = $("#proxy").value.trim();
  if(!k && !p){ $("#loi").textContent = "Cần mã API hoặc địa chỉ máy chủ trung gian."; return; }
  const tenCu = CAI.ten;
  CAI = { ...CAI, key:k, proxy:p, ten:$("#ten").value.trim(), tuoi:+$("#tuoi").value,
          phut:+$("#phut").value, nghi:+$("#nghi").value,
          giongMay:$("#giongMay").value, cao:+$("#cao").value,
          toc:+$("#toc").value, giongGem:$("#giongGem").value, dungGem:$("#dungGem").value };
  luuCai(); chonGiong();
  if(CAI.ten && CAI.ten !== tenCu)
    FS.them("/nho/ho_so.md", `- Tên: ${CAI.ten}, ${CAI.tuoi} tuổi`);
  lichSu = [];
  $("#bome").classList.add("an");
  if(!dangChay){ $("#phuBatDau").classList.remove("an"); return; }
  choPhepNghe = true; chayDongHo();
  const c = `Mimi sẵn sàng rồi ${ten()} ơi. Con muốn nghe hát hay nghe chuyện?`;
  hienLoi(c); noi(c, ketThucLuot);
});
```

Replace with:
```js
$("#luu").addEventListener("click", ()=>{
  luuTepDangXem();
  const k = $("#key").value.trim(), p = $("#proxy").value.trim();
  if(!k && !p){ $("#loi").textContent = "Cần mã API hoặc địa chỉ máy chủ trung gian."; return; }
  const tenCu = CAI.ten;
  CAI = { ...CAI, key:k, proxy:p, ten:$("#ten").value.trim(), tuoi:+$("#tuoi").value,
          phut:+$("#phut").value, nghi:+$("#nghi").value,
          toc:+$("#toc").value, giongGem:$("#giongGem").value, dungGem:$("#dungGem").value };
  luuCai();
  if(CAI.ten && CAI.ten !== tenCu)
    FS.them("/nho/ho_so.md", `- Tên: ${CAI.ten}, ${CAI.tuoi} tuổi`);
  lichSu = [];
  $("#bome").classList.add("an");
  if(!dangChay){ $("#phuBatDau").classList.remove("an"); return; }
  choPhepNghe = true; chayDongHo();
  const c = `Mimi sẵn sàng rồi ${ten()} ơi. Con muốn nghe hát hay nghe chuyện?`;
  hienLoi(c); noi(c, ketThucLuot);
});
```

- [ ] **Step 6: Manual verification**

Open `index.html`, DevTools console open. Solve parent captcha, open settings panel — expect no
console errors. Drag the "Tốc độ nói" slider — the number label next to it should update live.
Change the Gemini voice dropdown — it should trigger "Nghe thử" automatically (existing behavior,
unchanged). Click "Lưu" — expect settings panel to close with no console errors, and reopening it
(`#rang` again) shows the same slider value you set (confirms `mimi_cai` round-trips correctly).

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "Wire settings panel handlers to simplified CAI fields"
```

---

### Task 5: Replace the 4-button UI with a single mic button

**Files:**
- Modify: `index.html` (`#nut` HTML, `.n` CSS family, `datTrangThai`, section 10 button listeners)

**Interfaces:**
- Consumes: `trangThai` (existing global), `datTrangThai(t)`, `ting()`, `dungNhac()`, `tatNghe()`,
  `imNgay()`, `hienLoi(t, mo)`, `ketThucLuot()` — all pre-existing, unchanged signatures.
- Produces: `#nutMic` (button), `#nutMicBt`/`#nutMicNh` (icon/label spans updated by
  `datTrangThai`). No other task depends on these ids.

- [ ] **Step 1: Replace the button markup**

Find (around line 220-225):
```html
  <div id="nut">
    <button class="n nhac"   data-noi="Mimi ơi, hát cho con nghe một bài đi"><span class="bt">🎵</span><span class="nh">Hát</span></button>
    <button class="n truyen" data-noi="Mimi kể cho con một câu chuyện mới đi"><span class="bt">📖</span><span class="nh">Kể truyện</span></button>
    <button class="n anh"    data-noi="Mimi ôn lại mấy từ tiếng Anh với con đi"><span class="bt">🔤</span><span class="nh">Tiếng Anh</span></button>
    <button class="n dung" id="nutDung"><span class="bt">✋</span><span class="nh">Dừng</span></button>
  </div>
```

Replace with:
```html
  <div id="nut">
    <button id="nutMic" aria-label="Nói chuyện với Mimi">
      <span class="bt" id="nutMicBt">🎙️</span>
      <span class="nh" id="nutMicNh">Chạm để nói</span>
    </button>
  </div>
```

- [ ] **Step 2: Replace the button CSS**

Find (around line 69-79):
```css
#nut{display:flex;gap:clamp(10px,2.4vw,18px);justify-content:center;flex-wrap:wrap;margin-top:12px;flex:none}
.n{width:clamp(62px,10.5vh,84px);height:clamp(62px,10.5vh,84px);border-radius:28px;border:none;background:#fff;
   box-shadow:0 8px 20px rgba(107,78,94,.14);cursor:pointer;display:flex;flex-direction:column;
   align-items:center;justify-content:center;gap:2px;transition:transform .18s cubic-bezier(.34,1.56,.64,1)}
.n:active{transform:scale(.9)}.n:focus-visible{outline:4px solid var(--tim);outline-offset:3px}
.n .bt{font-size:clamp(1.45rem,3.8vh,1.95rem);line-height:1}
.n .nh{font-family:var(--dm);font-weight:700;font-size:clamp(.58rem,1.45vh,.74rem);color:var(--than-mo)}
.n.nhac{background:linear-gradient(160deg,#fff,#FFF0F6)}
.n.truyen{background:linear-gradient(160deg,#fff,#F2ECFF)}
.n.anh{background:linear-gradient(160deg,#fff,#E9F9F3)}
.n.dung{background:linear-gradient(160deg,#fff,#FFF6E3)}
```

Replace with:
```css
#nut{display:flex;justify-content:center;margin-top:12px;flex:none}
#nutMic{width:clamp(96px,18vh,140px);height:clamp(96px,18vh,140px);border-radius:40px;border:none;
   background:linear-gradient(160deg,#fff,#FFF0F6);box-shadow:0 8px 20px rgba(107,78,94,.14);cursor:pointer;
   display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
   transition:transform .18s cubic-bezier(.34,1.56,.64,1)}
#nutMic:active{transform:scale(.9)}#nutMic:focus-visible{outline:4px solid var(--tim);outline-offset:3px}
#nutMic .bt{font-size:clamp(2.1rem,5.6vh,2.8rem);line-height:1}
#nutMic .nh{font-family:var(--dm);font-weight:700;font-size:clamp(.68rem,1.6vh,.82rem);color:var(--than-mo)}
body.noi #nutMic{background:linear-gradient(160deg,#fff,#FFE3EE)}
```

- [ ] **Step 3: Make `datTrangThai` update the mic button's icon/label**

Find (around line 527-532):
```js
function datTrangThai(t){
  trangThai = t;
  body.classList.remove("nghe","nghi","noi");
  if(t !== "ngu") body.classList.add(t);
  micChu.textContent = t==="nghe"?"Mimi đang nghe…":t==="nghi"?"Mimi đang nghĩ…":t==="noi"?"Mimi đang nói…":"Mimi đang ngủ";
}
```

Replace with:
```js
function datTrangThai(t){
  trangThai = t;
  body.classList.remove("nghe","nghi","noi");
  if(t !== "ngu") body.classList.add(t);
  micChu.textContent = t==="nghe"?"Mimi đang nghe…":t==="nghi"?"Mimi đang nghĩ…":t==="noi"?"Mimi đang nói…":"Mimi đang ngủ";
  const bt = $("#nutMicBt"), nh = $("#nutMicNh");
  if(bt && nh){
    bt.textContent = t==="noi" ? "✋" : "🎙️";
    nh.textContent  = t==="noi" ? "Chạm để dừng" : t==="nghe" ? "Đang nghe…" : t==="nghi" ? "Đang nghĩ…" : "Chạm để nói";
  }
}
```

- [ ] **Step 4: Replace the button click listeners**

Find (around line 1101-1111):
```js
document.querySelectorAll(".n[data-noi]").forEach(b=>{
  b.addEventListener("click", ()=>{
    if(!dangChay) return;
    ting(); dungNhac(); tatNghe(); imNgay();
    hoiMimi(b.dataset.noi, b.classList.contains("truyen"));
  });
});
$("#nutDung").addEventListener("click", ()=>{
  ting(); dungNhac(); imNgay();
  hienLoi("Mimi im lặng đây. Con muốn nói gì nào?", true); ketThucLuot();
});
```

Replace with:
```js
$("#nutMic").addEventListener("click", ()=>{
  if(!dangChay) return;
  ting();
  if(trangThai === "noi"){
    dungNhac(); imNgay();
    hienLoi("Mimi im lặng đây. Con muốn nói gì nào?", true); ketThucLuot();
  }else if(trangThai === "nghe" || trangThai === "nghi"){
    dungNhac(); tatNghe(); imNgay();
    ketThucLuot();
  }
});
```

- [ ] **Step 5: Manual verification — full interaction pass**

Open `index.html`. Solve parent captcha if needed to confirm no leftover key errors, then close
settings and click "Đánh thức Mimi" to start a session (a valid `CAI.key` or `CAI.proxy` should be
configured for this pass — real key not required beyond what you already use for testing).

1. **Label reflects state:** watch `#nutMicNh` text change as `trangThai` cycles through
   nghĩ → nói → nghe (it updates automatically as Mimi responds to the opening greeting).
2. **Barge-in works:** while Mimi is mid-sentence (`body` has class `noi`), click `#nutMic`.
   Expected: audio/speech stops immediately, `hienLoi` shows "Mimi im lặng đây...", and the state
   moves to `nghe` (mic label goes back to "Đang nghe…").
3. **Cancel-while-listening works:** while the mic is actively listening (`body` has class
   `nghe`), click `#nutMic`. Expected: recognition aborts and restarts cleanly, no stuck state.
4. **Voice-driven feature request:** speak into the mic (or, if speech recognition is unavailable
   in your test environment, temporarily call `hoiMimi("Mimi ơi hát cho con nghe một bài đi")`
   from the DevTools console) and confirm Mimi still triggers a song via `[nhac:...]` the same way
   it did with the old dedicated "Hát" button.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "Replace 4-button UI with single mic button for barge-in"
```

---

### Task 6: End-to-end manual verification pass

**Files:**
- None (verification only).

**Interfaces:**
- Consumes: the fully assembled `index.html` from Tasks 1–5.
- Produces: nothing — this is the final acceptance pass from the spec's "Kiểm thử" section.

- [ ] **Step 1: Fresh-profile smoke test**

In a browser, open DevTools → Application → Local Storage, and delete all `mimi_*` keys to
simulate a first-time parent. Reload `index.html`. Expected: "Đánh thức Mimi" screen shows,
clicking it prompts for API key/proxy via `moBoMe`, no console errors.

- [ ] **Step 2: Voice tier order under normal conditions**

With a valid Gemini API key entered (and, if available, Cloud TTS enabled on that GCP project),
start a session. Open DevTools → Network, filter by `texttospeech`. Expected: the first voice
request goes to `texttospeech.googleapis.com/v1/text:synthesize`, and it succeeds (audio plays,
mouth animates) without ever calling the Gemini TTS endpoint for a normal (non-"quan trọng") turn.

- [ ] **Step 3: Mic button + barge-in end-to-end**

Repeat the four checks from Task 5 Step 5 in one continuous session (label updates, barge-in,
cancel-while-listening, voice-driven song/story/English requests) to confirm they still hold once
Tasks 1–4's voice-tier changes are layered in.

- [ ] **Step 4: Settings round-trip**

Open settings, change the "Tốc độ nói" slider and the Gemini voice/quota dropdowns, save, reopen
settings — confirm all four values persisted. Confirm the `mimi_cai` entry in Local Storage no
longer gains new `cheDo`/`giongMay`/`cao` keys after a fresh save (open DevTools → Application →
Local Storage → inspect `mimi_cai` JSON).

- [ ] **Step 5: Full fallback chain under failure**

Temporarily set an invalid API key, start a session, and confirm Mimi still greets and responds
audibly (falling through Cloud TTS → Gemini → browser voice, per Task 2 Step 3), with no dead air
and no uncaught exceptions in the console.

- [ ] **Step 6: Final commit**

If any fixes were needed during this pass, commit them individually with descriptive messages
(each fix is its own commit — do not bundle into this task). Once all checks pass with no further
changes needed, no additional commit is required for this task itself.
