import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { base44 } from "@/api/base44Client";
import { MapPin, Loader2, ArrowLeft, Search, PlaneTakeoff } from "lucide-react";

// ─── Local airport seed ───────────────────────────────────────────────────────
const AIRPORTS = [
  { code: "ATL", name: "Hartsfield–Jackson Atlanta International Airport", city: "Atlanta, GA, USA" },
  { code: "LAX", name: "Los Angeles International Airport", city: "Los Angeles, CA, USA" },
  { code: "ORD", name: "O'Hare International Airport", city: "Chicago, IL, USA" },
  { code: "MDW", name: "Chicago Midway International Airport", city: "Chicago, IL, USA" },
  { code: "DFW", name: "Dallas/Fort Worth International Airport", city: "Dallas, TX, USA" },
  { code: "DAL", name: "Dallas Love Field", city: "Dallas, TX, USA" },
  { code: "DEN", name: "Denver International Airport", city: "Denver, CO, USA" },
  { code: "JFK", name: "John F. Kennedy International Airport", city: "New York, NY, USA" },
  { code: "LGA", name: "LaGuardia Airport", city: "New York, NY, USA" },
  { code: "EWR", name: "Newark Liberty International Airport", city: "Newark, NJ, USA" },
  { code: "SFO", name: "San Francisco International Airport", city: "San Francisco, CA, USA" },
  { code: "OAK", name: "Oakland International Airport", city: "Oakland, CA, USA" },
  { code: "SJC", name: "San Jose International Airport", city: "San Jose, CA, USA" },
  { code: "SEA", name: "Seattle-Tacoma International Airport", city: "Seattle, WA, USA" },
  { code: "LAS", name: "Harry Reid International Airport", city: "Las Vegas, NV, USA" },
  { code: "MCO", name: "Orlando International Airport", city: "Orlando, FL, USA" },
  { code: "MIA", name: "Miami International Airport", city: "Miami, FL, USA" },
  { code: "FLL", name: "Fort Lauderdale-Hollywood International Airport", city: "Fort Lauderdale, FL, USA" },
  { code: "TPA", name: "Tampa International Airport", city: "Tampa, FL, USA" },
  { code: "PBI", name: "Palm Beach International Airport", city: "West Palm Beach, FL, USA" },
  { code: "BOS", name: "Boston Logan International Airport", city: "Boston, MA, USA" },
  { code: "PHL", name: "Philadelphia International Airport", city: "Philadelphia, PA, USA" },
  { code: "IAD", name: "Washington Dulles International Airport", city: "Washington DC, USA" },
  { code: "DCA", name: "Ronald Reagan Washington National Airport", city: "Washington DC, USA" },
  { code: "BWI", name: "Baltimore/Washington International Airport", city: "Baltimore, MD, USA" },
  { code: "CLT", name: "Charlotte Douglas International Airport", city: "Charlotte, NC, USA" },
  { code: "MSP", name: "Minneapolis–Saint Paul International Airport", city: "Minneapolis, MN, USA" },
  { code: "DTW", name: "Detroit Metropolitan Airport", city: "Detroit, MI, USA" },
  { code: "PHX", name: "Phoenix Sky Harbor International Airport", city: "Phoenix, AZ, USA" },
  { code: "SLC", name: "Salt Lake City International Airport", city: "Salt Lake City, UT, USA" },
  { code: "HOU", name: "William P. Hobby Airport", city: "Houston, TX, USA" },
  { code: "IAH", name: "George Bush Intercontinental Airport", city: "Houston, TX, USA" },
  { code: "MSY", name: "Louis Armstrong New Orleans International Airport", city: "New Orleans, LA, USA" },
  { code: "BNA", name: "Nashville International Airport", city: "Nashville, TN, USA" },
  { code: "AUS", name: "Austin-Bergstrom International Airport", city: "Austin, TX, USA" },
  { code: "PDX", name: "Portland International Airport", city: "Portland, OR, USA" },
  { code: "SAN", name: "San Diego International Airport", city: "San Diego, CA, USA" },
  { code: "HNL", name: "Daniel K. Inouye International Airport", city: "Honolulu, HI, USA" },
  { code: "ANC", name: "Ted Stevens Anchorage International Airport", city: "Anchorage, AK, USA" },
  { code: "LHR", name: "London Heathrow Airport", city: "London, England" },
  { code: "LGW", name: "London Gatwick Airport", city: "London, England" },
  { code: "CDG", name: "Charles de Gaulle Airport", city: "Paris, France" },
  { code: "ORY", name: "Paris Orly Airport", city: "Paris, France" },
  { code: "AMS", name: "Amsterdam Schiphol Airport", city: "Amsterdam, Netherlands" },
  { code: "FRA", name: "Frankfurt Airport", city: "Frankfurt, Germany" },
  { code: "MUC", name: "Munich Airport", city: "Munich, Germany" },
  { code: "MAD", name: "Adolfo Suárez Madrid–Barajas Airport", city: "Madrid, Spain" },
  { code: "BCN", name: "Josep Tarradellas Barcelona–El Prat Airport", city: "Barcelona, Spain" },
  { code: "FCO", name: "Leonardo da Vinci International Airport", city: "Rome, Italy" },
  { code: "MXP", name: "Milan Malpensa Airport", city: "Milan, Italy" },
  { code: "ZRH", name: "Zurich Airport", city: "Zurich, Switzerland" },
  { code: "GVA", name: "Geneva Airport", city: "Geneva, Switzerland" },
  { code: "VIE", name: "Vienna International Airport", city: "Vienna, Austria" },
  { code: "CPH", name: "Copenhagen Airport", city: "Copenhagen, Denmark" },
  { code: "ARN", name: "Stockholm Arlanda Airport", city: "Stockholm, Sweden" },
  { code: "OSL", name: "Oslo Gardermoen Airport", city: "Oslo, Norway" },
  { code: "HEL", name: "Helsinki-Vantaa Airport", city: "Helsinki, Finland" },
  { code: "DUB", name: "Dublin Airport", city: "Dublin, Ireland" },
  { code: "ATH", name: "Athens International Airport", city: "Athens, Greece" },
  { code: "IST", name: "Istanbul Airport", city: "Istanbul, Turkey" },
  { code: "DXB", name: "Dubai International Airport", city: "Dubai, UAE" },
  { code: "AUH", name: "Abu Dhabi International Airport", city: "Abu Dhabi, UAE" },
  { code: "DOH", name: "Hamad International Airport", city: "Doha, Qatar" },
  { code: "NRT", name: "Tokyo Narita International Airport", city: "Tokyo, Japan" },
  { code: "HND", name: "Tokyo Haneda Airport", city: "Tokyo, Japan" },
  { code: "KIX", name: "Kansai International Airport", city: "Osaka, Japan" },
  { code: "ICN", name: "Incheon International Airport", city: "Seoul, South Korea" },
  { code: "PEK", name: "Beijing Capital International Airport", city: "Beijing, China" },
  { code: "PVG", name: "Shanghai Pudong International Airport", city: "Shanghai, China" },
  { code: "HKG", name: "Hong Kong International Airport", city: "Hong Kong" },
  { code: "SIN", name: "Singapore Changi Airport", city: "Singapore" },
  { code: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok, Thailand" },
  { code: "KUL", name: "Kuala Lumpur International Airport", city: "Kuala Lumpur, Malaysia" },
  { code: "SYD", name: "Sydney Kingsford Smith Airport", city: "Sydney, Australia" },
  { code: "MEL", name: "Melbourne Airport", city: "Melbourne, Australia" },
  { code: "YYZ", name: "Toronto Pearson International Airport", city: "Toronto, Canada" },
  { code: "YVR", name: "Vancouver International Airport", city: "Vancouver, Canada" },
  { code: "YUL", name: "Montreal-Trudeau International Airport", city: "Montreal, Canada" },
  { code: "GRU", name: "São Paulo/Guarulhos International Airport", city: "São Paulo, Brazil" },
  { code: "EZE", name: "Ministro Pistarini International Airport", city: "Buenos Aires, Argentina" },
  { code: "BOG", name: "El Dorado International Airport", city: "Bogotá, Colombia" },
  { code: "MEX", name: "Mexico City International Airport", city: "Mexico City, Mexico" },
  { code: "CUN", name: "Cancún International Airport", city: "Cancún, Mexico" },
  { code: "JNB", name: "O.R. Tambo International Airport", city: "Johannesburg, South Africa" },
  { code: "NBO", name: "Jomo Kenyatta International Airport", city: "Nairobi, Kenya" },
  { code: "CAI", name: "Cairo International Airport", city: "Cairo, Egypt" },
  { code: "CMN", name: "Mohammed V International Airport", city: "Casablanca, Morocco" },
  { code: "TLV", name: "Ben Gurion International Airport", city: "Tel Aviv, Israel" },
  { code: "BOM", name: "Chhatrapati Shivaji Maharaj International Airport", city: "Mumbai, India" },
  { code: "DEL", name: "Indira Gandhi International Airport", city: "New Delhi, India" },
  { code: "KEF", name: "Keflavík International Airport", city: "Reykjavik, Iceland" },
  { code: "REK", name: "Reykjavik Airport", city: "Reykjavik, Iceland" },
  { code: "HAV", name: "José Martí International Airport", city: "Havana, Cuba" },
];

// ─── Local city seed ─────────────────────────────────────────────────────────
const SEED_DESTINATIONS = [
  "Amsterdam, Netherlands", "Athens, Greece", "Austin, TX, USA",
  "Bali, Indonesia", "Bangkok, Thailand", "Barcelona, Spain",
  "Berlin, Germany", "Bogotá, Colombia", "Boston, MA, USA",
  "Brussels, Belgium", "Buenos Aires, Argentina", "Cairo, Egypt",
  "Cancún, Mexico", "Cape Town, South Africa", "Chicago, IL, USA",
  "Copenhagen, Denmark", "Dallas, TX, USA", "Denver, CO, USA",
  "Dubai, UAE", "Dublin, Ireland", "Edinburgh, Scotland",
  "Florence, Italy", "Frankfurt, Germany", "Geneva, Switzerland",
  "Havana, Cuba", "Helsinki, Finland", "Hong Kong",
  "Honolulu, HI, USA", "Istanbul, Turkey", "Jakarta, Indonesia",
  "Johannesburg, South Africa", "Kyoto, Japan", "Lagos, Nigeria",
  "Lisbon, Portugal", "London, England", "Los Angeles, CA, USA",
  "Madrid, Spain", "Manila, Philippines", "Marrakech, Morocco",
  "Melbourne, Australia", "Mexico City, Mexico", "Miami, FL, USA",
  "Milan, Italy", "Montreal, Canada", "Moscow, Russia",
  "Mumbai, India", "Munich, Germany", "Nairobi, Kenya",
  "Nashville, TN, USA", "New Orleans, LA, USA", "New York, NY, USA",
  "Nice, France", "Oslo, Norway", "Paris, France",
  "Prague, Czech Republic", "Reykjavik, Iceland", "Rio de Janeiro, Brazil",
  "Rome, Italy", "San Francisco, CA, USA", "Santiago, Chile",
  "São Paulo, Brazil", "Seattle, WA, USA", "Seoul, South Korea",
  "Shanghai, China", "Singapore", "Stockholm, Sweden",
  "Sydney, Australia", "Taipei, Taiwan", "Tel Aviv, Israel",
  "Tokyo, Japan", "Toronto, Canada", "Vancouver, Canada",
  "Venice, Italy", "Vienna, Austria", "Warsaw, Poland",
  "Washington DC, USA", "Zurich, Switzerland",
];

// ─── Result type helpers ─────────────────────────────────────────────────────
// Each suggestion is { type: "airport"|"city", label: string, sub?: string }

function matchAirports(query) {
  const q = query.trim().toUpperCase();
  const ql = query.trim().toLowerCase();
  if (!q) return [];
  // Exact code match first, then name/city match
  const exact = AIRPORTS.filter(a => a.code === q);
  const fuzzy = AIRPORTS.filter(a =>
    a.code !== q &&
    (a.name.toLowerCase().includes(ql) || a.city.toLowerCase().includes(ql) || a.code.includes(q))
  );
  return [...exact, ...fuzzy].slice(0, 4).map(a => ({
    type: "airport",
    label: `${a.name} (${a.code})`,
    sub: a.city,
  }));
}

function matchCities(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return SEED_DESTINATIONS
    .filter(d => d.toLowerCase().includes(q))
    .slice(0, 4)
    .map(d => ({ type: "city", label: d }));
}

function localMatch(query) {
  const airports = matchAirports(query);
  const cities = matchCities(query);
  // Merge: airports first, then cities, dedup labels
  const seen = new Set();
  return [...airports, ...cities].filter(r => {
    if (seen.has(r.label)) return false;
    seen.add(r.label);
    return true;
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function isMobile() {
  if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return true;
  return window.innerWidth < 768;
}

// ─── Result row ──────────────────────────────────────────────────────────────
function ResultRow({ result, onClick, onMouseDown, style = {} }) {
  const isAirport = result.type === "airport";
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={onMouseDown}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        background: "transparent",
        border: "none",
        ...style,
      }}
    >
      <div style={{
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        background: isAirport ? "rgba(200,162,124,0.18)" : "rgba(200,162,124,0.10)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        {isAirport
          ? <PlaneTakeoff style={{ width: 14, height: 14, color: "#C8A27C" }} />
          : <MapPin style={{ width: 14, height: 14, color: "#C8A27C" }} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "14px", fontWeight: 500, color: "hsl(var(--foreground))", lineHeight: 1.3 }}>
          {result.label}
        </div>
        {result.sub && (
          <div style={{ fontSize: "11px", color: "#B0A090", marginTop: "1px" }}>{result.sub}</div>
        )}
      </div>
    </button>
  );
}

// ─── LLM prompt ──────────────────────────────────────────────────────────────
const LLM_PROMPT = (query) =>
  `The user is searching for a travel destination or airport with query: "${query}".
Return up to 6 results. Prioritize airports if the query looks like an IATA code (3 uppercase letters) or airport name.
Each result must have: type ("airport" or "city"), label (full airport name with IATA code in parens for airports, e.g. "Fort Lauderdale-Hollywood International Airport (FLL)"; or "City, Country" for cities), and optionally sub (city/country context for airports).`;

const LLM_SCHEMA = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string" },
          label: { type: "string" },
          sub: { type: "string" },
        },
        required: ["type", "label"],
      },
    },
  },
  required: ["results"],
};

