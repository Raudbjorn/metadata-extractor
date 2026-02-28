# Setup & Configuration

Environment setup, configuration files, database schema, and deployment for the Image Metadata Storyteller application.

## Capabilities

### Installation & Development Setup

```bash
# Prerequisites: Node.js v18+, Docker, Supabase CLI
npm install -g supabase

# Install project dependencies
npm install

# Configure environment
cat > .env.local << EOF
GEMINI_API_KEY=your_gemini_api_key_here
EOF

# Start local Supabase (requires Docker)
supabase start
# Starts: PostgreSQL on 5432, Edge Functions on 54321, Studio on 54323

# Start Vite development server
npm run dev
# App available at http://localhost:3000
```

### Build Scripts

```bash
npm run dev      # Vite dev server with HMR on port 3000
npm run build    # Production build, output to dist/
npm run preview  # Serve production build locally
```

---

### Environment Variables

```typescript { .api }
/**
 * Required environment variables (set in .env.local for development)
 */

/**
 * GEMINI_API_KEY
 * Google Gemini API key from https://aistudio.google.com
 * Mapped to process.env.API_KEY and process.env.GEMINI_API_KEY by Vite
 */
GEMINI_API_KEY = string;
```

The Vite configuration (`vite.config.ts`) maps this variable:

```typescript
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

The Gemini service reads: `process.env.API_KEY`

---

### Vite Configuration (`vite.config.ts`)

```typescript { .api }
/**
 * Vite build configuration
 * File: vite.config.ts
 */
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  define: {
    // Maps GEMINI_API_KEY env var to runtime process.env variables
    'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'), // @ maps to project root
    },
  },
});
```

---

### EXIF Tag Configuration (`exiftool_config.json`)

The config file must be served at the application root as `/exiftool_config.json`. It is loaded by `configService.getConfig()` and drives which EXIF tags are displayed and how they are categorized.

```typescript { .api }
/**
 * Structure of exiftool_config.json
 * Served at: /exiftool_config.json (Vite serves from project root)
 * Loaded by: services/configService.ts getConfig()
 */
