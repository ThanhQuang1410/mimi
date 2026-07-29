# Nút mic đơn + Google Cloud TTS — thiết kế

Ngày: 2026-07-29

## Bối cảnh

`index.html` là toàn bộ ứng dụng "Thỏ Mimi" — single-file, client-only, không build/test tooling.
Ba vấn đề cần giải quyết:

1. Giọng máy (browser `SpeechSynthesis`) "Linh" mà bố mẹ chọn không truyền cảm.
2. UI 4 nút (`Hát`/`Kể truyện`/`Tiếng Anh`/`Dừng`) khó dùng với bé nhỏ tuổi.
3. Cần một API TTS miễn phí khác tốt hơn giọng máy.

## Quyết định đã chốt

- Bỏ 4 nút hành động, thay bằng **1 nút mic duy nhất**. App tiếp tục tự động lắng nghe sau mỗi
  lượt như hiện tại (`batNghe`/`ketThucLuot`); nút chỉ dùng để **bé ngắt lời Mimi** khi đang
  nói/hát, hoặc huỷ lượt hiện tại nếu đang nghe/nghĩ. Bé phải nói ra yêu cầu (hát, kể chuyện, học
  tiếng Anh...) thay vì bấm nút chuyên biệt.
- Thêm **Google Cloud Text-to-Speech** làm tầng giọng mặc định, thay thế vai trò của giọng máy.
  Giọng máy lùi xuống làm lưới an toàn cuối cùng khi mọi tầng khác lỗi.
- Google Cloud TTS dùng **chung ô "Mã API Gemini"** hiện có (cùng GCP project với AI Studio key);
  bố mẹ chỉ cần bật thêm API "Cloud Text-to-Speech" trong Google Cloud Console.

## 1. Nút mic duy nhất

Thay `#nut` (4 nút) bằng một phần tử `#nutMic` duy nhất, đổi hình dạng/nhãn theo `trangThai`
(`ngu`/`nghe`/`nghi`/`noi`), tương tự cách `#micCham`/`#micChu` đã đổi trạng thái hiện nay.

Một handler click duy nhất:

- Nếu `trangThai === "noi"`: ngắt lời ngay — gộp `imNgay()` + `dungNhac()` (logic hiện có trong
  handler của `#nutDung`), sau đó `ketThucLuot()` để quay lại nghe.
- Nếu `trangThai === "nghe"` hoặc `"nghi"`: huỷ lượt hiện tại (`tatNghe()`, huỷ request đang chờ
  nếu có), quay lại chờ nghe — phòng khi mic bị treo.
- Nếu `trangThai === "ngu"`: không làm gì (giữ hành vi hiện tại, phiên chưa bắt đầu qua
  `#batDau`).

Xoá: 4 `<button class="n ...">` trong `#nut`, `.n[data-noi]` listener loop, handler riêng của
`#nutDung`. Xoá CSS liên quan (`.n`, `.n.nhac/.truyen/.anh/.dung`) không còn dùng.

## 2. Cấu trúc 3 tầng giọng nói

Thứ tự thử khi phát một câu nói (`noi()`):

```
noiCloud(cau)                     -- tầng mặc định
  lỗi/không có key
noiGemini(cau)                    -- chỉ khi dungGem cho phép + còn quota TTS + đang ở khoảnh khắc quan trọng
  lỗi
noiMay(cau)                       -- lưới an toàn cuối, luôn hoạt động (browser API, không cần key)
```

`noiGemini` đã tự fallback về `noiMay` khi lỗi (giữ nguyên `catch` hiện có ở cuối `noiGemini`) —
chỉ cần chèn `noiCloud` làm bước thử đầu tiên, theo đúng pattern try/catch mà `taoTieng` đang dùng
cho các ứng viên model TTS Gemini.

### `noiCloud(cau, xongThi)`

- Gọi `https://texttospeech.googleapis.com/v1/text:synthesize?key=<CAI.key>` (hoặc qua
  `CAI.proxy` như các API khác trong file đang làm — tái dùng pattern `sanSang()`/`diaChi()`).