// ─── Mobile full-screen sheet ────────────────────────────────────────────────
function MobileSearchSheet({ initialQuery, onSelect, onClose }) {
  const [query, setQuery] = useState(initialQuery || "");
  const [suggestions, setSuggestions] = useState(() => localMatch(initialQuery || ""));
  const [llmLoading, setLlmLoading] = useState(false);
  const inputRef = useRef(null);
  const llmAbort = useRef(null);
  const debouncedQuery = useDebounced(query, 400);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) { setSuggestions([]); return; }
    setSuggestions(localMatch(query));
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return;
    if (llmAbort.current) llmAbort.current.cancelled = true;
    const handle = { cancelled: false };
    llmAbort.current = handle;
    setLlmLoading(true);

    base44.integrations.Core.InvokeLLM({
      prompt: LLM_PROMPT(debouncedQuery),
      response_json_schema: LLM_SCHEMA,
    }).then((res) => {
      if (handle.cancelled) return;
      const list = Array.isArray(res?.results) ? res.results : [];
      if (list.length > 0) setSuggestions(list.slice(0, 8));
    }).catch(() => {}).finally(() => {
      if (!handle.cancelled) setLlmLoading(false);
    });

    return () => { handle.cancelled = true; };
  }, [debouncedQuery]);

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 999999, background: "hsl(var(--background))", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "12px 16px", paddingTop: "max(12px, env(safe-area-inset-top))",
        borderBottom: "1px solid rgba(200,162,124,0.15)",
        background: "hsl(var(--background))", flexShrink: 0,
      }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "36px", height: "36px", borderRadius: "50%",
            border: "none", background: "rgba(200,162,124,0.12)",
            color: "#C8A27C", cursor: "pointer", flexShrink: 0,
          }}
        >
          <ArrowLeft style={{ width: 18, height: 18 }} />
        </button>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: "8px",
          background: "rgba(255,255,255,0.85)", border: "1px solid rgba(200,162,124,0.25)",
          borderRadius: "12px", paddingLeft: "12px", paddingRight: "12px", height: "40px",
        }}>
          <Search style={{ width: 15, height: 15, color: "#C8A27C", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search airports or cities…"
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
            style={{
              flex: 1, border: "none", background: "transparent", outline: "none",
              fontSize: "16px", color: "hsl(var(--foreground))", fontFamily: "inherit",
            }}
          />
          {llmLoading && <Loader2 style={{ width: 14, height: 14, color: "#C8A27C", opacity: 0.7, animation: "spin 1s linear infinite", flexShrink: 0 }} />}
        </div>
      </div>

      {/* Results */}
      <div style={{
        flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch",
        padding: "8px 16px", paddingBottom: "max(16px, env(safe-area-inset-bottom))",
      }}>
        {query.length < 2 && (
          <p style={{ textAlign: "center", color: "#B0A090", fontSize: "14px", marginTop: "40px" }}>
            Search airports or cities
          </p>
        )}
        {query.length >= 2 && suggestions.length === 0 && !llmLoading && (
          <p style={{ textAlign: "center", color: "#B0A090", fontSize: "14px", marginTop: "40px" }}>
            No results for "{query}"
          </p>
        )}
        {suggestions.map((s, i) => (
          <ResultRow
            key={s.label + i}
            result={s}
            onClick={() => onSelect(s.label)}
            style={{
              padding: "13px 14px", marginBottom: "4px",
              background: "rgba(255,255,255,0.75)",
              border: "1px solid rgba(200,162,124,0.12)",
              borderRadius: "12px",
            }}
          />
        ))}
      </div>
    </div>,
    document.body
  );
}

