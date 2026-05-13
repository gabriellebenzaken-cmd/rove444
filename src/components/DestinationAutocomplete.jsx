import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { base44 } from "@/api/base44Client";
import { MapPin, Loader2, ArrowLeft, Search } from "lucide-react";

// ─── Local seed list ─────────────────────────────────────────────────────────
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
  return SEED_DESTINATIONS.filter((d) => d.toLowerCase().includes(q)).slice(0, 8);
}

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function isMobile() {
  // Use pointer: coarse as the primary signal (covers iOS PWA reliably)
  if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return true;
  return window.innerWidth < 768;
}

// ─── Full-screen mobile search sheet ────────────────────────────────────────
function MobileSearchSheet({ initialQuery, onSelect, onClose }) {
  const [query, setQuery] = useState(initialQuery || "");
  const [suggestions, setSuggestions] = useState(() => localMatch(initialQuery || ""));
  const [llmLoading, setLlmLoading] = useState(false);
  const inputRef = useRef(null);
  const llmAbort = useRef(null);
  const debouncedQuery = useDebounced(query, 400);

  // Auto-focus input when sheet opens
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // Instant local results on every keystroke
  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    setSuggestions(localMatch(query));
  }, [query]);

  // LLM enhancement after debounce
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return;
    if (llmAbort.current) llmAbort.current.cancelled = true;
    const handle = { cancelled: false };
    llmAbort.current = handle;
    setLlmLoading(true);

    base44.integrations.Core.InvokeLLM({
      prompt: `List 5 real travel destinations matching "${debouncedQuery}". For US cities include the state abbreviation (e.g. "Austin, TX, USA"). For all other cities use "City, Country". Return only the formatted destination strings, one per item.`,
      response_json_schema: {
        type: "object",
        properties: { suggestions: { type: "array", items: { type: "string" } } },
        required: ["suggestions"],
      },
    }).then((res) => {
      if (handle.cancelled) return;
      const list = Array.isArray(res?.suggestions) ? res.suggestions : [];
      if (list.length > 0) setSuggestions(list.slice(0, 8));
    }).catch(() => {
      // keep local results
    }).finally(() => {
      if (!handle.cancelled) setLlmLoading(false);
    });

    return () => { handle.cancelled = true; };
  }, [debouncedQuery]);

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "hsl(var(--background))",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 16px",
        paddingTop: "max(12px, env(safe-area-inset-top))",
        borderBottom: "1px solid rgba(200,162,124,0.15)",
        background: "hsl(var(--background))",
        flexShrink: 0,
      }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "none",
            background: "rgba(200,162,124,0.12)",
            color: "#C8A27C",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <ArrowLeft style={{ width: 18, height: 18 }} />
        </button>

        {/* Search input */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(255,255,255,0.85)",
          border: "1px solid rgba(200,162,124,0.25)",
          borderRadius: "12px",
          paddingLeft: "12px",
          paddingRight: "12px",
          height: "40px",
        }}>
          <Search style={{ width: 15, height: 15, color: "#C8A27C", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search destinations…"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: "16px",
              color: "hsl(var(--foreground))",
              fontFamily: "inherit",
            }}
          />
          {llmLoading && (
            <Loader2 style={{ width: 14, height: 14, color: "#C8A27C", opacity: 0.7, animation: "spin 1s linear infinite", flexShrink: 0 }} />
          )}
        </div>
      </div>

      {/* Results list */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        padding: "8px 16px",
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
      }}>
        {query.length < 2 && (
          <p style={{ textAlign: "center", color: "#B0A090", fontSize: "14px", marginTop: "40px" }}>
            Start typing to search destinations
          </p>
        )}
        {query.length >= 2 && suggestions.length === 0 && !llmLoading && (
          <p style={{ textAlign: "center", color: "#B0A090", fontSize: "14px", marginTop: "40px" }}>
            No results for "{query}"
          </p>
        )}
        {suggestions.map((s, i) => (
          <button
            key={s + i}
            type="button"
            onClick={() => onSelect(s)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              width: "100%",
              textAlign: "left",
              padding: "13px 14px",
              marginBottom: "4px",
              fontSize: "15px",
              color: "#2A2018",
              background: "rgba(255,255,255,0.75)",
              border: "1px solid rgba(200,162,124,0.12)",
              borderRadius: "12px",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "rgba(200,162,124,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <MapPin style={{ width: 15, height: 15, color: "#C8A27C" }} />
            </div>
            <span style={{ flex: 1, fontWeight: 450 }}>{s}</span>
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}

// ─── Inline desktop dropdown ─────────────────────────────────────────────────
function DesktopDropdown({ suggestions, llmLoading, onSelect, inputRef }) {
  const dropdownRef = useRef(null);
  const [style, setStyle] = useState({});

  useEffect(() => {
    function compute() {
      if (!inputRef.current) return;
      const rect = inputRef.current.getBoundingClientRect();
      setStyle({
        position: "fixed",
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(260, window.innerHeight - rect.bottom - 16),
        zIndex: 99999,
        overflowY: "auto",
      });
    }
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [inputRef]);

  return createPortal(
    <div
      ref={dropdownRef}
      style={{
        ...style,
        borderRadius: "14px",
        background: "rgba(252,248,244,0.99)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
        border: "1px solid rgba(200,162,124,0.25)",
      }}
    >
      {suggestions.map((s, i) => (
        <button
          key={s + i}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onSelect(s); }}
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
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function DestinationAutocomplete({ value, onChange, placeholder, inputStyle }) {
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [desktopSuggestions, setDesktopSuggestions] = useState([]);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [llmLoading, setLlmLoading] = useState(false);
  const inputRef = useRef(null);
  const llmAbort = useRef(null);
  // Tracks whether value just changed due to a selection (not user typing)
  const justSelected = useRef(false);
  const debouncedValue = useDebounced(value, 400);

  // Desktop: instant local results — skip if just selected
  useEffect(() => {
    if (mobileSheetOpen || justSelected.current) {
      justSelected.current = false;
      return;
    }
    if (!value || value.length < 2) { setDesktopSuggestions([]); setDesktopOpen(false); return; }
    const local = localMatch(value);
    if (local.length > 0) { setDesktopSuggestions(local); setDesktopOpen(true); }
  }, [value, mobileSheetOpen]);

  // Desktop: LLM enhancement — skip if on mobile
  useEffect(() => {
    if (mobileSheetOpen || isMobile()) return;
    if (!debouncedValue || debouncedValue.length < 2) return;
    if (llmAbort.current) llmAbort.current.cancelled = true;
    const handle = { cancelled: false };
    llmAbort.current = handle;
    setLlmLoading(true);

    base44.integrations.Core.InvokeLLM({
      prompt: `List 5 real travel destinations matching "${debouncedValue}". For US cities include the state abbreviation (e.g. "Austin, TX, USA"). For all other cities use "City, Country". Return only the formatted destination strings, one per item.`,
      response_json_schema: {
        type: "object",
        properties: { suggestions: { type: "array", items: { type: "string" } } },
        required: ["suggestions"],
      },
    }).then((res) => {
      if (handle.cancelled) return;
      const list = Array.isArray(res?.suggestions) ? res.suggestions : [];
      if (list.length > 0) { setDesktopSuggestions(list.slice(0, 5)); setDesktopOpen(true); }
    }).catch(() => {}).finally(() => {
      if (!handle.cancelled) setLlmLoading(false);
    });
    return () => { handle.cancelled = true; };
  }, [debouncedValue, mobileSheetOpen]);

  // Desktop: close on outside click
  useEffect(() => {
    if (!desktopOpen) return;
    function onOutside(e) {
      if (inputRef.current?.contains(e.target)) return;
      setDesktopOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [desktopOpen]);

  function handleSelect(s) {
    justSelected.current = true;
    onChange(s);
    setMobileSheetOpen(false);
    setDesktopOpen(false);
    setDesktopSuggestions([]);
  }

  function handleTrigger() {
    if (isMobile()) {
      setMobileSheetOpen(true);
      inputRef.current?.blur();
    }
  }

  return (
    <>
      {/* The visible trigger input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        readOnly={isMobile()}
        onChange={(e) => { if (!isMobile()) onChange(e.target.value); }}
        onFocus={handleTrigger}
        onClick={handleTrigger}
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
          fontSize: "16px",
          border: "1px solid rgba(200,162,124,0.2)",
          background: "rgba(255,255,255,0.8)",
          color: value ? "hsl(var(--foreground))" : "#A0907F",
          outline: "none",
          fontFamily: "inherit",
          cursor: "pointer",
          appearance: "none",
          WebkitAppearance: "none",
          ...inputStyle,
        }}
      />

      {/* Mobile: full-screen sheet */}
      {mobileSheetOpen && (
        <MobileSearchSheet
          initialQuery={value}
          onSelect={handleSelect}
          onClose={() => setMobileSheetOpen(false)}
        />
      )}

      {/* Desktop: inline dropdown — never shown on mobile */}
      {!isMobile() && !mobileSheetOpen && desktopOpen && desktopSuggestions.length > 0 && (
        <DesktopDropdown
          suggestions={desktopSuggestions}
          llmLoading={llmLoading}
          onSelect={handleSelect}
          inputRef={inputRef}
        />
      )}
    </>
  );
}