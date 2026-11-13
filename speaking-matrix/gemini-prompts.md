# Prompt Gemini tạo frame cho video Speaking Matrix (9:16)

## Chuẩn bị (bắt buộc)
1. Tải ảnh bìa thật của 4 cuốn (30 giây, 1 phút, 2 phút, 3 phút) từ trang sách hoặc ảnh chụp sách của bạn. Ảnh phải rõ nét, chụp thẳng.
2. Mở Gemini (Nano Banana / Imagen), đính kèm cả 4 ảnh bìa ở mọi prompt.
3. Gemini không tự biết bìa sách thật. Nếu không đính kèm ảnh, nó sẽ bịa bìa khác.
4. Sinh ảnh dọc 9:16. Nếu Gemini cho tỉ lệ khác, thêm câu: "Output vertical 9:16, 1080x1920".
5. Chữ tiếng Việt trong ảnh AI hay sai dấu. Vì vậy các prompt dưới đây YÊU CẦU KHÔNG CÓ CHỮ. Chữ sẽ do Remotion đè lên.

## Prompt chung (dán đầu mỗi prompt)
> Dùng đúng 4 ảnh bìa sách đính kèm làm tham chiếu. Giữ nguyên 100% thiết kế, màu sắc, logo và chữ trên bìa, không vẽ lại, không đổi chữ. Phong cách: ảnh quảng cáo hiện đại, ánh sáng điện ảnh, tông xanh navy đậm với điểm nhấn vàng, độ sâu trường ảnh nhẹ. Tỉ lệ dọc 9:16. KHÔNG thêm bất kỳ chữ, logo, watermark nào ngoài chữ có sẵn trên bìa sách. Chừa 35% phần dưới khung hình trống để đặt phụ đề.

## Cảnh 1 — Hook (0–4s)
> [Prompt chung] Cận cảnh một người trẻ đi làm (nam hoặc nữ, người Việt) ngồi ở bàn làm việc trong phòng họp, vẻ mặt bối rối, đơ người khi một đồng nghiệp nước ngoài mờ ảo ở phía sau đang hỏi chuyện. Không có sách trong cảnh này. Ánh sáng lạnh, cảm giác căng thẳng, màu xanh navy chủ đạo.

## Cảnh 2 — Nỗi đau (4–8s)
> [Prompt chung] Một người đi làm mệt mỏi về nhà buổi tối, ngồi trên sofa, laptop đóng bên cạnh, vài cuốn sách tiếng Anh dày chất đống trên bàn. Ánh đèn vàng ấm yếu, cảm giác kiệt sức nhưng vẫn day dứt. Không có chữ.

## Cảnh 3 — Giải pháp: 4 cuốn sách (8–15s)
> [Prompt chung] Bốn cuốn sách trong ảnh tham chiếu xếp thành hàng chéo, từ cuốn 30 giây đến 3 phút, nổi trên nền gradient navy với các hạt sáng vàng nhỏ. Mỗi cuốn thấy rõ bìa, bóng đổ mềm, hơi nghiêng 3D. Đặt ở nửa trên khung hình. Giữ nguyên bìa gốc.

## Cảnh 3b — Từng cuốn riêng (dùng để animate lần lượt, 4 ảnh)
> [Prompt chung] Chỉ cuốn "[30 GIÂY / 1 PHÚT / 2 PHÚT / 3 PHÚT]" nổi giữa khung hình, hơi nghiêng 15 độ, nền navy gradient tối giản có vệt sáng, bóng đổ mềm bên dưới. Không có cuốn nào khác. Giữ nguyên bìa gốc.
*(Chạy 4 lần, mỗi lần đổi tên cuốn. Nên yêu cầu nền trơn để dễ ghép.)*

## Cảnh 4 — Lợi ích (15–20s)
> [Prompt chung] Một người đi làm đang vừa đi bộ trên phố buổi sáng vừa đeo tai nghe và cầm điện thoại, tay kia cầm cuốn sách trong ảnh tham chiếu. Nét mặt tự tin, mỉm cười. Ánh nắng sớm ấm, nền phố mờ. Giữ nguyên bìa sách.