// ─── Desktop dropdown ─────────────────────────────────────────────────────────
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
        width: Math.max(rect.width, 320),
        maxHeight: Math.min(320, window.innerHeight - rect.bottom - 16),
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
        padding: "4px 0",
      }}
    >
      {suggestions.map((s, i) => (
        <ResultRow
          key={s.label + i}
          result={s}
          onMouseDown={(e) => { e.preventDefault(); onSelect(s.label); }}
          style={{
            padding: "9px 14px",
            borderBottom: i < suggestions.length - 1 ? "1px solid rgba(200,162,124,0.08)" : "none",
          }}
        />
      ))}
      {llmLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "8px" }}>
          <Loader2 style={{ width: 14, height: 14, color: "#C8A27C", opacity: 0.6, animation: "spin 1s linear infinite" }} />
        </div>
      )}
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
  const justSelected = useRef(false);
  const debouncedValue = useDebounced(value, 400);

  useEffect(() => {
    if (mobileSheetOpen || justSelected.current) { justSelected.current = false; return; }
    if (!value || value.length < 2) { setDesktopSuggestions([]); setDesktopOpen(false); return; }
    const local = localMatch(value);
    if (local.length > 0) { setDesktopSuggestions(local); setDesktopOpen(true); }
  }, [value, mobileSheetOpen]);

  useEffect(() => {
    if (mobileSheetOpen || isMobile()) return;
    if (!debouncedValue || debouncedValue.length < 2) return;
    if (llmAbort.current) llmAbort.current.cancelled = true;
    const handle = { cancelled: false };
    llmAbort.current = handle;
    setLlmLoading(true);

    base44.integrations.Core.InvokeLLM({
      prompt: LLM_PROMPT(debouncedValue),
      response_json_schema: LLM_SCHEMA,
    }).then((res) => {
      if (handle.cancelled) return;
      const list = Array.isArray(res?.results) ? res.results : [];
      if (list.length > 0) { setDesktopSuggestions(list.slice(0, 6)); setDesktopOpen(true); }
    }).catch(() => {}).finally(() => {
      if (!handle.cancelled) setLlmLoading(false);
    });
    return () => { handle.cancelled = true; };
  }, [debouncedValue, mobileSheetOpen]);

  useEffect(() => {
    if (!desktopOpen) return;
    function onOutside(e) {
      if (inputRef.current?.contains(e.target)) return;
      setDesktopOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [desktopOpen]);

  function handleSelect(label) {
    justSelected.current = true;
    onChange(label);
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
      <input
        ref={inputRef}
        type="text"
        value={value}
        readOnly={isMobile()}
        onChange={(e) => { if (!isMobile()) onChange(e.target.value); }}
        onFocus={handleTrigger}
        onClick={handleTrigger}
        placeholder={placeholder || "Airport or city"}
        autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
        style={{
          width: "100%", minWidth: 0, boxSizing: "border-box",
          height: "36px", borderRadius: "0.375rem",
          paddingLeft: "12px", paddingRight: "12px", fontSize: "16px",
          border: "1px solid rgba(200,162,124,0.2)", background: "rgba(255,255,255,0.8)",
          color: value ? "hsl(var(--foreground))" : "#A0907F",
          outline: "none", fontFamily: "inherit", cursor: "pointer",
          appearance: "none", WebkitAppearance: "none",
          ...inputStyle,
        }}
      />

      {mobileSheetOpen && (
        <MobileSearchSheet
          initialQuery={value}
          onSelect={handleSelect}
          onClose={() => setMobileSheetOpen(false)}
        />
      )}

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