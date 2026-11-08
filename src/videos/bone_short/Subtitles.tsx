import React from "react";
import subtitlesData from "../../../public/subtitles.json";

interface Phrase {
  id: number;
  scene: number;
  text: string;
  start_frame: number;
  end_frame: number;
}

export const Subtitles: React.FC<{ frame: number }> = ({ frame }) => {
  const phrases = (subtitlesData as { phrases: Phrase[] }).phrases;
  const active = phrases.find(
    (p) => frame >= p.start_frame && frame <= p.end_frame + 6
  );

  if (!active) return null;

  // Emphasize key terms with golden/cyan highlight
  const formatText = (text: string) => {
    const keywords = ["chín tấn", "hai con voi", "tổ ong", "cứng như đá", "thép", "tự lành", "siêu phẩm", "bao diêm"];
    let styled = text;
    return (
      <span>
        {text}
      </span>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 160,
        left: "50%",
        transform: "translateX(-50%)",
        width: "88%",
        maxWidth: 960,
        textAlign: "center",
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "inline-block",
          background: "linear-gradient(180deg, rgba(20, 16, 32, 0.88) 0%, rgba(10, 8, 18, 0.94) 100%)",
          backdropFilter: "blur(12px)",
          border: "2.5px solid #ffcc33",
          boxShadow: "0 10px 30px rgba(0,0,0,0.7), 0 0 25px rgba(255, 204, 51, 0.35)",
          borderRadius: 28,
          padding: "16px 36px",
          color: "#ffffff",
          fontSize: 48,
          fontWeight: 800,
          lineHeight: 1.35,
          letterSpacing: "0.5px",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          textShadow: "0 3px 10px rgba(0,0,0,0.9), 0 0 15px rgba(0,0,0,0.8)",
          transform: `scale(${Math.min(1.03, 0.96 + Math.sin(Math.min(Math.PI, (frame - active.start_frame) * 0.2)) * 0.07)})`,
          transition: "transform 0.1s ease-out",
        }}
      >
        {formatText(active.text)}
      </div>
    </div>
  );
};