## Cảnh 5 — Ưu đãi (20–26s)
> [Prompt chung] Bộ 4 cuốn sách xếp chồng gọn như một combo, bên cạnh có một hộp giao hàng nhỏ màu vàng mở sẵn, và một điện thoại hiện trang đọc thử (màn hình để mờ, không chữ). Nền navy sáng, hạt sáng vàng, cảm giác ưu đãi hấp dẫn.

## Cảnh 6 — CTA (26–30s)
> [Prompt chung] Cận cảnh bàn tay đang cầm điện thoại, ngón trỏ chuẩn bị bấm, phía sau là 4 cuốn sách mờ nhẹ. Nền navy và vàng, bố cục chừa trống phần dưới. Không chữ.

## Mẹo
- Nếu bìa bị Gemini bóp méo, thêm: "Copy chính xác bìa sách từ ảnh gốc, không chỉnh sửa gì." Hoặc dùng ảnh bìa thật ghép bằng Remotion (khuyến nghị cho cảnh 3, 3b, 5).
- Chạy mỗi prompt 3–4 lần, chọn ảnh đẹp nhất.
- Đặt tên file: `scene1.png … scene6.png`, `book30s.png`, `book1p.png`, `book2p.png`, `book3p.png` rồi bỏ vào `app/public/img/`.

---

# Giọng đọc (thay giọng Linh của macOS)

| Lựa chọn | Ưu điểm | Cách làm |
|---|---|---|
| **ElevenLabs** (Multilingual v2/v3) | Tự nhiên nhất, nhiều giọng tiếng Việt, có thể chỉnh cảm xúc | Dán voice-over vào ElevenLabs, chọn giọng Việt, tải mp3 |
| **FPT.AI / Viettel AI / VBee** | Giọng Việt bản địa, rẻ | Tạo từng câu, tải mp3 |
| **Giọng của chính bạn** | Chân thực nhất cho TikTok | Thu bằng điện thoại, bật lọc ồn |
| **Gemini TTS** | Dùng luôn trong hệ Gemini, có kiểm soát giọng | Prompt: "Đọc bằng giọng nữ trẻ, năng lượng, nhanh vừa phải" |

Kịch bản đọc (6 câu, giữ tên file `s1.mp3 … s6.mp3` để khớp code):
1. Học tiếng Anh năm năm, mà gặp người nước ngoài vẫn đơ?
2. Đi làm cả ngày, đâu có thời gian học bài bản.
3. Speaking Matrix: bắt đầu từ ba mươi giây, rồi tăng dần lên một phút, hai phút, ba phút.
4. Học qua mẫu câu và câu chuyện ngắn, có file nghe, học mọi lúc mọi nơi.
5. Combo bốn cuốn đang có ưu đãi, kèm freeship. Có cả bản đọc thử miễn phí.
6. Bấm link ở giỏ hàng, xem ngay nhé!

Giọng nên: trẻ trung, năng lượng, tốc độ nhanh vừa (khoảng 1.05–1.1x), ngắt rõ ở dấu phẩy.

# Nhạc nền
Prompt cho Suno / Udio / Gemini Lyria:
> Upbeat modern pop-electronic instrumental, 120 BPM, bright plucky synth, light claps, punchy bass, motivational and energetic, builds up in the first 8 seconds then stays steady, short 30 second track, no vocals, clean ending.

Hoặc dùng nhạc có bản quyền thương mại: TikTok Commercial Music Library, Pixabay Music, YouTube Audio Library. Lưu ý: nhạc trending thường không dùng được cho tài khoản affiliate/quảng cáo. Hãy chọn nhạc trong thư viện thương mại của TikTok.
Đặt tên `bgm.mp3` trong `app/public/`. Âm lượng nền sẽ để khoảng 18% và tự giảm khi có giọng đọc.
