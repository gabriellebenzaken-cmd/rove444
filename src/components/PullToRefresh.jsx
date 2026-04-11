import { useState, useRef, useEffect } from "react";
import { RefreshCw } from "lucide-react";

export default function PullToRefresh({ children, onRefresh }) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const scrollableRef = useRef(null);
  const PULL_THRESHOLD = 80;

  useEffect(() => {
    const el = scrollableRef.current;
    if (!el) return;

    const handleTouchStart = (e) => {
      if (el.scrollTop === 0) {
        touchStartY.current = e.touches[0].clientY;
        setPulling(true);
      }
    };

    const handleTouchMove = (e) => {
      if (!pulling) return;
      const pullDist = e.touches[0].clientY - touchStartY.current;
      if (pullDist > 0) {
        e.preventDefault();
        setPullDistance(Math.min(pullDist, PULL_THRESHOLD * 1.5));
      }
    };

    const handleTouchEnd = async () => {
      setPulling(false);
      if (pullDistance >= PULL_THRESHOLD) {
        setRefreshing(true);
        setPullDistance(0);
        try {
          await onRefresh();
        } catch (err) {
          console.error("[PullToRefresh] refresh failed:", err);
        }
        setRefreshing(false);
      } else {
        setPullDistance(0);
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pulling, pullDistance, onRefresh]);

  return (
    <div ref={scrollableRef} className="w-full h-full overflow-y-auto">
      {/* Pull-to-refresh indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all"
        style={{
          height: `${pullDistance}px`,
          opacity: Math.min(pullDistance / PULL_THRESHOLD, 1),
        }}
      >
        <RefreshCw
          className="h-5 w-5 text-primary"
          style={{
            transform: `rotate(${(pullDistance / PULL_THRESHOLD) * 180}deg)`,
            transition: refreshing ? "transform 0.6s linear infinite" : "none",
          }}
        />
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}