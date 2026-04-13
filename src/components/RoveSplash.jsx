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

export default function RoveSplash({ onFinish, duration = 1300 }) {
  const dark = useDarkMode();
  useEffect(() => {
    const timer = setTimeout(() => onFinish?.(), duration);
    return () => clearTimeout(timer);
  }, [duration, onFinish]);

  const bg    = dark ? "#000" : "#fff";
  const color = dark ? "#fff" : "#000";

  return (
    <div style={{ ...styles.container, backgroundColor: bg }}>
      <style>{`
        @keyframes roveFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes roveTwinkle {
          0%, 100% { opacity: 0.82; transform: scale(1); }
          50%       { opacity: 1;    transform: scale(1.12); }
        }
        .rove-logo-wrap {
          animation: roveFadeIn 400ms ease-out forwards;
        }
        .rove-star {
          animation: roveTwinkle 1100ms ease-in-out infinite;
        }
      `}</style>
      <div className="rove-logo-wrap" style={styles.logoWrap}>
        <div style={styles.wordmarkRow}>
          <span style={{ ...styles.logo, color }}>rove</span>
          <span className="rove-star" style={{ ...styles.star, color }}>✦</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    backgroundColor: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  wordmarkRow: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    color: "#fff",
    fontSize: 56,
    lineHeight: "64px",
    letterSpacing: "-2px",
    fontWeight: 400,
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  star: {
    position: "absolute",
    top: -10,
    right: -16,
    color: "#fff",
    fontSize: 14,
    lineHeight: "14px",
    fontWeight: 600,
    display: "inline-block",
    transformOrigin: "center",
  },
};