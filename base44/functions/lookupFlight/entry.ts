import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import moment from 'npm:moment';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { flight_number, date } = await req.json();
    const flightNum = flight_number?.trim().toUpperCase();

    console.log('LookupFlight: Incoming flight_number:', flight_number);
    console.log('LookupFlight: Incoming date:', date);

    if (!flightNum || flightNum.length < 3) {
      return Response.json({ error: 'Flight number too short' }, { status: 400 });
    }

    const apiKey = Deno.env.get('AVIATIONSTACK_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Aviationstack API key not configured' }, { status: 500 });
    }

    // Validate and normalize date to YYYY-MM-DD
    let validatedDate = null;
    if (date) {
      const parsedDate = moment(date, 'YYYY-MM-DD', true);
      if (parsedDate.isValid()) {
        validatedDate = parsedDate.format('YYYY-MM-DD');
      } else {
        console.warn(`LookupFlight: Invalid date format received: ${date}. Expected YYYY-MM-DD.`);
      }
    }

    // Build API request
    const url = new URL('http://api.aviationstack.com/v1/flights');
    url.searchParams.append('access_key', apiKey);
    url.searchParams.append('flight_iata', flightNum);
    if (validatedDate) {
      url.searchParams.append('flight_date', validatedDate);
    }

    console.log('LookupFlight: Final Aviationstack request URL (without key):', url.toString().replace(apiKey, '[API_KEY_REDACTED]'));

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok || !data.data || data.data.length === 0) {
      console.log('LookupFlight: Aviationstack returned no data or response not OK.');
      return Response.json({
        found: false,
        live_status: null,
        airline: null,
        airline_code: null,
        departure_airport: null,
        arrival_airport: null,
        scheduled_departure_time: null,
        scheduled_arrival_time: null,
        terminal: null,
        gate: null,
      });
    }

    // Debug: Log first 3 returned flights
    console.log('LookupFlight: Aviationstack response data.length:', data.data.length);
    data.data.slice(0, 3).forEach((f, index) => {
      console.log(`LookupFlight: Returned Flight ${index + 1}:`, {
        iata_number: f.flight?.iata_number,
        number: f.flight?.number,
        airline_code: f.airline?.iata_code,
        departure_iata: f.departure?.iata,
        arrival_iata: f.arrival?.iata,
        flight_status: f.flight_status,
        flight_date: f.flight_date,
      });
    });

    // Smarter matching: Don't blindly use data[0]
    let bestMatch = null;
    for (const flight of data.data) {
      const flightIata = flight.flight?.iata_number?.toUpperCase();
      const airlineCode = flight.airline?.iata_code?.toUpperCase();
      const flightNumber = flight.flight?.number;
      const flightDate = flight.flight_date;

      const isExactIataMatch = flightIata === flightNum;
      const isConstructedMatch = airlineCode && flightNumber && `${airlineCode}${flightNumber}` === flightNum;

      if (isExactIataMatch || isConstructedMatch) {
        if (!bestMatch) {
          bestMatch = flight;
        } else if (validatedDate && flightDate === validatedDate) {
          // Prefer date match if multiple results
          bestMatch = flight;
          break;
        }
      }
    }

    if (!bestMatch) {
      console.log('LookupFlight: No confident match found after filtering Aviationstack results.');
      return Response.json({
        found: false,
        live_status: null,
        airline: null,
        airline_code: null,
        departure_airport: null,
        arrival_airport: null,
        scheduled_departure_time: null,
        scheduled_arrival_time: null,
        terminal: null,
        gate: null,
      });
    }

    // Map flight status
    const statusMap = {
      'scheduled': 'on_time',
      'active': 'on_time',
      'landed': 'landed',
      'delayed': 'delayed',
    };

    const flightStatus = bestMatch.flight_status?.toLowerCase();
    const liveStatus = statusMap[flightStatus] || null;

    return Response.json({
      found: true,
      live_status: liveStatus,
      airline: bestMatch.airline?.name || null,
      airline_code: bestMatch.airline?.iata_code || null,
      departure_airport: bestMatch.departure?.airport || null,
      arrival_airport: bestMatch.arrival?.airport || null,
      scheduled_departure_time: bestMatch.departure?.scheduled ? new Date(bestMatch.departure.scheduled).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : null,
      scheduled_arrival_time: bestMatch.arrival?.scheduled ? new Date(bestMatch.arrival.scheduled).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : null,
      terminal: bestMatch.departure?.terminal || null,
      gate: bestMatch.departure?.gate || null,
    });
  } catch (error) {
    console.error('LookupFlight: Error during flight lookup:', error.message);
    return Response.json({ error: error.message, found: false, live_status: null }, { status: 500 });
  }
});