import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { base44 } from "@/api/base44Client";
import { MapPin } from "lucide-react";

// Debounce helper
function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function DestinationAutocomplete({ value, onChange, placeholder, inputStyle }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const abortRef = useRef(null);
  const debouncedValue = useDebouncedValue(value, 320);

  // Compute dropdown position anchored above the keyboard using visualViewport
  const computePosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const vv = window.visualViewport;
    // Bottom of visible area (above keyboard on iOS)
    const visibleBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
    // Place dropdown above visible bottom, or just below input if space allows
    const spaceBelow = visibleBottom - rect.bottom;
    const spaceAbove = rect.top;
    const maxH = 200;

    if (spaceBelow >= 120 || spaceBelow >= spaceAbove) {
      // Render below input
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(maxH, spaceBelow - 8),
        zIndex: 9999,
      });
    } else {
      // Render above input
      setDropdownStyle({
        position: "fixed",
        bottom: visibleBottom - rect.top + 4,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(maxH, spaceAbove - 8),
        zIndex: 9999,
      });
    }
  }, []);

  // Recompute on visualViewport resize (keyboard open/close)
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    vv.addEventListener("resize", computePosition);
    vv.addEventListener("scroll", computePosition);
    return () => {
      vv.removeEventListener("resize", computePosition);
      vv.removeEventListener("scroll", computePosition);
    };
  }, [computePosition]);

  // Fetch suggestions when debounced value changes
  useEffect(() => {
    if (!debouncedValue || debouncedValue.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (abortRef.current) abortRef.current = false;
    const active = { alive: true };
    abortRef.current = active;

    setLoading(true);
    base44.integrations.Core.InvokeLLM({
      prompt: `Give me 5 travel destination suggestions matching "${debouncedValue}". Return only city/country names, short and clear. JSON array of strings.`,
      response_json_schema: {
        type: "object",
        properties: { suggestions: { type: "array", items: { type: "string" } } },
      },
    }).then((res) => {
      if (!active.alive) return;
      const list = res?.suggestions || [];
      setSuggestions(list.slice(0, 5));
      if (list.length > 0) {
        computePosition();
        setOpen(true);
      }
    }).catch(() => {
      // silently ignore
    }).finally(() => {
      if (active.alive) setLoading(false);
    });

    return () => { active.alive = false; };
  }, [debouncedValue, computePosition]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, []);

  function selectSuggestion(s) {
    onChange(s);
    setOpen(false);
    setSuggestions([]);
    inputRef.current?.blur();
  }

  const dropdown = open && suggestions.length > 0 ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        ...dropdownStyle,
        overflowY: "auto",
        borderRadius: "14px",
        background: "rgba(252,248,244,0.98)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)",
        border: "1px solid rgba(200,162,124,0.22)",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {suggestions.map((s, i) => (
        <button
          key={i}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
          onTouchEnd={(e) => { e.preventDefault(); selectSuggestion(s); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
            textAlign: "left",
            padding: "10px 14px",
            fontSize: "14px",
            color: "#2A2018",
            background: "transparent",
            border: "none",
            borderBottom: i < suggestions.length - 1 ? "1px solid rgba(200,162,124,0.1)" : "none",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <MapPin style={{ width: 13, height: 13, color: "#C8A27C", flexShrink: 0 }} />
          {s}
        </button>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); }}
        onFocus={() => { if (suggestions.length > 0) { computePosition(); setOpen(true); } }}
        placeholder={placeholder || "City, country"}
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        style={{
          width: "100%",
          minWidth: 0,
          boxSizing: "border-box",
          height: "36px",
          borderRadius: "0.375rem",
          paddingLeft: "12px",
          paddingRight: "12px",
          fontSize: "14px",
          border: "1px solid rgba(200,162,124,0.2)",
          background: "rgba(255,255,255,0.8)",
          color: "hsl(var(--foreground))",
          outline: "none",
          fontFamily: "inherit",
          ...inputStyle,
        }}
      />
      {dropdown}
    </>
  );
}