- Body: `{ input:{text}, voice:{languageCode:"vi-VN", name:"vi-VN-Wavenet-A"},
  audioConfig:{audioEncoding:"LINEAR16", speakingRate: CAI.toc} }`. Giọng hard-code, không cho bố
  mẹ chọn (giữ đơn giản).
- Không đếm quota riêng (`TRAN`/`DUNG`) cho Cloud TTS — free tier quá lớn (~4 triệu ký tự/tháng
  cho Wavenet) để cần theo dõi hàng ngày như Gemini. Chỉ bắt lỗi HTTP (401/403/429/mạng) và ném
  exception để `noi()` rơi xuống tầng sau, giống cách `taoTieng` đang làm.
- Response trả `audioContent` (base64) — tái dùng `giaiMaAm()` đã có sẵn để decode (đã hỗ trợ cả
  WAV lẫn PCM thô).

### Loại bỏ

- `CAI.cheDo` (không còn "chọn 1 trong 2 tầng" — giờ là chuỗi tự động).
- `CAI.giongMay`, `CAI.cao` và toàn bộ logic chọn/xếp hạng giọng máy theo giới tính
  (`chonGiong`, `GIONG_NAM`, `GIONG_NU`, `gioiTinh`, `xepHang`) — không còn ý nghĩa vì giọng máy
  chỉ còn là fallback câm lặng, không cần chọn giọng cụ thể. `noiMay` khi cần giọng vẫn dùng
  `speechSynthesis.getVoices()` mặc định của trình duyệt (không set `u.voice`).
- `CAI.toc` **giữ lại**, đổi vai trò: một tốc độ chung áp cho cả `speakingRate` của Cloud TTS lẫn
  `u.rate` của `noiMay` khi fallback.

## 3. Rút gọn khung cài đặt giọng nói (`#bome`)

Xoá: nút gạt `#cheDo` (2 nút Giọng máy/Giọng Gemini), khối `#khoiMay` (chọn giọng máy cụ thể +
slider Cao độ `#cao`), `veDanhSachGiong()` và các đoạn chẩn đoán giọng máy liên quan.

Giữ lại, đổi bố cục:

- Khối Gemini (`#khoiGemini`, không còn ẩn/hiện theo `cheDo` — luôn hiển thị vì Gemini vẫn là
  tầng tuỳ chọn độc lập): chọn nhân vật giọng (`#giongGem`) + `#dungGem` (điểm/luôn/tắt).
- 1 slider **Tốc độ nói** duy nhất (đổi tên/label từ `#toc` hiện có, bỏ `#cao`), ghi chú áp dụng
  cho cả giọng chính lẫn giọng dự phòng.
- Nút **Nghe thử** giữ nguyên hành vi, giờ chạy qua đúng chuỗi 3 tầng thật.
- "Hạn mức hôm nay": vẫn 2 thanh như cũ (Lượt trò chuyện, Lượt giọng Gemini) — không thêm thanh
  cho Cloud TTS.
- Thêm 1 dòng `<p class="ghi">` ngắn hướng dẫn bố mẹ bật "Cloud Text-to-Speech API" trong Google
  Cloud Console cho project chứa key Gemini đang dùng.

## 4. Không đổi

`LUAT_MIMI`, `LUAT_THU_THU`, hệ tệp trí nhớ `FS`/`CONG_CU`/`chayCongCu`, đồng hồ chơi
`PHIEN`/session lock, module nhạc `BAI`/`phatBai`, nhận diện giọng nói (`SR`/`taoNhanDang`), cổng
phụ huynh (`congBoMe`), quota chat (`TRAN.chat`/`DUNG.chat`/`goiGemini` model fallback).

## 5. Kiểm thử (thủ công — không có test suite)

- Nút mic đổi đúng hình theo trạng thái ngủ/nghe/nghĩ/nói.
- Bấm mic lúc Mimi đang nói → ngắt lời ngay, chuyển sang nghe.
- Nói yêu cầu hát/kể chuyện/tiếng Anh bằng giọng thật (không còn nút riêng) → phản hồi đúng.
- Xoá/làm sai key Cloud TTS → xác nhận rơi đúng thứ tự xuống Gemini rồi giọng máy, không đứng
  hình, không mất câu trả lời.
- Slider Tốc độ ảnh hưởng cả Cloud TTS lẫn giọng máy fallback.
