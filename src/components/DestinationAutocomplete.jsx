import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { base44 } from "@/api/base44Client";
import { MapPin, Loader2 } from "lucide-react";

// ─── Local seed list for instant results ────────────────────────────────────
const SEED_DESTINATIONS = [
  "Amsterdam, Netherlands", "Athens, Greece", "Austin, TX, USA",
  "Bali, Indonesia", "Bangkok, Thailand", "Barcelona, Spain",
  "Berlin, Germany", "Bogotá, Colombia", "Boston, MA, USA",
  "Brussels, Belgium", "Buenos Aires, Argentina", "Cairo, Egypt",
  "Cancún, Mexico", "Cape Town, South Africa", "Chicago, IL, USA",
  "Copenhagen, Denmark", "Dallas, TX, USA", "Denver, CO, USA",
  "Dubai, UAE", "Dublin, Ireland", "Edinburgh, Scotland",
  "Florence, Italy", "Foxborough, MA, USA", "Frankfurt, Germany",
  "Geneva, Switzerland", "Havana, Cuba", "Helsinki, Finland",
  "Hong Kong", "Honolulu, HI, USA", "Istanbul, Turkey",
  "Jakarta, Indonesia", "Johannesburg, South Africa", "Kyoto, Japan",
  "Lagos, Nigeria", "Lisbon, Portugal", "London, England",
  "Los Angeles, CA, USA", "Madrid, Spain", "Manila, Philippines",
  "Marrakech, Morocco", "Melbourne, Australia", "Mexico City, Mexico",
  "Miami, FL, USA", "Milan, Italy", "Montreal, Canada",
  "Moscow, Russia", "Mumbai, India", "Munich, Germany",
  "Nairobi, Kenya", "Nashville, TN, USA", "New Orleans, LA, USA",
  "New York, NY, USA", "Nice, France", "Oslo, Norway",
  "Paris, France", "Prague, Czech Republic", "Reykjavik, Iceland",
  "Rio de Janeiro, Brazil", "Rome, Italy", "San Francisco, CA, USA",
  "Santiago, Chile", "São Paulo, Brazil", "Seattle, WA, USA",
  "Seoul, South Korea", "Shanghai, China", "Singapore",
  "Stockholm, Sweden", "Sydney, Australia", "Taipei, Taiwan",
  "Tel Aviv, Israel", "Tokyo, Japan", "Toronto, Canada",
  "Vancouver, Canada", "Venice, Italy", "Vienna, Austria",
  "Warsaw, Poland", "Washington DC, USA", "Zurich, Switzerland",
];

function localMatch(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return SEED_DESTINATIONS.filter((d) =>
    d.toLowerCase().includes(q)
  ).slice(0, 5);
}

