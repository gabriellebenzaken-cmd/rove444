import { useEffect } from "react";
import { X } from "lucide-react";

export default function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="relative w-full max-w-lg mx-auto rounded-t-[28px] overflow-hidden flex flex-col"
        style={{
          background: "rgba(250,246,241,0.98)",
          backdropFilter: "blur(20px)",
          maxHeight: "85vh",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full" style={{ background: "rgba(200,162,124,0.3)" }} />
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

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}