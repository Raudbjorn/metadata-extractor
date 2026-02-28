# Services

TypeScript service modules that power the core functionality of the Image Metadata Storyteller application.

## Capabilities

### Gemini AI Service (`services/geminiService.ts`)

Integrates with Google Gemini 2.5 Flash to generate creative narrative stories from EXIF metadata. Initialized with `process.env.API_KEY` (mapped from `GEMINI_API_KEY` in Vite config).

```typescript { .api }
/**
 * Analyzes image metadata using Google Gemini AI to generate a creative narrative story.
 *
 * @param embeddedMetadata - EXIF/technical metadata extracted from the image file.
 *   Common fields: Make, Model, DateTimeOriginal, GPSLatitude, GPSLongitude,
 *   ExposureTime, FNumber, ISO, etc.
 * @param providerMetadata - Optional metadata from cloud storage providers.
 *   Recognized fields: name (filename), host (service name), description, id (source ID).
 * @param config - AppConfig with tag definitions. Throws if null.
 * @param imageFormat - File extension or format (e.g., "jpg", "png", "tiff", "webp").
 * @returns Promise<string> - AI-generated narrative story text.
 * @throws Error("The AI service is currently unavailable.") on any failure (null config
 *   or Gemini API error). All errors are caught and rethrown with this single message.
 */
export const analyzeMetadataWithGemini: (
  embeddedMetadata: Record<string, any>,
  providerMetadata: Record<string, any> | undefined,
  config: AppConfig | null,
  imageFormat: string
) => Promise<string>;
```

**Usage:**

```typescript
import { analyzeMetadataWithGemini } from './services/geminiService';
import { getConfig } from './services/configService';

const config = await getConfig();

const story = await analyzeMetadataWithGemini(
  {
    Make: "Canon",
    Model: "EOS 5D Mark IV",
    DateTimeOriginal: "2024:03:15 14:30:22",
    GPSLatitude: 40.7128,
    GPSLongitude: -74.0060,
    ExposureTime: 0.008,
    FNumber: 2.8,
    ISO: 400
  },
  { host: "Google Drive", name: "sunset.jpg" }, // Optional provider info
  config,
  "jpg"
);
console.log(story);
// "On a crisp March afternoon in New York City, a photographer
//  wielding their Canon EOS 5D Mark IV captured this moment..."

// Error handling
try {
  const analysis = await analyzeMetadataWithGemini(metadata, undefined, config, "png");
} catch (error) {
  // error.message will be user-friendly
  console.error(error.message);
}
```

**Gemini API Configuration:**
- Model: `gemini-2.5-flash`
- Temperature: `0.8`
- TopP: `0.95`
- Prompt: Instructs AI to act as expert photo analyst, generate evocative story from metadata

**Internal metadata formatting:**
- Formats provider fields: `name` → "Original Filename", `host` → "Source Service", `description` → "Description", `id` → "Source ID"
- Iterates `config.tags` to include matching embedded EXIF fields
- Array values joined with `, `
- If no tags match: includes "No relevant embedded metadata was found"

---

### Media Service (`services/mediaService.ts`)

Client-side (browser-only) image perceptual hash generation using blockhash algorithm. Requires Canvas API.

```typescript { .api }
/**
 * Generates a perceptual hash (pHash) for an image as a visual fingerprint.
 * Uses blockhash algorithm with 16-bit precision (64-bit output hash).
 * Resilient to minor modifications (resize, compression, color adjustments).
 *
 * BROWSER ONLY - requires HTML5 Canvas and Image APIs.
 *
 * @param imageUrl - URL of the image to hash.
 *   Supported URL types:
 *   - Blob URLs: URL.createObjectURL(file)
 *   - Data URLs: base64-encoded images
 *   - HTTP/HTTPS URLs (must support CORS if cross-origin)
 * @returns Promise<string> - Hexadecimal hash string (64-bit, 16x16 grid).
 *   Returns empty string "" if hash generation fails (does NOT throw).
 */
export const generatePerceptualHash: (imageUrl: string) => Promise<string>;
```

**Usage:**

