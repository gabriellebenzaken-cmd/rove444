import { useEffect } from "react";

export default function RoveSplash({ onFinish, duration = 1800 }) {
  useEffect(() => {
    const timer = setTimeout(() => onFinish?.(), duration);
    return () => clearTimeout(timer);
  }, [duration, onFinish]);

  return (
    <div style={styles.container}>
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
          animation: roveFadeIn 450ms ease-out forwards;
        }
        .rove-star {
          animation: roveTwinkle 1100ms ease-in-out infinite;
        }
      `}</style>
      <div className="rove-logo-wrap" style={styles.logoWrap}>
        <div style={styles.wordmarkRow}>
          <span style={styles.logo}>rove</span>
          <span className="rove-star" style={styles.star}>✦</span>
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