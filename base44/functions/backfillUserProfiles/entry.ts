import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Fetch all users using service role
    const allUsers = await base44.asServiceRole.entities.User.list();
    console.log(`[Backfill] Processing ${allUsers.length} users`);
    
    let created = 0;
    let skipped = 0;
    
    for (const user of allUsers) {
      // Check if UserProfile exists for this user
      const existing = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
      
      if (existing.length === 0) {
        // Create UserProfile
        await base44.asServiceRole.entities.UserProfile.create({
          user_id: user.id,
          user_email: user.email,
          username: user.data?.username || user.username || user.email.split('@')[0],
          full_name: user.full_name || '',
          profile_photo: user.data?.profile_photo || null,
        });
        created++;
        console.log(`[Backfill] Created UserProfile for ${user.email}`);
      } else {
        skipped++;
        console.log(`[Backfill] Skipped ${user.email} (already exists)`);
      }
    }
    
    console.log(`[Backfill] Summary: ${allUsers.length} processed, ${created} created, ${skipped} skipped`);
    
    return Response.json({
      totalProcessed: allUsers.length,
      profilesCreated: created,
      profilesSkipped: skipped,
    });
  } catch (error) {
    console.error('[Backfill] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});