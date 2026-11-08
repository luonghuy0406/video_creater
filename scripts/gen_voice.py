import json
import os
import subprocess
import time

VOICE = "vi-VN-HoaiMyNeural"

# Define scenes and their phrase chunks with relative timing
SCRIPT_DATA = [
    # Scene 1: 0 - 5s
    {
        "scene": 1,
        "phrases": [
            {"text": "Bạn có tin không?", "pause_after": 0.3},
            {"text": "Một khúc xương nhỏ bằng bao diêm,", "pause_after": 0.2},
            {"text": "có thể gánh nổi hai con voi!", "pause_after": 0.6}
        ],
        "target_start": 0.4
    },
    # Scene 2: 5 - 13s
    {
        "scene": 2,
        "phrases": [
            {"text": "Ai cũng cười.", "pause_after": 0.4},
            {"text": "Một con voi nặng mấy tấn,", "pause_after": 0.3},
            {"text": "mà chỉ đặt lên một khúc xương bé tí?", "pause_after": 0.8}
        ],
        "target_start": 5.4
    },
    # Scene 3: 13 - 23s
    {
        "scene": 3,
        "phrases": [
            {"text": "Nhưng khúc xương không hề gãy!", "pause_after": 0.4},
            {"text": "Nó chịu được tới chín tấn,", "pause_after": 0.3},
            {"text": "hơn cả thép nếu cùng trọng lượng.", "pause_after": 0.8}
        ],
        "target_start": 13.5
    },
    # Scene 4: 23 - 35s
    {
        "scene": 4,
        "phrases": [
            {"text": "Bạn thấy đấy, bí mật nằm ở bên trong.", "pause_after": 0.4},
            {"text": "Bên ngoài xương cứng như đá,", "pause_after": 0.3},
            {"text": "nhưng bên trong lại xốp như tổ ong!", "pause_after": 0.8}
        ],
        "target_start": 23.5
    },
    # Scene 5: 35 - 44s
    {
        "scene": 5,
        "phrases": [
            {"text": "Nhờ vậy, xương vừa chắc khỏe", "pause_after": 0.2},
            {"text": "để gánh cả cơ thể,", "pause_after": 0.3},
            {"text": "vừa đủ nhẹ để chúng ta chạy nhảy.", "pause_after": 0.8}
        ],
        "target_start": 35.2
    },
    # Scene 6: 44 - 50s
    {
        "scene": 6,
        "phrases": [
            {"text": "Và còn điều tuyệt hơn:", "pause_after": 0.3},
            {"text": "xương tự lành lại được, trong khi thép thì không.", "pause_after": 0.4},
            {"text": "Bạn đang mang theo một thứ siêu phẩm đấy!", "pause_after": 0.5}
        ],
        "target_start": 43.6
    }
]

def get_duration(audio_file):
    cmd = [
        ".venv/bin/ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", audio_file
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return float(res.stdout.strip())

def generate_with_retry(txt, mp3_path, max_retries=5):
    for attempt in range(max_retries):
        try:
            cmd = [
                ".venv/bin/edge-tts",
                "--voice", VOICE,
                "--text", txt,
                "--write-media", mp3_path
            ]
            res = subprocess.run(cmd, capture_output=True, text=True)
            if res.returncode == 0 and os.path.exists(mp3_path) and os.path.getsize(mp3_path) > 100:
                return True
            print(f"Retry {attempt+1}/{max_retries} for: {txt} ({res.stderr.strip()[:100]})")
        except Exception as e:
            print(f"Exception on retry {attempt+1}: {e}")
        time.sleep(1.0 + attempt * 1.5)
    raise RuntimeError(f"Failed to generate TTS after {max_retries} attempts: {txt}")

def main():
    os.makedirs("out/phrases", exist_ok=True)
    os.makedirs("public", exist_ok=True)
    
    phrase_records = []
    phrase_id = 0
    current_time = 0.4
    
    for sec in SCRIPT_DATA:
        scene_id = sec["scene"]
        target_start = sec["target_start"]
        
        current_time = max(current_time, target_start)
            
        for p in sec["phrases"]:
            txt = p["text"]
            pause = p["pause_after"]
            mp3_path = f"out/phrases/p_{phrase_id:03d}.mp3"
            
            # Generate audio for phrase with retry
            generate_with_retry(txt, mp3_path)
            
            dur = get_duration(mp3_path)
            start_t = current_time
            end_t = current_time + dur
            
            phrase_records.append({
                "id": phrase_id,
                "scene": scene_id,
                "text": txt,
                "file": mp3_path,
                "start_time": round(start_t, 3),
                "end_time": round(end_t, 3),
                "duration": round(dur, 3),
                "start_frame": int(round(start_t * 30)),
                "end_frame": int(round(end_t * 30))
            })
            
            print(f"Phrase {phrase_id:02d} (Sc {scene_id}): [{start_t:5.2f}s -> {end_t:5.2f}s] {txt}")
            current_time = end_t + pause
            phrase_id += 1
            time.sleep(0.3)

    total_duration = 50.0 # 50 seconds
    print(f"Total spoken duration ends at: {current_time:.2f}s, target short length: {total_duration:.1f}s")

    # Combine all phrases into one 50-second public/voice.wav
    inputs = []
    filter_parts = []
    for i, pr in enumerate(phrase_records):
        inputs.extend(["-i", pr["file"]])
        delay_ms = int(pr["start_time"] * 1000)
        filter_parts.append(f"[{i}]adelay={delay_ms}|{delay_ms}[a{i}]")
        
    mix_ins = "".join(f"[a{i}]" for i in range(len(phrase_records)))
    filter_parts.append(f"{mix_ins}amix=inputs={len(phrase_records)}:duration=longest:dropout_transition=0,apad=whole_dur={total_duration}[outa]")
    
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
    print("Exported public/voice.wav")
    
    # Save subtitles & timing metadata
    metadata = {
        "total_frames": int(total_duration * 30),
        "fps": 30,
        "voice": VOICE,
        "phrases": phrase_records
    }
    with open("public/subtitles.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    print("Exported public/subtitles.json with", len(phrase_records), "phrase subtitles.")

if __name__ == "__main__":
    main()
