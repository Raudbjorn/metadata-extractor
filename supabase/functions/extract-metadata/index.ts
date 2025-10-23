/**
 * @fileoverview Alternative Supabase Edge Function for extracting EXIF metadata from raw image buffers.
 * This serverless function accepts raw image data in the request body (not multipart/form-data)
 * and returns extracted EXIF metadata. Useful for direct binary uploads or programmatic access.
 *
 * NOTE: This function is currently not used by the frontend application.
 * The main upload flow uses 'process-upload' which handles multipart/form-data from Uppy.
 *
 * @module extract-metadata
 * @runtime Deno Edge Function
 * @endpoint POST /functions/v1/extract-metadata
 * @status ALTERNATIVE - Not actively used by frontend
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import exifr from 'https://esm.sh/exifr@7.1.3'

/**
 * CORS headers for cross-origin requests.
 * Allows all origins (*) for development - should be restricted in production.
 *
 * @constant
 * @type {Record<string, string>}
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Main request handler for the extract-metadata Edge Function.
 * Processes raw binary image data and extracts EXIF metadata.
 *
 * Request Flow:
 * 1. Handle CORS preflight (OPTIONS)
 * 2. Read raw binary data from request body
 * 3. Parse EXIF metadata using exifr
 * 4. Return metadata wrapped in JSON object
 *
 * @async
 * @param {Request} req - Incoming HTTP request with raw image data in body
 * @returns {Promise<Response>} JSON response with metadata object or error
 *
 * @example
 * // Request with raw binary data:
 * // POST /functions/v1/extract-metadata
 * // Content-Type: application/octet-stream
 * // Body: <raw image bytes>
 *
 * @example
 * // Using fetch API:
 * const imageFile = document.querySelector('input[type=file]').files[0];
 * const arrayBuffer = await imageFile.arrayBuffer();
 *
 * const response = await fetch('http://localhost:54321/functions/v1/extract-metadata', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/octet-stream' },
 *   body: arrayBuffer
 * });
 *
 * const data = await response.json();
 * console.log(data.metadata);
 *
 * @example
 * // Success response (200):
 * // {
 * //   "metadata": {
 * //     "Make": "Canon",
 * //     "Model": "EOS 5D Mark IV",
 * //     "DateTimeOriginal": "2024:03:15 14:30:22",
 * //     ... (all available EXIF tags)
 * //   }
 * // }
 *
 * @example
 * // Error response (500):
 * // {
 * //   "error": "Request body is empty."
 * // }
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request has body
    if (!req.body) {
        throw new Error('Request body is empty.');
    }

    // Read raw image data as ArrayBuffer
    const buffer = await req.arrayBuffer();

    // Extract all EXIF tags using exifr
    // Second argument `true` enables all parsing options for maximum thoroughness
    const metadata = await exifr.parse(buffer, true);

    // Return metadata wrapped in object
    return new Response(
      JSON.stringify({ metadata }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
})