interface ExiftoolConfigFile {
  tags: Array<{
    key: string;      // EXIF tag name as returned by exifr (e.g., "Make", "latitude")
    label: string;    // Human-readable display label (e.g., "Camera Make", "Latitude")
    category: string; // Grouping category name (arbitrary string used for display grouping)
  }>;
}
```

**Actual configuration (from `exiftool_config.json`):**

```json
{
  "tags": [
    { "key": "ObjectName",    "label": "Title",                  "category": "description" },
    { "key": "ImageDescription", "label": "Caption",             "category": "description" },
    { "key": "Keywords",      "label": "Keywords",               "category": "keywords" },
    { "key": "Artist",        "label": "Photographer/Creator",   "category": "author" },
    { "key": "Make",          "label": "Camera Make",            "category": "device" },
    { "key": "Model",         "label": "Camera Model",           "category": "device" },
    { "key": "LensModel",     "label": "Lens Model",             "category": "device" },
    { "key": "Orientation",   "label": "Orientation",            "category": "device" },
    { "key": "DateTimeOriginal", "label": "Date/Time Taken",     "category": "time" },
    { "key": "latitude",      "label": "Latitude",               "category": "gps" },
    { "key": "longitude",     "label": "Longitude",              "category": "gps" },
    { "key": "FNumber",       "label": "Aperture (F-stop)",      "category": "camera_settings" },
    { "key": "ExposureTime",  "label": "Exposure Time",          "category": "camera_settings" },
    { "key": "ISO",           "label": "ISO Speed",              "category": "camera_settings" },
    { "key": "FocalLength",   "label": "Focal Length",           "category": "camera_settings" },
    { "key": "ImageWidth",    "label": "Image Width",            "category": "device" },
    { "key": "ImageHeight",   "label": "Image Height",           "category": "device" }
  ]
}
```

**Notes:**
- `key` values must match EXIF tag names as returned by `exifr.parse(buffer, true)`. Note: GPS keys from exifr are lowercase `latitude`/`longitude`, not `GPSLatitude`/`GPSLongitude`.
- `category` values are arbitrary strings; `MetadataDisplay` groups tags by category for display
- Tags not present in the uploaded image are automatically omitted from display
- `metadata.json` at repo root contains app display metadata (name, description), not tag config

---

### Database Schema (PostgreSQL via Supabase)

Applied via Supabase migrations in `supabase/migrations/`.

```sql { .api }
-- Table: media_metadata
-- Stores extracted image metadata and perceptual hashes
CREATE TABLE media_metadata (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name   TEXT,
  file_type   TEXT,
  file_size   BIGINT,
  metadata    JSONB,   -- Full EXIF metadata as JSON
  phash       TEXT,    -- Perceptual hash hex string
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Function: hamming_distance
-- Calculates bit-level Hamming distance between two hex-encoded perceptual hashes
-- Used for finding similar/duplicate images
CREATE FUNCTION hamming_distance(hash1 TEXT, hash2 TEXT)
RETURNS INTEGER
LANGUAGE plpgsql;
```

**Note:** The database and `supabaseService.ts` are not yet integrated in the active application flow. The schema is defined and migrations are included, but client-side database access is not implemented (placeholder stub only).

---

### HTML Entry Point (`index.html`)

```html { .api }
<!--
  index.html loaded by Vite dev server and build process.
  CDN imports (for AI Studio compatibility):
-->

<!-- Tailwind CSS via CDN -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Uppy CSS styles -->
<link rel="stylesheet" href="https://releases.transloadit.com/uppy/v3.10.0/uppy.min.css">

<!-- Import map for ESM dependencies -->
<script type="importmap">
{
  "imports": {
    "react": "https://aistudiocdn.com/react@^19.2.0",
    "react-dom/": "https://aistudiocdn.com/react-dom@^19.2.0/",
    "react/": "https://aistudiocdn.com/react@^19.2.0/",
    "@google/genai": "https://aistudiocdn.com/@google/genai@^1.26.0",
    "uppy": "https://releases.transloadit.com/uppy/v3.10.0/uppy.min.mjs"
  }
}
</script>

<!-- React root mount point -->
<div id="root"></div>
<script type="module" src="/index.tsx"></script>
```

**Custom CSS in index.html** (Uppy dark theme overrides):
- `.uppy-Dashboard` - transparent background, no border
- `.uppy-Dashboard-inner` - `bg-gray-800` background, dashed border
- `.uppy-Dashboard-note` - gray text color
- `.uppy-Dashboard-poweredBy` - hidden

---

### Project Structure

```
/
├── App.tsx                         # Root application component
├── index.tsx                       # React DOM entry point
├── index.html                      # HTML template with CDN imports
├── vite.config.ts                  # Vite bundler configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # npm dependencies and scripts
├── exiftool_config.json            # EXIF tag configuration (served as /exiftool_config.json)
├── metadata.json                   # Alternative/similar EXIF config
├── components/
│   ├── UppyUploader.tsx            # Primary Uppy-based file upload
│   ├── MetadataDisplay.tsx         # Results display (metadata + story)
│   ├── ImageUploader.tsx           # Alternative native HTML5 uploader
│   └── Icons.tsx                   # SVG icon components
├── services/
│   ├── geminiService.ts            # Google Gemini AI integration
│   ├── mediaService.ts             # Perceptual hash generation (browser)
│   ├── configService.ts            # Config file loader with caching
│   ├── supabaseService.ts          # Supabase client stub (placeholder)
│   └── exiftoolService.ts          # ExifTool service stub (unused)
└── supabase/
    ├── config.toml                 # Supabase project configuration
    ├── functions/
    │   ├── process-upload/
    │   │   └── index.ts            # Multipart EXIF extraction endpoint
    │   └── extract-metadata/
    │       └── index.ts            # Raw binary EXIF extraction endpoint
    └── migrations/                 # PostgreSQL schema migrations
```

---

### Dependencies

```json { .api }
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "@google/genai": "^1.26.0",
    "uppy": "latest"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}
```

**Note:** The `blockhash` library is used in `mediaService.ts` (npm package name: `blockhash`; the GitHub repository is named `blockhash-js` but the npm package is `blockhash`). It does not appear in `package.json` — it may be resolved via CDN import map or installed manually: `npm install blockhash`. For Canvas ImageData-based usage (as in `mediaService.ts`), use `blockhashData(imageData, bits, method)` from the package (not `blockhash()` which uses XHR).
