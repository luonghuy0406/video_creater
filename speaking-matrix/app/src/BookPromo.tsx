import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const C = {
  bg: "#0b1220",
  card: "rgba(11,18,32,0.72)",
  accent: "#ffd23f",
  teal: "#2ee6c5",
  coral: "#ff5c7a",
  text: "#ffffff",
};
const FONT = "'Helvetica Neue', Arial, sans-serif";

const useIn = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 120 } });
};

// Full-bleed photo with slow Ken Burns zoom
const Photo: React.FC<{ src: string; frames: number; dir?: 1 | -1; focusY?: number }> = ({
  src,
  frames,
  dir = 1,
  focusY = 50,
}) => {
  const frame = useCurrentFrame();
  const t = frame / frames;
  const scale = dir === 1 ? 1.0 + 0.09 * t : 1.09 - 0.09 * t;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          transformOrigin: `50% ${focusY}%`,
        }}
      />
    </AbsoluteFill>
  );
};

const Shade: React.FC<{ top?: number; bottom?: number }> = ({ top = 0.55, bottom = 0.7 }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(180deg, rgba(5,10,22,${top}) 0%, rgba(5,10,22,0) 32%, rgba(5,10,22,0) 55%, rgba(5,10,22,${bottom}) 100%)`,
    }}
  />
);

const Headline: React.FC<{
  children: React.ReactNode;
  top?: number;
  bottom?: number;
  size?: number;
  color?: string;
  delay?: number;
}> = ({ children, top, bottom, size = 104, color = C.text, delay = 0 }) => {
  const p = useIn(delay);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top,
        bottom,
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.1,
        textAlign: "center",
        color,
        padding: "0 80px",
        textShadow: "0 6px 30px rgba(0,0,0,0.75)",
        opacity: p,
        transform: `translateY(${(1 - p) * 50}px) scale(${0.92 + 0.08 * p})`,
      }}
    >
      {children}
    </div>
  );
};

const Pill: React.FC<{ children: React.ReactNode; delay: number; color?: string; bg?: string }> = ({
  children,
  delay,
  color = C.text,
  bg = C.card,
}) => {
  const p = useIn(delay);
  return (
    <div
      style={{
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 52,
        color,
        background: bg,
        borderRadius: 999,
        padding: "16px 38px",
        opacity: p,
        transform: `translateY(${(1 - p) * 40}px)`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
};

const S1: React.FC<{ f: number }> = ({ f }) => (
  <>
    <Photo src="img/scene1.png" frames={f} />
    <Shade top={0.75} />
    <Headline top={170} size={88}>
      5 năm học
      <br />
      <span style={{ color: C.coral }}>vẫn không nói được?</span>
    </Headline>
  </>
);

const S2: React.FC<{ f: number }> = ({ f }) => (
  <>
    <Photo src="img/scene2.png" frames={f} dir={-1} />
    <Shade top={0.75} />
    <Headline top={150} size={88}>
      Bận cả ngày
      <br />+ Mất gốc
      <br />
      <span style={{ color: C.coral }}>= Bỏ cuộc</span>
    </Headline>
  </>
);

const S3: React.FC<{ f: number }> = ({ f }) => {
  const frame = useCurrentFrame();
  const steps = [
    ["30 giây", "#2f5fd0"],
    ["1 phút", "#3cb54a"],
    ["2 phút", "#ee5a2a"],
    ["3 phút", "#7a3fc1"],
  ];
  const active = Math.floor(Math.max(0, frame - 60) / 28);
  return (
    <>
      <Photo src="img/scene3.png" frames={f} focusY={30} />
      <Shade top={0.2} bottom={0.6} />
      <Headline top={1010} size={96} color={C.accent}>
        Speaking Matrix
      </Headline>
      <div style={{ position: "absolute", top: 1150, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 14 }}>
        {steps.map(([t, col], i) => (
          <Pill key={t} delay={50 + i * 10} bg={i <= active ? col : C.card}>
            {t}
          </Pill>
        ))}
      </div>
    </>
  );
};

const S4: React.FC<{ f: number }> = ({ f }) => (
  <>
    <Photo src="img/scene4.png" frames={f} />
    <Shade top={0.7} bottom={0.65} />
    <Headline top={170}>
      Học mọi lúc,
      <br />
      <span style={{ color: C.teal }}>mọi nơi</span>
    </Headline>
    <div style={{ position: "absolute", top: 480, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 14 }}>
      <Pill delay={25}>💬 Mẫu câu</Pill>
      <Pill delay={40}>🎧 File nghe</Pill>
      <Pill delay={55}>📱 App</Pill>
    </div>
  </>
);

const S5: React.FC<{ f: number }> = ({ f }) => {
  const frame = useCurrentFrame();
  const p = useIn(0);
  const pulse = 1 + Math.sin(frame / 5) * 0.03;
  return (
    <>
      <Photo src="img/scene5.png" frames={f} focusY={35} />
      <Shade top={0.25} bottom={0.6} />
      <div
        style={{
          position: "absolute",
          top: 170,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          transform: `scale(${p * pulse})`,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 110,
            color: "#0b1220",
            background: C.accent,
            borderRadius: 36,
            padding: "22px 64px",
            textAlign: "center",
            lineHeight: 1.05,
          }}
        >
          COMBO 4 CUỐN
        </div>
      </div>
      <div style={{ position: "absolute", top: 1150, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 18 }}>
        <Pill delay={30} color="#0b1220" bg={C.teal}>🚚 FREESHIP</Pill>
        <Pill delay={42} color="#0b1220" bg="#fff">📖 Đọc thử miễn phí</Pill>
      </div>
    </>
  );
};

const S6: React.FC<{ f: number }> = ({ f }) => {
  const frame = useCurrentFrame();
  const scale = 1 + Math.sin(frame / 4) * 0.04;
  return (
    <>
      <Photo src="img/scene6.png" frames={f} />
      <Shade top={0.1} bottom={0.6} />
      <Headline top={980} size={92} color={C.teal}>
        Bấm link
        <br />
        giỏ hàng ngay!
      </Headline>
      <div style={{ position: "absolute", top: 1235, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${scale})` }}>
        <Pill delay={20} color="#0b1220" bg={C.accent}>🛒 Xem sách ở giỏ hàng 👇</Pill>
      </div>
    </>
  );
};

