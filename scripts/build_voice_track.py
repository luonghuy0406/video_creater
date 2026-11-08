import json
import os
import subprocess
from gtts import gTTS

SCRIPT = [
    # Scene 1: 0 - 5.5s
    {
        "scene": 1,
        "phrases": [
            {"text": "Bạn có tin không?", "pause": 0.25},
            {"text": "Một khúc xương nhỏ bằng bao diêm,", "pause": 0.2},
            {"text": "có thể gánh nổi hai con voi!", "pause": 0.6}
        ],
        "start": 0.3
    },
    # Scene 2: 5.5 - 13.5s
    {
        "scene": 2,
        "phrases": [
            {"text": "Ai cũng cười.", "pause": 0.35},
            {"text": "Một con voi nặng mấy tấn,", "pause": 0.25},
            {"text": "mà chỉ đặt lên một khúc xương bé tí?", "pause": 0.8}
        ],
        "start": 5.4
    },
    # Scene 3: 13.5 - 23.5s
    {
        "scene": 3,
        "phrases": [
            {"text": "Nhưng khúc xương không hề gãy!", "pause": 0.35},
            {"text": "Nó chịu được tới chín tấn,", "pause": 0.3},
            {"text": "hơn cả thép nếu cùng trọng lượng.", "pause": 0.8}
        ],
        "start": 13.6
    },
    # Scene 4: 23.5 - 35.0s
    {
        "scene": 4,
        "phrases": [
            {"text": "Bạn thấy đấy, bí mật nằm ở bên trong.", "pause": 0.4},
            {"text": "Bên ngoài xương cứng như đá,", "pause": 0.3},
            {"text": "nhưng bên trong lại xốp như tổ ong!", "pause": 0.8}
        ],
        "start": 23.6
    },
    # Scene 5: 35.0 - 43.5s
    {
        "scene": 5,
        "phrases": [
            {"text": "Nhờ vậy, xương vừa chắc khỏe để gánh cả cơ thể,", "pause": 0.3},
            {"text": "vừa đủ nhẹ để chúng ta chạy nhảy.", "pause": 0.8}
        ],
        "start": 35.0
    },
    # Scene 6: 43.5 - 50.0s
    {
        "scene": 6,
        "phrases": [
            {"text": "Và còn điều tuyệt hơn:", "pause": 0.25},
            {"text": "xương tự lành lại được, trong khi thép thì không.", "pause": 0.35},
            {"text": "Bạn đang mang theo một thứ siêu phẩm đấy!", "pause": 0.5}
        ],
        "start": 43.5
    }
]

def get_dur(f):
    res = subprocess.run([
        ".venv/bin/ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", f
    ], capture_output=True, text=True, check=True)
    return float(res.stdout.strip())

def main():
    os.makedirs("out/phrases", exist_ok=True)
    os.makedirs("public", exist_ok=True)
    
    phrase_data = []
    pid = 0
    cur_time = 0.3
    
    for sec in SCRIPT:
        sc = sec["scene"]
        cur_time = max(cur_time, sec["start"])
        
        for p in sec["phrases"]:
            raw_mp3 = f"out/phrases/raw_{pid:03d}.mp3"
            fast_mp3 = f"out/phrases/fast_{pid:03d}.mp3"
            txt = p["text"]
            
            # 1. Generate speech via gTTS
            tts = gTTS(txt, lang='vi')
            tts.save(raw_mp3)
            
            # 2. Adjust tempo to 1.1x for youthful energetic rhythm
            subprocess.run([
                ".venv/bin/ffmpeg", "-y", "-i", raw_mp3,
                "-filter:a", "atempo=1.1,volume=1.2",
                fast_mp3
            ], capture_output=True, check=True)
            
            dur = get_dur(fast_mp3)
            start_t = cur_time
            end_t = cur_time + dur
            
            phrase_data.append({
                "id": pid,
                "scene": sc,
                "text": txt,
                "file": fast_mp3,
                "start_time": round(start_t, 3),
                "end_time": round(end_t, 3),
                "start_frame": int(round(start_t * 30)),
                "end_frame": int(round(end_t * 30)),
                "duration": round(dur, 3)
            })
            
            print(f"[{pid:02d}] Sc {sc} ({start_t:5.2f}s - {end_t:5.2f}s | F{int(start_t*30):4d}-F{int(end_t*30):4d}): {txt}")
            cur_time = end_t + p["pause"]
            pid += 1

    total_duration = 50.0 # 50s = 1500 frames
    print(f"\nTotal speech finishes at: {cur_time:.2f}s / {total_duration:.1f}s")
    
    # 3. Merge all into public/voice.wav
    inputs = []
    filter_parts = []
    for i, pr in enumerate(phrase_data):
        inputs.extend(["-i", pr["file"]])
        delay_ms = int(pr["start_time"] * 1000)
        filter_parts.append(f"[{i}]adelay={delay_ms}|{delay_ms}[a{i}]")
        
    mix_ins = "".join(f"[a{i}]" for i in range(len(phrase_data)))
    filter_parts.append(f"{mix_ins}amix=inputs={len(phrase_data)}:duration=longest:dropout_transition=0,apad=whole_dur={total_duration}[outa]")
    
    mix_cmd = [
        ".venv/bin/ffmpeg", "-y"
    ] + inputs + [
        "-filter_complex", ";".join(filter_parts),
        "-map", "[outa]",
        "-t", str(total_duration),
        "-ar", "48000",
        "-ac", "2",
        "public/voice.wav"
    ]
    subprocess.run(mix_cmd, check=True)
    print("Exported public/voice.wav successfully!")
    
    with open("public/subtitles.json", "w", encoding="utf-8") as f:
        json.dump({
            "total_frames": 1500,
            "fps": 30,
            "phrases": phrase_data
        }, f, ensure_ascii=False, indent=2)
    print("Exported public/subtitles.json with", len(phrase_data), "phrases.")

if __name__ == "__main__":
    main()
