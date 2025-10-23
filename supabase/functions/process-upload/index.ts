// FIX: Implemented the 'process-upload' Supabase function to resolve placeholder errors. This function handles multipart/form-data image uploads, extracts metadata using 'exifr', and returns it to the client.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import exifr from 'https://esm.sh/exifr@7.1.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, uppy-auth-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const formData = await req.formData();
    const file = formData.get('files[]'); // This is the default name Uppy uses
    if (!file || typeof file === 'string') {
        throw new Error('File not found in form data');
    }
    
    const buffer = await file.arrayBuffer();
    // Setting `true` as second argument is shortcut for all options.
    // It reads all tags and is the most thorough.
    const metadata = await exifr.parse(buffer, true);

    return new Response(
      JSON.stringify(metadata), // Return metadata directly
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error processing upload:', error);
    return new Response(JSON.stringify({ error: `Failed to process file: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
