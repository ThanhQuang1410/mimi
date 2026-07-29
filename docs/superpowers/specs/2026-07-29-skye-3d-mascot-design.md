# Linh vật Skye 3D + đổi tên thương hiệu — thiết kế

Ngày: 2026-07-29

## Bối cảnh

App hiện dùng linh vật thỏ SVG tên "Mimi", điều khiển hoàn toàn bằng CSS keyframes + JS
(`datTrangThai`, `moMieng`/`khepMieng`, `voTay`). User có 1 model 3D rigged của Skye (nhân vật
Paw Patrol) — `skye_paw_patrol_rig.glb` — muốn dùng làm linh vật mới với cử chỉ vẫy tai/nghiêng
đầu khi nghe, ngoáy đuôi liên tục, nhảy khi được khen đúng. Đồng thời đổi tên bot từ "Mimi" sang
"Skye" toàn bộ (UI + system prompt + mô tả nhân vật).

Đã kiểm tra 3 file glb người dùng cung cấp:
- `skye_paw_patrol_no_rig.glb` và `paw_patrol_rescue_run_skye.glb`: cùng 1 model, không rig,
  không animation, chỉ 2 mesh gộp — không dùng được cho animation từng phần. **Sẽ xoá khỏi repo.**
- `skye_paw_patrol_rig.glb` (8.3MB, CC-BY-4.0, tác giả Guilherme Navarro/Sketchfab): có rig đầy
  đủ — xương tai riêng mỗi bên, đuôi 17 đốt, cổ/đầu/hàm/lưỡi, 4 chân, cánh ba lô. Không có
  animation clip sẵn (`animations: 0`) — animate bằng cách tự xoay bone trong vòng lặp render.
  **Đây là model dùng chính thức.**

User sẽ deploy qua GitHub Pages (HTTPS) — không còn lo ngại "phải chạy local server" ở production;
chỉ cần server local lúc test tại máy trước khi deploy (do `fetch()` không hoạt động qua `file://`).

## 1. Kiến trúc render 3D

- Thêm Three.js bản UMD classic (không cần `type="module"` cho phần này để không đụng vào script
  chính) qua CDN, cộng `GLTFLoader` classic build.
- Toàn bộ logic 3D nằm trong **1 `<script type="module">` riêng biệt**, không sửa cấu trúc script
  lớn hiện có. Lộ ra `window.Mimi3D` với:
  - `ready` (boolean, mặc định `false`)
  - `setTrangThai(t)` — nhận `"ngu"|"nghe"|"nghi"|"noi"`, đổi cử chỉ tương ứng.
  - `moMieng()` / `khepMieng()` — mở/khép hàm, gọi cùng nhịp với TTS hiện tại.
  - `nhay()` — chạy animation nhảy (~1–1.5s) rồi tự về idle.
- `#khungMimi` giữ nguyên, thêm `<canvas id="mimiCanvas">` cạnh `<svg id="mimi">`. Mặc định
  canvas ẩn (`display:none`), SVG hiện — y hệt hành vi hiện tại cho tới khi 3D báo sẵn sàng.
- Khi model load xong + định vị được toàn bộ bone cần dùng: module tự ẩn SVG, hiện canvas, set
  `Mimi3D.ready = true`.
- **Fallback**: lỗi tải hoặc quá ~4 giây chưa sẵn sàng → giữ nguyên SVG, `ready` luôn `false`.
  Script chính không cần biết lý do, chỉ cần check `window.Mimi3D?.ready` mỗi lần gọi.
- Canvas responsive theo đúng kích thước khung hiện có của `#mimi`
  (`min(44vh,78vw)`, `max-width:400px`), cập nhật lại camera/renderer khi resize.
- **Ẩn kính đeo mặt**: sau khi load, ẩn (`visible=false`) đúng 3 node tên chứa `Goggles_Face`
  (`Goggles_Face`, `Goggles_Face_Glass`, `GogglesStrap_Face`). **Giữ nguyên** `Goggles_Top`,
  `Goggles_Top_Glass`, `GogglesStrap_Top`, `Helmet_Fly`.

## 2. Cử chỉ theo trạng thái

