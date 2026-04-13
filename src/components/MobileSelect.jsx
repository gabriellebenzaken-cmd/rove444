import { useState, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
      >
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <BottomSheet open={open} onClose={() => setOpen(false)}>
          <div className="p-4 pb-6">
            {label && <h3 className="text-sm font-semibold mb-3">{label}</h3>}
            <div className="space-y-2">
              {options.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl text-left font-medium transition-all flex items-center justify-between ${
                    selected?.value === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  <span>{opt.label}</span>
                  {selected?.value === opt.value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>
        </BottomSheet>
      )}
    </>
  );
}