```typescript
import { generatePerceptualHash } from './services/mediaService';

// Generate hash from uploaded file
const file = inputElement.files[0];
const blobUrl = URL.createObjectURL(file);
const hash = await generatePerceptualHash(blobUrl);
console.log(hash); // "89a7c4d3e1f2b5a6..." (hex string)

// Check for failure (always check, does not throw)
if (!hash) {
  console.error("Hash generation failed - check console for details");
}

// Compare two images for similarity (lower Hamming distance = more similar)
const hash1 = await generatePerceptualHash(imageUrl1);
const hash2 = await generatePerceptualHash(imageUrl2);
// Use DB hamming_distance() function or client-side bit comparison
```

**Algorithm details:**
- Uses `blockhashData` from `blockhash` npm package (GitHub repo: `blockhash-js`)
- Precision: 16 bits → produces 64-bit hash
- Method: 1 (basic blockhash)
- Image loaded via `new Image()` with `crossOrigin = "Anonymous"`
- Pixel data extracted via `CanvasRenderingContext2D.getImageData()`
- `blockhashData(imageData, 16, 1)` called with Canvas ImageData
- Error handling: logs to console, returns `""` (never throws)

---

### Config Service (`services/configService.ts`)

Loads and caches EXIF tag configuration from the server. Singleton pattern prevents multiple fetches.

```typescript { .api }
/**
 * Retrieves the application configuration, loading from server if not cached.
 * Implements singleton promise caching - multiple concurrent calls return the same promise.
 * On error, cache is cleared to allow retry on next call.
 *
 * Fetches from: /exiftool_config.json (application root)
 *
 * @returns Promise<AppConfig> - Configuration object with tag definitions.
 * @throws Error if the config file cannot be fetched (non-OK HTTP status) or parsed.
 */
export const getConfig: () => Promise<AppConfig>;
```

**Usage:**

```typescript
import { getConfig } from './services/configService';

// Basic usage
const config = await getConfig();
console.log(`Loaded ${config.tags.length} tag definitions`);

// Multiple calls return the same cached promise
const promise1 = getConfig(); // Triggers fetch
const promise2 = getConfig(); // Returns cached promise (same reference)
console.log(promise1 === promise2); // true

// In React component (useEffect)
useEffect(() => {
  getConfig()
    .then(setAppConfig)
    .catch(err => {
      console.error("Failed to load config:", err);
      setError("Could not load configuration.");
    });
}, []);

// Example config structure returned:
// {
//   tags: [
//     { key: "Make", label: "Camera Make", category: "camera" },
//     { key: "Model", label: "Camera Model", category: "camera" },
//     { key: "DateTimeOriginal", label: "Date Taken", category: "temporal" },
//     { key: "GPSLatitude", label: "Latitude", category: "location" },
//     { key: "GPSLongitude", label: "Longitude", category: "location" },
//     { key: "ExposureTime", label: "Exposure Time", category: "technical" },
//     { key: "FNumber", label: "F-Number", category: "technical" },
//     { key: "ISO", label: "ISO", category: "technical" }
//   ]
// }
```

---

### Supabase Service (`services/supabaseService.ts`)

**Status: PLACEHOLDER - Not actively used**

This module exports only `export {}` and serves as a stub for future Supabase client integration. No functions are currently implemented.

**Planned future capabilities:**
- Metadata persistence to `media_metadata` table
- Perceptual hash similarity queries via `hamming_distance()` RPC
- User authentication via Supabase Auth
- Realtime status subscriptions

**Future implementation pattern (not yet active):**

```typescript
// When implemented, would use @supabase/supabase-js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Save metadata
await supabase.from('media_metadata').insert({
  file_name: fileName,
  metadata: exifData,
  phash: perceptualHash
});

// Find similar images using Hamming distance
const { data } = await supabase.rpc('find_similar_images', {
  target_hash: hash,
  max_distance: 10
});
```

---

### ExifTool Service (`services/exiftoolService.ts`)

**Status: Not currently used**

Empty stub file (`export {}`). Metadata extraction is handled entirely by the `process-upload` Edge Function using `exifr`.

---

## Types

```typescript { .api }
interface AppConfig {
  tags: TagConfig[];
}

interface TagConfig {
  /** EXIF tag identifier (e.g., "Make", "Model", "DateTimeOriginal", "GPSLatitude") */
  key: string;
  /** Human-readable display name (e.g., "Camera Make", "Date Taken") */
  label: string;
  /** Grouping category (e.g., "camera", "location", "technical", "temporal", "descriptive") */
  category: string;
}
```