| Trạng thái | Cử chỉ |
|---|---|
| Idle (mọi lúc, nền) | Đuôi ngoáy nhẹ liên tục — xoay `tail_s_1` theo sin, lan pha trễ qua ~6 đốt đầu cho tự nhiên |
| `nghe` | Tai (`EAR_L`/`EAR_R`) vẫy nhanh hơn + đầu (`x_BN_head`) nghiêng sang một bên theo nhịp |
| `nghi` | Giữ idle mặc định, không thêm dáng riêng |
| `noi` | Hàm (`x_BN_jaw_1`) mở/khép theo `moMieng()`/`khepMieng()` |
| `[khen]` (trả lời đúng) | `nhay()` thay cho `voTay()` cũ — thân nhảy lên xuống 1 nhịp, 2 chân trước hơi co lúc tiếp đất |

## 3. Tích hợp với script chính (không đổi cấu trúc)

4 hàm cầu nối trong script chính (`datTrangThai`, `moMieng`, `khepMieng`, `voTay`) chỉ thêm 1
điều kiện đầu hàm: nếu `window.Mimi3D?.ready` thì gọi hàm 3D tương ứng và `return` sớm; không thì
chạy đúng code SVG cũ như hiện tại (không xoá code SVG — đó chính là fallback).

```js
function voTay(){
  if(window.Mimi3D?.ready){ window.Mimi3D.nhay(); return; }
  // ...code voTay() cũ giữ nguyên...
}
```

Tương tự cho `datTrangThai` (thêm 1 dòng gọi `setTrangThai`), `moMieng`, `khepMieng`.

## 4. Đổi tên thương hiệu Mimi → Skye

Đổi **toàn bộ** tham chiếu "Mimi"/"thỏ" sang "Skye"/"chú chó cứu hộ":
- `<title>`, `apple-mobile-web-app-title`, mọi chuỗi UI hiển thị tên ("... đang ngủ", "Đánh thức
  ...", "... đi ngủ rồi", nút bấm, placeholder, v.v.)
- `LUAT_MIMI()` — đổi mô tả nhân vật từ "cô thỏ nhỏ dễ thương" sang "chú chó cứu hộ Paw Patrol",
  giữ nguyên giọng ấm áp, xưng "Skye", gọi bé giữ nguyên như cũ. Đổi tên hàm này thành phù hợp
  hơn nếu tiện (không bắt buộc, có thể giữ tên hàm `LUAT_MIMI` nội bộ để giảm rủi ro đổi vỡ chỗ
  khác gọi tới nó — chỉ đổi NỘI DUNG chuỗi trả về, không đổi tên hàm/biến JS).
- `LUAT_THU_THU()` — đổi các câu mô tả "thủ thư trí nhớ của Thỏ Mimi" tương tự.
- Comment code có nhắc "Mimi"/"thỏ" mang tính mô tả UI (không phải tên biến/hàm JS) — cập nhật
  cho khớp, không bắt buộc phải đổi tên biến/hàm nội bộ (`FS`, `CAI`, v.v. giữ nguyên, đây là chi
  tiết triển khai không ảnh hưởng người dùng).

## 5. Dọn dẹp file

Xoá `skye_paw_patrol_no_rig.glb` và `paw_patrol_rescue_run_skye.glb` khỏi repo (không dùng nữa).
Giữ `skye_paw_patrol_rig.glb`.

## 6. Kiểm thử (thủ công, qua local server)

- Model Skye hiện đúng vị trí/khung hình, không đeo kính mặt, còn nguyên mũ bay + kính trên mũ.
- Đuôi ngoáy nền liên tục; lúc nghe tai vẫy + đầu nghiêng; lúc nói hàm khớp cả 3 tầng giọng
  (Cloud TTS/Gemini/máy); trả lời đúng trigger nhảy.
- Chặn mạng hoặc đổi tên file `.glb` tạm thời → xác nhận sau ~4s tự rơi về thỏ SVG, app vẫn chơi
  bình thường (không đứng hình, không lỗi console chặn luồng chính).
- Tiêu đề tab, mọi lời thoại UI, và lời Skye tự giới thiệu ở lượt đầu tiên đều dùng tên mới, không
  còn "Mimi"/"thỏ" sót lại (grep toàn file để xác nhận).
