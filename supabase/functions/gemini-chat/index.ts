// Supabase Edge Function: Server-Side Gemini Chatbot Endpoint
// Deploy via Supabase CLI: supabase functions deploy gemini-chat --no-verify-jwt
// Set server secret: supabase secrets set GEMINI_API_KEY=your_gemini_key

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read and validate input
    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Input length limit: max 500 characters
    if (message.length > 500) {
      return new Response(JSON.stringify({ error: "Message exceeds 500 characters limit." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY is not configured on this server.",
          fallback: true,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = `You are UrMart AI, an elegant, friendly, and knowledgeable e-commerce shopping assistant for UrMart, a curated lifestyle store.
Store Catalog Categories: Home Decor, Lighting, Kitchen, Workspace, Wellness, Travel.
Coupons available: WELCOME10 (10% off), URMART20 (20% off), FREESHIP (Free express delivery).
Keep responses warm, concise, helpful, and beautifully styled with bullet points where appropriate.`;

    // Secure server-to-server call with header authentication
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    const geminiRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }],
          },
        ],
      }),
    });

    if (!geminiRes.ok) {
      return new Response(
        JSON.stringify({ error: "Upstream AI provider error. Fallback to catalog rules recommended." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await geminiRes.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I am here to help!";

    return new Response(
      JSON.stringify({ reply: replyText, engine: "gemini-1.5-flash" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMsg }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
