export const IATA_AIRLINES = {
  AA: "American Airlines", UA: "United Airlines", DL: "Delta Air Lines",
  WN: "Southwest Airlines", B6: "JetBlue", AS: "Alaska Airlines",
  F9: "Frontier Airlines", NK: "Spirit Airlines", G4: "Allegiant Air",
  BA: "British Airways", LH: "Lufthansa", AF: "Air France",
  KL: "KLM", EK: "Emirates", QR: "Qatar Airways", SQ: "Singapore Airlines",
  CX: "Cathay Pacific", JL: "Japan Airlines", NH: "ANA",
  AC: "Air Canada", WS: "WestJet", FR: "Ryanair", U2: "easyJet",
  VY: "Vueling", IB: "Iberia", AZ: "Alitalia", TK: "Turkish Airlines",
  JBU: "JetBlue",
};

export function parseAirlineCode(flightNum) {
  const match = flightNum?.trim().match(/^([A-Z]{2,3})\d/i);
  return match ? match[1].toUpperCase() : null;
}

export function guessAirline(flightNum) {
  const code = parseAirlineCode(flightNum);
  return code ? (IATA_AIRLINES[code] || null) : null;
}