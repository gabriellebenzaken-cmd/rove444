import { useState, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import BottomSheet from "./BottomSheet";

export default function MobileSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  label,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const selected = options.find((opt) => opt.value === value);

  if (!isMobile) {
    // Fallback to web-style select on desktop
    return (
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
      >
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Bottom sheet menu */}
      {open && (
        <BottomSheet isOpen={open} onClose={() => setOpen(false)}>
          <div className="p-4 pb-6">
            {label && <h3 className="text-sm font-semibold mb-3">{label}</h3>}
            <div className="space-y-2">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-all ${
                    selected?.value === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </BottomSheet>
      )}
    </>
  );
}