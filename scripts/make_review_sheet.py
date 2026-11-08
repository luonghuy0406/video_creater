from PIL import Image, ImageDraw, ImageFont
import os

frames = [
    (80, "Cảnh 1: Cậu bé giơ khúc xương nhỏ, voi bước tới"),
    (300, "Cảnh 2: Cậu bé đặt xương xuống, voi cười khẩy nhấc chân"),
    (495, "Cảnh 3A: Voi dẫm lên khúc xương, xương chịu vững 9 tấn"),
    (600, "Cảnh 3B: Mắt voi tròn xoe sửng sốt"),
    (850, "Cảnh 4: Lát cắt 3D - Vỏ ngoài đặc sáng, ruột tổ ong ấm áp"),
    (1150, "Cảnh 5: Cậu bé chạy nhảy, khung xương phát sáng neon"),
    (1400, "Cảnh 6: Voi chỉ vòi vào cậu bé, cả hai cười vui vẻ")
]

# Each frame is 540x960 (half resolution draft)
# Let's arrange them in a 4-column or 7-column or 2-row layout:
# 4 columns in row 1, 3 in row 2
cols = 4
rows = 2
thumb_w = 400
thumb_h = int(960 * (thumb_w / 540)) # 711
card_h = thumb_h + 60
margin = 20

sheet_w = cols * thumb_w + (cols + 1) * margin
sheet_h = rows * card_h + (rows + 1) * margin

sheet = Image.new("RGB", (sheet_w, sheet_h), "#141120")
draw = ImageDraw.Draw(sheet)

for idx, (f_num, caption) in enumerate(frames):
    r = idx // cols
    c = idx % cols
    
    img_path = f"out/draft/frame_{f_num}.jpg"
    if os.path.exists(img_path):
        im = Image.open(img_path).resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        x = margin + c * (thumb_w + margin)
        y = margin + r * (card_h + margin)
        
        # Border
        draw.rectangle([x - 2, y - 2, x + thumb_w + 1, y + thumb_h + 1], outline="#ffcc33", width=2)
        sheet.paste(im, (x, y))
        
        # Caption bar
        cap_y = y + thumb_h + 8
        draw.rectangle([x, cap_y, x + thumb_w, cap_y + 44], fill="#211b33")
        draw.text((x + 10, cap_y + 12), f"F{f_num}: {caption[:38]}...", fill="#ffffff")

out_file = "out/draft/REVIEW_SHEET.jpg"
sheet.save(out_file, quality=92)
print("Saved review sheet:", out_file)
