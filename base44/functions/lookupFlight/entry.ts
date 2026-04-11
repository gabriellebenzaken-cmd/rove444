import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { flight_number } = await req.json();
    if (!flight_number || flight_number.trim().length < 3) {
      return Response.json({ error: 'Flight number too short' }, { status: 400 });
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Look up the scheduled flight details for flight ${flight_number.trim().toUpperCase()}.
Return ONLY a JSON object with these fields (use null for unknown):
{
  "airline": "full airline name or null",
  "airline_code": "2-letter IATA code or null",
  "departure_airport": "3-letter IATA airport code or null",
  "departure_airport_name": "city/airport name or null",
  "arrival_airport": "3-letter IATA airport code or null",
  "arrival_airport_name": "city/airport name or null",
  "scheduled_departure_time": "HH:MM in 24h local time or null",
  "scheduled_arrival_time": "HH:MM in 24h local time or null",
  "duration_minutes": number or null,
  "found": true or false
}
Only return facts you are highly confident about. Return found:false if the flight number is not recognized.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          airline: { type: ["string", "null"] },
          airline_code: { type: ["string", "null"] },
          departure_airport: { type: ["string", "null"] },
          departure_airport_name: { type: ["string", "null"] },
          arrival_airport: { type: ["string", "null"] },
          arrival_airport_name: { type: ["string", "null"] },
          scheduled_departure_time: { type: ["string", "null"] },
          scheduled_arrival_time: { type: ["string", "null"] },
          duration_minutes: { type: ["number", "null"] },
          found: { type: "boolean" }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message, found: false }, { status: 500 });
  }
});