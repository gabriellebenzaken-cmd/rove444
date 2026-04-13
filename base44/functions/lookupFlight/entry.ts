import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { flight_number, date } = await req.json();
    if (!flight_number || flight_number.trim().length < 3) {
      return Response.json({ error: 'Flight number too short' }, { status: 400 });
    }

    const flightNum = flight_number.trim().toUpperCase();
    const dateContext = date
      ? `The flight date is ${date}. Look up the real-time status of this flight on this date.`
      : `No specific date provided. Return scheduled route information.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Look up flight ${flightNum}. ${dateContext}

Return ONLY a JSON object (use null for unknown):
{
  "airline": "full airline name or null",
  "airline_code": "2-letter IATA code or null",
  "departure_airport": "3-letter IATA airport code or null",
  "arrival_airport": "3-letter IATA airport code or null",
  "scheduled_departure_time": "HH:MM 24h local or null",
  "scheduled_arrival_time": "HH:MM 24h local or null",
  "live_status": "on_time" | "delayed" | "landed" | "unknown" (only set if real-time data available for this date, otherwise "unknown"),
  "found": true or false,
  "ambiguous": true if multiple routes and route cannot be determined, otherwise false,
  "confidence": "high" if certain, "low" if uncertain
}
Only return facts you are highly confident about.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          airline: { type: ["string", "null"] },
          airline_code: { type: ["string", "null"] },
          departure_airport: { type: ["string", "null"] },
          arrival_airport: { type: ["string", "null"] },
          scheduled_departure_time: { type: ["string", "null"] },
          scheduled_arrival_time: { type: ["string", "null"] },
          live_status: { type: ["string", "null"] },
          found: { type: "boolean" },
          ambiguous: { type: "boolean" },
          confidence: { type: ["string", "null"] }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message, found: false }, { status: 500 });
  }
});