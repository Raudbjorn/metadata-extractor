// FIX: Implemented the 'extract-metadata' Supabase function to resolve placeholder errors. This provides a server-side endpoint for extracting EXIF and other metadata from raw image data.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import exifr from 'https://esm.sh/exifr@7.1.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // This function expects raw image data in the request body
    if (!req.body) {
        throw new Error('Request body is empty.');
    }
    const buffer = await req.arrayBuffer();
    const metadata = await exifr.parse(buffer, true);

    return new Response(
      JSON.stringify({ metadata }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