// ─── Debounce hook ───────────────────────────────────────────────────────────
function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function DestinationAutocomplete({ value, onChange, placeholder, inputStyle }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [llmLoading, setLlmLoading] = useState(false);
  const [rect, setRect] = useState(null); // input bounding rect for portal positioning
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const llmAbort = useRef(null);
  const debouncedValue = useDebounced(value, 400);

  // ── Update input rect whenever open changes or window resizes ──
  const updateRect = useCallback(() => {
    if (inputRef.current) {
      setRect(inputRef.current.getBoundingClientRect());
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", updateRect);
      vv.addEventListener("scroll", updateRect);
    }
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
      if (vv) {
        vv.removeEventListener("resize", updateRect);
        vv.removeEventListener("scroll", updateRect);
      }
    };
  }, [open, updateRect]);

  // ── Step 1: instant local results ──
  useEffect(() => {
    console.log("[Autocomplete] value changed:", value);
    if (!value || value.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const local = localMatch(value);
    console.log("[Autocomplete] local matches:", local);
    if (local.length > 0) {
      setSuggestions(local);
      updateRect();
      setOpen(true);
    }
  }, [value, updateRect]);

  // ── Step 2: LLM enhancement after debounce ──
  useEffect(() => {
    if (!debouncedValue || debouncedValue.length < 2) return;

    // Cancel any in-flight LLM request
    if (llmAbort.current) llmAbort.current.cancelled = true;
    const handle = { cancelled: false };
    llmAbort.current = handle;

    setLlmLoading(true);
    console.log("[Autocomplete] firing LLM for:", debouncedValue);

    base44.integrations.Core.InvokeLLM({
      prompt: `List 5 real travel destinations matching "${debouncedValue}". Return only city and country names, one per item, no extra text.`,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: { type: "array", items: { type: "string" } },
        },
        required: ["suggestions"],
      },
    }).then((res) => {
      if (handle.cancelled) return;
      console.log("[Autocomplete] LLM result:", res);
      // InvokeLLM returns the parsed object directly
      const list = Array.isArray(res?.suggestions) ? res.suggestions : [];
      if (list.length > 0) {
        setSuggestions(list.slice(0, 5));
        updateRect();
        setOpen(true);
      }
    }).catch((err) => {
      console.warn("[Autocomplete] LLM error:", err);
      // keep local results showing — don't clear
    }).finally(() => {
      if (!handle.cancelled) setLlmLoading(false);
    });

    return () => { handle.cancelled = true; };
  }, [debouncedValue, updateRect]);

  // ── Close on outside interaction ──
  useEffect(() => {
    function onOutside(e) {
      if (
        dropdownRef.current?.contains(e.target) ||
        inputRef.current?.contains(e.target)
      ) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, []);

  function selectSuggestion(s) {
    console.log("[Autocomplete] selected:", s);
    onChange(s);
    setOpen(false);
    setSuggestions([]);
    inputRef.current?.blur();
  }

  // ── Compute portal dropdown position ──
  function getPortalStyle() {
    if (!rect) return { display: "none" };

    const vv = window.visualViewport;
    // The bottom of the visible viewport (shrinks when keyboard is up on iOS)
    const visibleBottom = (vv && vv.height > 100) ? (vv.offsetTop + vv.height) : window.innerHeight;

    const DROPDOWN_MAX_H = 220;
    const GAP = 4;
    const spaceBelow = visibleBottom - rect.bottom - GAP;
    const spaceAbove = rect.top - GAP;

    console.log("[Autocomplete] rect:", rect, "visibleBottom:", visibleBottom, "spaceBelow:", spaceBelow, "spaceAbove:", spaceAbove);

    if (spaceBelow >= 80 || spaceBelow >= spaceAbove) {
      // Prefer below input
      return {
        position: "fixed",
        top: rect.bottom + GAP,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(80, Math.min(DROPDOWN_MAX_H, spaceBelow)),
        zIndex: 99999,
        overflowY: "auto",
      };
    } else {
      // Above input (keyboard is covering below area)
      return {
        position: "fixed",
        top: Math.max(8, rect.top - Math.min(DROPDOWN_MAX_H, spaceAbove) - GAP),
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(80, Math.min(DROPDOWN_MAX_H, spaceAbove)),
        zIndex: 99999,
        overflowY: "auto",
      };
    }
  }

  const showDropdown = open && suggestions.length > 0;

  const portal = showDropdown ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        ...getPortalStyle(),
        borderRadius: "14px",
        background: "rgba(252,248,244,0.99)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid rgba(200,162,124,0.3)",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {suggestions.map((s, i) => (
        <button
          key={s + i}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); selectSuggestion(s); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
            textAlign: "left",
            padding: "11px 14px",
            fontSize: "14px",
            color: "#2A2018",
            background: "transparent",
            border: "none",
            borderBottom: i < suggestions.length - 1 ? "1px solid rgba(200,162,124,0.12)" : "none",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <MapPin style={{ width: 13, height: 13, color: "#C8A27C", flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{s}</span>
          {llmLoading && i === suggestions.length - 1 && (
            <Loader2 style={{ width: 11, height: 11, color: "#C8A27C", opacity: 0.6, animation: "spin 1s linear infinite" }} />
          )}
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
        onChange={(e) => {
          console.log("[Autocomplete] onChange:", e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => {
          updateRect();
          if (suggestions.length > 0) setOpen(true);
        }}
        placeholder={placeholder || "City, country"}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        style={{
          width: "100%",
          minWidth: 0,
          boxSizing: "border-box",
          height: "36px",
          borderRadius: "0.375rem",
          paddingLeft: "12px",
          paddingRight: "12px",
          fontSize: "16px", // 16px prevents iOS zoom
          border: "1px solid rgba(200,162,124,0.2)",
          background: "rgba(255,255,255,0.8)",
          color: "hsl(var(--foreground))",
          outline: "none",
          fontFamily: "inherit",
          appearance: "none",
          WebkitAppearance: "none",
          ...inputStyle,
        }}
      />
      {portal}
    </>
  );
}