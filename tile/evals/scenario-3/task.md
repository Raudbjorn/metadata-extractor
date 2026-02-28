# Image EXIF Metadata Extraction Edge Function

Implement a Deno serverless function that accepts multipart image uploads and returns the extracted EXIF metadata as JSON.

## Capabilities { .capabilities }

### Accept multipart/form-data and extract file

The function must parse the incoming multipart/form-data request to extract the uploaded image file from the `files[]` field. If the field is missing or is a plain string (not a File/Blob), the function must throw an appropriate error.

- Parses form data and extracts the file from the 'files[]' field [@test](./tests/form-data-extraction.test.ts)
- Returns an error response when 'files[]' is absent or is a string [@test](./tests/missing-file-error.test.ts)

### Parse EXIF metadata from ArrayBuffer

The extracted file must be converted to an ArrayBuffer and passed to the EXIF parsing library with all parsing options enabled, to extract the maximum possible metadata. The parsed metadata object must be returned as the JSON response body.

- Converts the file to ArrayBuffer before parsing [@test](./tests/arraybuffer-conversion.test.ts)
- Parses metadata with all options enabled (second argument `true`) [@test](./tests/full-parse-options.test.ts)
- Returns the raw metadata object directly as the JSON response body [@test](./tests/metadata-response-shape.test.ts)

### CORS headers on all responses

All responses (including error responses) must include the CORS headers that allow cross-origin requests from the browser frontend, including support for custom Uppy headers.

- CORS headers are present on success responses [@test](./tests/cors-success.test.ts)
- CORS headers are present on error responses [@test](./tests/cors-error.test.ts)
- OPTIONS preflight requests receive an 'ok' response with CORS headers [@test](./tests/cors-preflight.test.ts)

## Implementation { .implementation }

[@generates](./src/process-upload/index.ts)

## Dependencies { .dependencies }

### image-metadata-explorer-with-ai-analysis 0.0.0 { .dependency }

A React application for image metadata extraction and AI-powered story generation. Provides the process-upload Supabase Edge Function pattern using Deno serve(), exifr.parse(), and formData extraction with CORS support.
[@satisfied-by](image-metadata-explorer-with-ai-analysis)
