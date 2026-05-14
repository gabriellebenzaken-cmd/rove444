import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const DEMO_TAG = '__demo__';
    const tripCodes = [`${DEMO_TAG}JAPAN26`, `${DEMO_TAG}MIAMI26`, `${DEMO_TAG}FEST26`];

    // Find the seeded trips
    const allTrips = await base44.entities.Trip.filter({}, '-created_date', 200);
    const demoTrips = allTrips.filter(t => tripCodes.includes(t.invite_code));

    if (demoTrips.length === 0) {
      return Response.json({ message: 'No demo trips found.' });
    }

    const results = [];

    for (const trip of demoTrips) {
      let deleted = 0;

      // Delete all Payment records for this trip
      try {
        const payments = await base44.entities.Payment.filter({ trip_id: trip.id }, '-created_date', 500);
        if (payments.length > 0) {
          await Promise.all(payments.map(p => base44.entities.Payment.delete(p.id)));
          deleted += payments.length;
        }
      } catch (e) {
        console.error(`Error deleting payments for ${trip.name}:`, e.message);
      }

      // Delete all Expense records for this trip
      try {
        const expenses = await base44.entities.Expense.filter({ trip_id: trip.id }, '-created_date', 500);
        if (expenses.length > 0) {
          await Promise.all(expenses.map(e => base44.entities.Expense.delete(e.id)));
          deleted += expenses.length;
        }
      } catch (e) {
        console.error(`Error deleting expenses for ${trip.name}:`, e.message);
      }

      results.push({ 
        trip: trip.name, 
        deleted,
        message: `Cleared ${deleted} cost records. Reseed the trip to apply new balanced payments.`
      });
    }

    return Response.json({
      success: true,
      message: 'Demo trip costs cleared. Run the seeder to regenerate with balanced payments.',
      results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});