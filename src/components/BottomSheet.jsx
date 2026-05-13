import { useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";

const DISMISS_THRESHOLD = 80; // px dragged down to dismiss
const SNAP_BACK_DURATION = 280; // ms

export default function BottomSheet({ open, onClose, title, children }) {
  const sheetRef = useRef(null);
  const contentRef = useRef(null);
  const dragState = useRef(null); // tracks active drag
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [handleActive, setHandleActive] = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTranslateY(0); // reset position when reopened
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ── Drag logic ──────────────────────────────────────────────────────────────
  const onDragStart = useCallback((clientY) => {
    dragState.current = {
      startY: clientY,
      lastY: clientY,
      startTranslate: translateY,
    };
    setIsDragging(true);
    setHandleActive(true);
  }, [translateY]);

  const onDragMove = useCallback((clientY) => {
    if (!dragState.current) return;
    const delta = clientY - dragState.current.startY;
    // Allow dragging down freely; resist dragging up past origin
    const clamped = delta < 0 ? delta * 0.25 : delta;
    setTranslateY(dragState.current.startTranslate + clamped);
    dragState.current.lastY = clientY;
  }, []);

  const onDragEnd = useCallback(() => {
    if (!dragState.current) return;
    const delta = dragState.current.lastY - dragState.current.startY;
    dragState.current = null;
    setIsDragging(false);
    setHandleActive(false);

    if (delta > DISMISS_THRESHOLD) {
      // Animate out then close
      setTranslateY(window.innerHeight);
      setTimeout(() => {
        setTranslateY(0);
        onClose();
      }, SNAP_BACK_DURATION);
    } else {
      // Snap back to 0
      setTranslateY(0);
    }
  }, [onClose]);

  // ── Touch handlers (handle zone only) ──────────────────────────────────────
  const onTouchStart = useCallback((e) => {
    onDragStart(e.touches[0].clientY);
  }, [onDragStart]);

  const onTouchMove = useCallback((e) => {
    if (!dragState.current) return;
    e.preventDefault(); // prevent page scroll while dragging handle
    onDragMove(e.touches[0].clientY);
  }, [onDragMove]);

  const onTouchEnd = useCallback(() => {
    onDragEnd();
  }, [onDragEnd]);

  // ── Mouse handlers (desktop) ────────────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    onDragStart(e.clientY);

    function onMouseMove(ev) { onDragMove(ev.clientY); }
    function onMouseUp() {
      onDragEnd();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [onDragStart, onDragMove, onDragEnd]);

  if (!open) return null;

  const transition = isDragging ? "none" : `transform ${SNAP_BACK_DURATION}ms cubic-bezier(0.32, 0.72, 0, 1)`;

  return (
    <div className="fixed inset-0 z-[1100] flex flex-col justify-end">
      {/* Backdrop — fades slightly while dragging */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(2px)",
          opacity: Math.max(0, 1 - translateY / 300),
          transition: isDragging ? "none" : `opacity ${SNAP_BACK_DURATION}ms ease`,
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 430,
          margin: "0 auto",
          maxHeight: "85vh",
          borderRadius: "24px 24px 0 0",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "rgba(250,246,241,0.98)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
          transform: `translateY(${translateY}px)`,
          transition,
          willChange: "transform",
          touchAction: "none", // sheet itself won't scroll — content div handles it
        }}
      >
        {/* ── Drag Handle ── */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            paddingTop: 12,
            paddingBottom: 8,
            flexShrink: 0,
            cursor: isDragging ? "grabbing" : "grab",
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 999,
              background: handleActive ? "rgba(200,162,124,0.65)" : "rgba(200,162,124,0.3)",
              transform: handleActive ? "scaleX(1.15)" : "scaleX(1)",
              transition: "background 0.15s ease, transform 0.15s ease",
            }}
          />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 pb-3 shrink-0">
            <h3 className="text-[15px] font-semibold" style={{ color: "#1A1A1A", letterSpacing: "-0.015em" }}>{title}</h3>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "rgba(200,162,124,0.12)" }}
            >
              <X className="h-3.5 w-3.5" style={{ color: "#9A8A7A" }} />
            </button>
          </div>
        )}

        {/* Content — re-enable touch-action for normal scrolling inside */}
        <div
          ref={contentRef}
          className="overflow-y-auto flex-1 px-5"
          style={{ WebkitOverflowScrolling: "touch", paddingBottom: 100, touchAction: "pan-y" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}