# Backend Edge Functions

Supabase Edge Functions (Deno runtime) for server-side EXIF metadata extraction from uploaded images.

## Capabilities

### process-upload (Primary Endpoint)

Receives multipart/form-data uploads from Uppy XHRUpload, extracts all EXIF metadata using `exifr`, and returns a flat JSON object.

**Endpoint:** `POST /functions/v1/process-upload`
**Runtime:** Deno (Supabase Edge Function)
**Status:** Active - used by `UppyUploader` component

```typescript { .api }
/**
 * POST /functions/v1/process-upload
 *
 * Request:
 *   Content-Type: multipart/form-data
 *   Body: FormData with field 'files[]' containing the image file
 *
 * Response 200:
 *   Content-Type: application/json
 *   Body: Flat EXIF metadata object (all available tags)
 *
 * Response 500:
 *   Content-Type: application/json
 *   Body: { error: string }
 *
 * CORS headers:
 *   Access-Control-Allow-Origin: *
 *   Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type, uppy-auth-token
 *   Access-Control-Allow-Methods: POST, OPTIONS
 */
```

**Request format:**

```
POST /functions/v1/process-upload HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...

------WebKitFormBoundary...
Content-Disposition: form-data; name="files[]"; filename="photo.jpg"
Content-Type: image/jpeg

<binary image data>
------WebKitFormBoundary...--
```

**Success response (200):**

```json
{
  "Make": "Canon",
  "Model": "EOS 5D Mark IV",
  "DateTimeOriginal": "2024:03:15 14:30:22",
  "GPSLatitude": 40.7128,
  "GPSLongitude": -74.0060,
  "GPSAltitude": 10.5,
  "ExposureTime": 0.008,
  "FNumber": 2.8,
  "ISO": 400,
  "FocalLength": 50,
  "WhiteBalance": 0,
  "Flash": 16
}
```

**Error response (500):**

```json
{ "error": "Failed to process file: File not found in form data" }
```

**Calling from browser:**

```typescript
// Using fetch (equivalent to what Uppy XHRUpload does internally)
const formData = new FormData();
formData.append('files[]', imageFile);

const response = await fetch(
  'http://localhost:54321/functions/v1/process-upload',
  { method: 'POST', body: formData }
);

if (!response.ok) {
  const err = await response.json();
  throw new Error(err.error);
}

const metadata = await response.json();
// metadata = { Make: "Canon", ... }
```

**EXIF extraction:**
- Library: `exifr@7.1.3` (via `https://esm.sh/exifr@7.1.3`)
- Call: `exifr.parse(buffer, true)` - `true` enables all parsing options for maximum tag coverage
- Input: `ArrayBuffer` from `file.arrayBuffer()`

---

### extract-metadata (Alternative Endpoint)

Receives raw binary image data (not multipart) and returns EXIF metadata wrapped in an object.

**Endpoint:** `POST /functions/v1/extract-metadata`
**Runtime:** Deno (Supabase Edge Function)
**Status:** Alternative - **not actively used by frontend**, available for programmatic access

```typescript { .api }
/**
 * POST /functions/v1/extract-metadata
 *
 * Request:
 *   Content-Type: application/octet-stream
 *   Body: Raw image bytes (ArrayBuffer)
 *
 * Response 200:
 *   Content-Type: application/json
 *   Body: { metadata: Record<string, any> }  ← Note: nested under "metadata" key
 *
 * Response 500:
 *   Content-Type: application/json
 *   Body: { error: string }
 *
 * CORS headers:
 *   Access-Control-Allow-Origin: *
 *   Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
 */
```

**Key difference from `process-upload`:**
- Input: Raw binary body (`application/octet-stream`) vs multipart form data
- Response: Metadata wrapped in `{ metadata: {...} }` vs flat object
- No `uppy-auth-token` in CORS headers

**Calling from browser:**

```typescript
const imageFile = fileInput.files[0];
const arrayBuffer = await imageFile.arrayBuffer();

const response = await fetch(
  'http://localhost:54321/functions/v1/extract-metadata',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: arrayBuffer,
  }
);

if (!response.ok) {
  const err = await response.json();
  throw new Error(err.error);
}

const data = await response.json();
const metadata = data.metadata; // { Make: "Canon", ... }
```

**Success response (200):**

```json
{
  "metadata": {
    "Make": "Canon",
    "Model": "EOS 5D Mark IV",
    "DateTimeOriginal": "2024:03:15 14:30:22",
    "GPSLatitude": 40.7128
  }
}
```

**Error response (500):**

```json
{ "error": "Request body is empty." }
```

---

## Local Development

Edge Functions run locally via Supabase CLI:

```bash
# Start local Supabase stack (PostgreSQL + Edge Functions)
supabase start

# Functions available at:
# http://localhost:54321/functions/v1/process-upload
# http://localhost:54321/functions/v1/extract-metadata

# Stop local stack
supabase stop
```

**Directory structure:**
```
supabase/
├── config.toml          # Supabase project config
├── functions/
│   ├── process-upload/
│   │   └── index.ts     # Main multipart upload handler
│   └── extract-metadata/
│       └── index.ts     # Alternative raw binary handler
└── migrations/          # PostgreSQL schema migrations
```

## Edge Function Imports (Deno)

```typescript
// Standard library HTTP server
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// EXIF extraction library
import exifr from 'https://esm.sh/exifr@7.1.3';
```