type Scene = { id: number; frames: number; voiceFrames: number; voice: string; line: string; V: React.FC<{ f: number }> };

const scenes: Scene[] = [
  { id: 1, frames: 126, voiceFrames: 120, voice: "vo/s1.mp3", line: "Học tiếng Anh năm năm, mà gặp người nước ngoài vẫn đơ?", V: S1 },
  { id: 2, frames: 120, voiceFrames: 115, voice: "vo/s2.mp3", line: "Đi làm cả ngày, đâu có thời gian học bài bản.", V: S2 },
  { id: 3, frames: 192, voiceFrames: 186, voice: "vo/s3.mp3", line: "Speaking Matrix: bắt đầu từ ba mươi giây, rồi tăng dần lên một phút, hai phút, ba phút.", V: S3 },
  { id: 4, frames: 162, voiceFrames: 157, voice: "vo/s4.mp3", line: "Học qua mẫu câu và câu chuyện ngắn, có file nghe, học mọi lúc mọi nơi.", V: S4 },
  { id: 5, frames: 201, voiceFrames: 195, voice: "vo/s5.mp3", line: "Combo bốn cuốn đang có ưu đãi, kèm freeship. Có cả bản đọc thử miễn phí.", V: S5 },
  { id: 6, frames: 99, voiceFrames: 98, voice: "vo/s6.mp3", line: "Bấm link ở giỏ hàng, xem ngay nhé!", V: S6 },
];

const Subtitle: React.FC<{ line: string; voiceFrames: number }> = ({ line, voiceFrames }) => {
  const frame = useCurrentFrame();
  const words = line.split(" ");
  const per = voiceFrames / words.length;
  const current = Math.min(words.length - 1, Math.floor(frame / per));
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 70,
        bottom: 300,
        textAlign: "center",
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 56,
        lineHeight: 1.3,
        background: "rgba(0,0,0,0.6)",
        borderRadius: 28,
        padding: "22px 30px",
      }}
    >
      {words.map((w, i) => (
        <span key={i} style={{ color: i === current ? C.accent : C.text }}>
          {w}{" "}
        </span>
      ))}
    </div>
  );
};

export const BookPromo: React.FC = () => {
  const frame = useCurrentFrame();
  let start = 0;
  const windows = scenes.map((s) => {
    const from = start;
    start += s.frames;
    return { from, to: from + s.voiceFrames + 4 };
  });
  start = 0;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Audio
        src={staticFile("bgm.mp3")}
        volume={(f) => {
          const talking = windows.some((w) => f >= w.from && f <= w.to);
          const base = talking ? 0.09 : 0.2;
          const fadeIn = interpolate(f, [0, 20], [0, 1], { extrapolateRight: "clamp" });
          const fadeOut = interpolate(f, [860, 900], [1, 0], { extrapolateLeft: "clamp" });
          return base * fadeIn * fadeOut;
        }}
      />
      {scenes.map((s) => {
        const from = start;
        start += s.frames;
        return (
          <Sequence key={s.id} from={from} durationInFrames={s.frames}>
            <SceneWrap frames={s.frames}>
              <s.V f={s.frames} />
              <Subtitle line={s.line} voiceFrames={s.voiceFrames} />
            </SceneWrap>
            <Audio src={staticFile(s.voice)} volume={1} />
          </Sequence>
        );
      })}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 12,
          width: `${(frame / 900) * 100}%`,
          background: C.accent,
        }}
      />
    </AbsoluteFill>
  );
};

const SceneWrap: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 6, frames - 4, frames], [0, 1, 1, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};
