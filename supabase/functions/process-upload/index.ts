/**
 * @fileoverview Supabase Edge Function for processing image uploads and extracting EXIF metadata.
 * This serverless function receives multipart/form-data uploads from the Uppy client,
 * extracts comprehensive EXIF metadata using the exifr library, and returns it as JSON.
 *
 * @module process-upload
 * @runtime Deno Edge Function
 * @endpoint POST /functions/v1/process-upload
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import exifr from 'https://esm.sh/exifr@7.1.3'

/**
 * CORS headers for cross-origin requests from the frontend.
 * Allows all origins (*) for development - should be restricted in production.
 *
 * @constant
 * @type {Record<string, string>}
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, uppy-auth-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Main request handler for the process-upload Edge Function.
 * Processes multipart/form-data uploads, extracts EXIF metadata, and returns JSON response.
 *
 * Request Flow:
 * 1. Handle CORS preflight (OPTIONS)
 * 2. Extract uploaded file from FormData
 * 3. Convert file to ArrayBuffer
 * 4. Parse EXIF metadata using exifr
 * 5. Return metadata as JSON
 *
 * @async
 * @param {Request} req - Incoming HTTP request from Uppy XHRUpload
 * @returns {Promise<Response>} JSON response with metadata or error
 *
 * @example
 * // Request from Uppy client:
 * // POST /functions/v1/process-upload
 * // Content-Type: multipart/form-data; boundary=...
 * // Body: FormData with field 'files[]' containing image file
 *
 * @example
 * // Success response (200):
 * // {
 * //   "Make": "Canon",
 * //   "Model": "EOS 5D Mark IV",
 * //   "DateTimeOriginal": "2024:03:15 14:30:22",
 * //   "GPSLatitude": 40.7128,
 * //   "GPSLongitude": -74.0060,
 * //   "ExposureTime": 0.008,
 * //   "FNumber": 2.8,
 * //   "ISO": 400,
 * //   ... (all available EXIF tags)
 * // }
 *
 * @example
 * // Error response (500):
 * // {
 * //   "error": "Failed to process file: File not found in form data"
 * // }
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse multipart form data from Uppy
    const formData = await req.formData();
    const file = formData.get('files[]'); // Default field name from Uppy XHRUpload

    if (!file || typeof file === 'string') {
        throw new Error('File not found in form data');
    }

    // Convert file to ArrayBuffer for exifr processing
    const buffer = await file.arrayBuffer();

    // Extract all EXIF tags using exifr
    // Second argument `true` enables all parsing options for maximum thoroughness
    const metadata = await exifr.parse(buffer, true);

    // Return extracted metadata as JSON
    return new Response(
      JSON.stringify(metadata),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error processing upload:', error);
    return new Response(
      JSON.stringify({ error: `Failed to process file: ${error.message}` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
