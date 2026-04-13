import { useEffect, useState } from "react";

function useDarkMode() {
  const [dark, setDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return dark;
}

// 4-point star SVG matching the logo
function Sparkle4({ size = 28, color = "#000", style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill={color}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M50 0 C50 0 53 38 50 50 C47 62 50 100 50 100 C50 100 47 62 50 50 C53 38 50 0 50 0Z" />
      <path d="M0 50 C0 50 38 47 50 50 C62 53 100 50 100 50 C100 50 62 47 50 50 C38 53 0 50 0 50Z" />
    </svg>
  );
}

// Tiny ambient background sparkle
function BgSparkle({ size, color, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill={color}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M50 0 C50 0 53 38 50 50 C47 62 50 100 50 100 C50 100 47 62 50 50 C53 38 50 0 50 0Z" />
      <path d="M0 50 C0 50 38 47 50 50 C62 53 100 50 100 50 C100 50 62 47 50 50 C38 53 0 50 0 50Z" />
    </svg>
  );
}

export default function RoveSplash({ onFinish, duration = 1300 }) {
  const dark = useDarkMode();

  useEffect(() => {
    const timer = setTimeout(() => onFinish?.(), duration);
    return () => clearTimeout(timer);
  }, [duration, onFinish]);

  const bg    = dark ? "#0d0d0d" : "#ffffff";
  const color = dark ? "#ffffff" : "#000000";
  const bgSparkleColor = dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400&display=swap');

        @keyframes splashFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes sparkleMain {
          0%,100% { opacity: 0.75; transform: scale(0.92) rotate(0deg); }
          50%      { opacity: 1;    transform: scale(1.1)  rotate(8deg);  }
        }
        @keyframes bgTwinkle1 {
          0%,100% { opacity: 0; }
          40%,60% { opacity: 1; }
        }
        @keyframes bgTwinkle2 {
          0%,100% { opacity: 0; }
          30%,70% { opacity: 1; }
        }
        @keyframes bgTwinkle3 {
          0%,100% { opacity: 0; }
          20%,80% { opacity: 1; }
        }
        .rove-splash-root {
          animation: splashFadeIn 350ms ease-out both;
        }
        .rove-sparkle-main {
          animation: sparkleMain 1.4s ease-in-out infinite;
          transform-origin: center;
        }
        .rove-bg-s1 {
          animation: bgTwinkle1 2.2s ease-in-out infinite;
          animation-delay: 0.3s;
        }
        .rove-bg-s2 {
          animation: bgTwinkle2 2.8s ease-in-out infinite;
          animation-delay: 0.8s;
        }
        .rove-bg-s3 {
          animation: bgTwinkle3 3.1s ease-in-out infinite;
          animation-delay: 0.1s;
        }
      `}</style>

      {/* Ambient background sparkles */}
      <div className="rove-bg-s1" style={{ position: "absolute", top: "22%", left: "18%", opacity: 0 }}>
        <BgSparkle size={10} color={bgSparkleColor} />
      </div>
      <div className="rove-bg-s2" style={{ position: "absolute", bottom: "28%", right: "20%", opacity: 0 }}>
        <BgSparkle size={7} color={bgSparkleColor} />
      </div>
      <div className="rove-bg-s3" style={{ position: "absolute", top: "35%", right: "25%", opacity: 0 }}>
        <BgSparkle size={9} color={bgSparkleColor} />
      </div>

      {/* Wordmark */}
      <div className="rove-splash-root" style={{ position: "relative", display: "inline-flex", alignItems: "flex-end" }}>
        <span style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 400,
          fontSize: 72,
          lineHeight: 1,
          letterSpacing: "-0.5px",
          color,
          userSelect: "none",
        }}>
          rove
        </span>

        {/* 4-point sparkle — upper right of wordmark */}
        <div
          className="rove-sparkle-main"
          style={{
            position: "absolute",
            top: -14,
            right: -28,
          }}
        >
          <Sparkle4 size={26} color={color} />
        </div>
      </div>
    </div>
  );
}