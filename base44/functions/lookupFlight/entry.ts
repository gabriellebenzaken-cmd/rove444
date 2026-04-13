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

    const apiKey = Deno.env.get('AVIATIONSTACK_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Aviationstack API key not configured' }, { status: 500 });
    }

    const flightNum = flight_number.trim().toUpperCase();
    const url = new URL('http://api.aviationstack.com/v1/flights');
    url.searchParams.append('access_key', apiKey);
    url.searchParams.append('flight_iata', flightNum);
    if (date) {
      url.searchParams.append('flight_date', date);
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok || !data.data || data.data.length === 0) {
      return Response.json({
        found: false,
        live_status: 'unknown',
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

    const flight = data.data[0];

    const statusMap = {
      'scheduled': 'on_time',
      'active': 'on_time',
      'landed': 'landed',
      'cancelled': 'unknown',
      'delayed': 'delayed',
    };

    const flightStatus = flight.flight_status?.toLowerCase() || 'unknown';
    const liveStatus = statusMap[flightStatus] || 'unknown';

    return Response.json({
      found: true,
      live_status: liveStatus,
      airline: flight.airline?.name || null,
      airline_code: flight.airline?.iata_code || null,
      departure_airport: flight.departure?.airport || null,
      arrival_airport: flight.arrival?.airport || null,
      scheduled_departure_time: flight.departure?.scheduled ? new Date(flight.departure.scheduled).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : null,
      scheduled_arrival_time: flight.arrival?.scheduled ? new Date(flight.arrival.scheduled).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : null,
      terminal: flight.departure?.terminal || null,
      gate: flight.departure?.gate || null,
    });
  } catch (error) {
    return Response.json({ error: error.message, found: false }, { status: 500 });
  }
});