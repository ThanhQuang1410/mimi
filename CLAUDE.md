# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Thỏ Mimi" (Mimi the Rabbit) — a client-only web app: a talking rabbit companion for young Vietnamese-speaking children (ages 2–6). It chats via Gemini, speaks with either the browser's built-in TTS or Gemini TTS, listens via Web Speech recognition, plays simple nursery-rhyme melodies with the Web Audio API, plays pre-recorded fairy-tale audio, and teaches English words. No build step, no dependencies, no package.json.

There is no dev server, test suite, linter, or build command. To run it, just open `index.html` in a browser (Chrome/Safari for speech recognition support), or serve the directory statically. It is hosted on GitHub Pages at `https://thanhquang1410.github.io/mimi/` — a **subpath**, so every internal path must stay relative (`./js/...`, `audio/...`); a leading `/` breaks the deploy.

## File layout

- `index.html` — markup only, plus the `<script src>` tags at the end of `<body>` in dependency order.
- `css/skye.css` — the whole stylesheet.
- `js/*.js` — plain classic scripts (deliberately **not** ES modules, so `file://` still works). They all share one global scope, exactly as when this was a single file, so load order in `index.html` is load-bearing.
- `audio/*.mp3` — pre-recorded stories; `audio.md` maps story title → file.

## Code structure (`js/`, in load order)

Each file was one of the numbered sections the old single-file version marked with comment banners. They are listed here in the order `index.html` loads them:

1. `kho.js` — **KHO**, a tiny localStorage wrapper with an in-memory fallback if storage is blocked.
2. `fs.js` — **FS (hệ tệp trí nhớ)** — a virtual markdown "filesystem" under `/nho/*.md`, persisted in `localStorage` under key `mimi_fs`. This is Mimi's long-term memory: `ho_so.md` (child profile), `tu_vung.md` (English vocab + review counts), `nhat_ky.md` (conversation diary). Exposed to the model as Gemini function-calling tools (`doc_tep`, `ghi_tep`, `them_dong`, `thay_doan`, `xoa_tep`) defined in `CONG_CU` / dispatched by `chayCongCu`.
3. `cau-hinh.js` — **config, quota & system prompts** — `CAI` (settings object, persisted as `mimi_cai`) and daily call budgets `DUNG`/`TRAN` for chat and TTS calls, reset at UTC-8 midnight (15:00 Vietnam time). Two system prompts are built dynamically: `LUAT_MIMI()` (child-facing persona, no tools, fast turn) and `LUAT_THU_THU()` ("the Librarian" — background agent that reads recent turns and updates the `/nho/*.md` memory files via tool calls).
4. `trang-thai.js` + `dong-ho.js` — **shared UI state** (`datTrangThai`, `hienLoi`) and the **play-time clock** — `PHIEN` (session state persisted as `mimi_phien`) enforces session length (`CAI.phut` minutes) and a mandatory cooldown (`CAI.nghi` minutes) before the next session, shown via the sleep screen (`#ngu`).
5. `am-thanh.js` + `nhac.js` — **AudioContext/wake-lock helpers** and a **music synth** — a small oscillator-based synth (`BAI` = song note tables, `phatBai`) playing 6 built-in nursery rhymes with no audio assets.
6. `truyen.js` — pre-recorded stories: the `TRUYEN` table (id → title + mp3 path), `timTruyen` (fuzzy-matches whatever id the model emits), and `phatTruyen`. The single `<audio>` element it reuses **must** be unlocked by `moKhoaTruyen()` inside the `#batDau` click handler — iOS/Safari refuses `play()` on an element that never played during a real user gesture, and stories always start after Skye finishes speaking.
7. `danh-dau.js` — **markup parsing** — model responses use two inline conventions: `<en>word|nghĩa</en>` for English vocabulary callouts and `[nhac:id]` / `[doctruyen:id]` at the end of a reply to trigger a song or a pre-recorded story. Parsed by `bocTach`/`tachDoan`/`dep`.
8. `noi.js` — **speech output** — `noiMay` (browser `SpeechSynthesis`, tuned pitch/rate per language, splits into `<en>`/Vietnamese segments) and `noiGemini` (calls Gemini TTS via `UNG_VIEN_TTS` candidate list, decodes WAV/PCM audio, falls back to `noiMay` on any failure). `noi()` is the dispatcher that decides which to use based on `CAI.cheDo` (`may`/`gemini`) and `CAI.dungGem` quota policy (`diem`/`luon`/`tat`).
9. `harness.js` — **Gemini harness** — `goiGemini` tries candidate models in `UNG_VIEN_CHAT` in order (handles 429/404/400 fallthrough, remembers the working model in `modelChat`/localStorage `mimi_model`). `hoiMimi` is the main foreground chat turn (fast, no tools). `chayThuThu`/`xepVaoHang` run the background Librarian agent every `NHIP_THU_THU` (6) turns, looping up to 4 rounds of tool calls to update memory files.
10. `nghe.js` — **speech recognition** — wraps `webkitSpeechRecognition`/`SpeechRecognition`, Vietnamese locale, auto-restarts while listening is enabled.
11. `nut.js` + `khoi-dong.js` — **UI wiring** — button handlers for the four action buttons (sing/story/English/stop), session start/lock screens, parent gate (arithmetic captcha via `congBoMe`).
12. `bome.js` — **parent settings panel (`#bome`)** — API key / proxy URL, child name/age, session/cooldown length, voice engine + tuning, quota dashboard, and a raw editor for the `/nho/*.md` memory files.

## Key conventions to preserve when editing

- **Vietnamese naming throughout** (functions, variables, CSS classes, HTML ids) — keep new code consistent with this; don't introduce English identifiers into the existing style.
- **No build tooling.** Everything must keep working as plain static files opened directly (`file://`) or served as-is — do not introduce bundlers, npm packages, or ES modules unless explicitly asked. New JS goes in a new `js/*.js` file plus a `<script src>` tag in `index.html` at the right point in the dependency order.
- **Relative paths only.** GitHub Pages serves this from the `/mimi/` subpath; a leading `/` in any href/src/audio path 404s in production even though it works locally.
- **API access is either a direct Gemini API key or a proxy URL** (`CAI.key` / `CAI.proxy`), both optional/user-supplied via the parent settings panel — never hardcode credentials.
- **Free-tier quota discipline is load-bearing.** Chat and TTS call budgets are deliberately conservative (`TRAN.chat`, `TRAN.tts`) with safety margin so the app never hits the API cap mid-conversation; the current known-good model list is in `UNG_VIEN_CHAT`/`UNG_VIEN_TTS` with dated comments — verify against real API behavior before changing rather than guessing.
- **Child-safety rules live in the system prompts** (`LUAT_MIMI`, `LUAT_THU_THU`) — content restrictions (no violence/fear/secrets-from-parents), memory redaction rules (never store addresses, school names, phone numbers), and tone constraints are prompt-encoded, not code-encoded. Changes to child-facing behavior usually mean editing these template strings, not application logic.
- **Everything persists to `localStorage`** under a handful of fixed keys (`mimi_fs`, `mimi_cai`, `mimi_dung`, `mimi_phien`, `mimi_model`) via the `KHO` wrapper — there is no backend/server-side storage.
