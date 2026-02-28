# Image Metadata Storyteller

A React 19 + TypeScript single-page web application that extracts EXIF metadata from uploaded images and uses Google Gemini AI to generate creative narrative stories based on the hidden data within photos.

## Package Information

- **Package Name**: image-metadata-explorer-with-ai-analysis
- **Repository**: github.com/Raudbjorn/metadata-extractor
- **Package Type**: GitHub Application
- **Language**: TypeScript
- **Framework**: React 19
- **Build Tool**: Vite

## Setup

```bash
npm install

# Configure environment
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Start local Supabase (Edge Functions + PostgreSQL)
supabase start

# Start development server on port 3000
npm run dev

# Production build (output to dist/)
npm run build
```

## Core Imports

```typescript
// Main application entry (mount to DOM)
import App from './App';

// Services
import { analyzeMetadataWithGemini } from './services/geminiService';
import { generatePerceptualHash } from './services/mediaService';
import { getConfig } from './services/configService';

// Components
import UppyUploader from './components/UppyUploader';
import MetadataDisplay from './components/MetadataDisplay';
import ImageUploader from './components/ImageUploader'; // Alternative uploader
import { LoadingIcon, ResetIcon, ErrorIcon, LogoIcon, FingerprintIcon } from './components/Icons';
```

## Basic Usage

```typescript
// Typical App.tsx integration pattern
import { analyzeMetadataWithGemini } from './services/geminiService';
import { generatePerceptualHash } from './services/mediaService';
import { getConfig } from './services/configService';

// 1. Load config once on mount
const config = await getConfig();

// 2. After image upload via UppyUploader, generate hash + AI story
const hash = await generatePerceptualHash(previewUrl);
const story = await analyzeMetadataWithGemini(
  embeddedMetadata,   // EXIF from Edge Function
  providerMetadata,   // Optional: cloud provider info
  config,
  'jpg'
);
```

## Application Flow

1. App mounts → loads `/exiftool_config.json` via `getConfig()`
2. User uploads image via `UppyUploader` (Uppy drag-and-drop dashboard)
3. Uppy POSTs multipart to `http://localhost:54321/functions/v1/process-upload`
4. Edge Function extracts all EXIF tags with `exifr`, returns flat JSON
5. Client calls `generatePerceptualHash(previewUrl)` (browser Canvas API)
6. Client calls `analyzeMetadataWithGemini(embedded, provider, config, format)`
7. Gemini returns narrative story
8. `MetadataDisplay` renders: image preview, categorized metadata, hash, story
9. User clicks "Upload New" → `handleReset()` clears all state

## Architecture

- **Frontend**: React 19 SPA with Vite, dark theme (Tailwind CSS)
- **Upload**: Uppy library with XHRUpload to Supabase Edge Function
- **EXIF extraction**: Server-side via `exifr` in Deno Edge Function
- **Perceptual hashing**: Client-side `blockhash-js` (16-bit, 64-bit hash)
- **AI integration**: Google Gemini 2.5 Flash via `@google/genai` SDK
- **Backend**: Supabase Edge Functions (Deno runtime) + PostgreSQL

## Capabilities

### Services

Core TypeScript services for AI analysis, image hashing, and configuration loading.

```typescript { .api }
// Gemini AI story generation
export const analyzeMetadataWithGemini: (
  embeddedMetadata: Record<string, any>,
  providerMetadata: Record<string, any> | undefined,
  config: AppConfig | null,
  imageFormat: string
) => Promise<string>;

// Perceptual hash generation (browser-only)
export const generatePerceptualHash: (imageUrl: string) => Promise<string>;

// Configuration loader with singleton caching
export const getConfig: () => Promise<AppConfig>;
```

[Services](./services.md)

### React Components

UI components for image upload, metadata display, and icons.

```typescript { .api }
// Primary Uppy-based uploader (default export)
declare const UppyUploader: React.FC<{
  onUploadSuccess: (result: { file: any; metadata: any }) => void;
}>;

// Metadata and AI story display (default export)
declare const MetadataDisplay: React.FC<{
  metadata: { embedded: Record<string, any>; provider?: Record<string, any>; perceptualHash?: string };
  analysis: string;
  isLoading: boolean;
  error: string;
  config: AppConfig | null;
  fileDetails: { previewUrl: string; name: string; type: string; size: number };
  onReset: () => void;
}>;

// Alternative native HTML5 uploader - no Uppy dependency (default export)
declare const ImageUploader: React.FC<{
  onUploadSuccess: (result: { file: File & { preview?: string }; metadata: any }) => void;
  endpoint?: string; // default: 'http://localhost:54321/functions/v1/process-upload'
}>;
```

[Components](./components.md)

### Backend Edge Functions

Serverless Deno functions for EXIF metadata extraction.

```
POST /functions/v1/process-upload    # Multipart (Uppy) → flat EXIF JSON
POST /functions/v1/extract-metadata  # Raw binary → { metadata: {...} }
```

[Backend Edge Functions](./backend.md)

### Setup & Configuration

Environment setup, configuration files, database schema, and deployment.

[Setup & Configuration](./setup.md)

## Types

```typescript { .api }
interface AppConfig {
  tags: TagConfig[];
}

interface TagConfig {
  key: string;      // EXIF tag identifier (e.g., "Make", "latitude", "FNumber")
  label: string;    // Human-readable display name (e.g., "Camera Make", "Latitude")
  category: string; // Grouping (e.g., "device", "gps", "camera_settings", "time")
}
```
