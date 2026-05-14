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
      return Response.json({ 
        message: 'No demo trips found to update. Run the seeder first.',
        tripsChecked: demoTrips.length 
      });
    }

    const results = [];

    for (const trip of demoTrips) {
      // Delete all existing payments for this trip
      const allPayments = await base44.entities.Payment.filter({ trip_id: trip.id }, '-created_date', 500);
      if (allPayments.length > 0) {
        await Promise.all(allPayments.map(p => base44.entities.Payment.delete(p.id)));
        results.push({ trip: trip.name, action: `Deleted ${allPayments.length} old payments` });
      } else {
        results.push({ trip: trip.name, action: 'No old payments to delete' });
      }
    }

    return Response.json({
      success: true,
      message: 'Existing demo trip payments cleared. Run the seeder to create rebalanced payments.',
      results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});