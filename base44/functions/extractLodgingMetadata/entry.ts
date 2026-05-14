import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { booking_url } = body;

    if (!booking_url) {
      return Response.json({ error: 'No booking URL provided' }, { status: 400 });
    }

    // Use InvokeLLM to extract metadata from booking link
    // This will attempt to fetch and parse the page for property details
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are extracting lodging/hotel property information from a booking URL.
      
URL: ${booking_url}

Please extract and return ONLY the following as JSON (no markdown, no extra text):
- title: property name (string)
- image_url: main property image URL if visible on page preview (string, or null if not found)
- address: property address if available (string, or null)

Return valid JSON only. Example:
{"title":"Hotel Name","image_url":"https://...jpg","address":"123 Main St, City"}`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          image_url: { type: ["string", "null"] },
          address: { type: ["string", "null"] }
        }
      },
      add_context_from_internet: true
    });

    // Return extracted metadata
    return Response.json({
      success: true,
      metadata: response || { title: null, image_url: null, address: null }
    });
  } catch (error) {
    // Gracefully fallback on error
    return Response.json({
      success: false,
      error: error.message,
      metadata: { title: null, image_url: null, address: null }
    });
  }
});