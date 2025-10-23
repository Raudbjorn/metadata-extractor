# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Image Metadata Storyteller - A React application that extracts EXIF metadata from uploaded images and uses Google's Gemini AI to generate creative narrative stories based on that metadata. The app integrates Uppy for file uploads, Supabase Edge Functions for server-side metadata extraction, and client-side perceptual hashing.

## Development Commands

### Frontend Development
- `npm install` - Install dependencies
- `npm run dev` - Start Vite dev server on port 3000 (http://localhost:3000)
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build

### Supabase Local Development
- `supabase start` - Start local Supabase instance (requires Docker)
- `supabase functions serve` - Serve Edge Functions locally
- `supabase db reset` - Reset local database and apply migrations
- `supabase migration new <name>` - Create new migration file (use camelCase for description)
- `supabase functions deploy <function-name>` - Deploy specific Edge Function

## Architecture

### Frontend (React + Vite + TypeScript)
- **App.tsx**: Main orchestrator managing upload flow, metadata extraction, AI analysis state
- **components/UppyUploader.tsx**: Handles file uploads via Uppy, posts to Supabase Edge Function
- **components/MetadataDisplay.tsx**: Displays extracted metadata and AI-generated story
- **components/Icons.tsx**: SVG icon components

### Services Layer
- **services/geminiService.ts**: Integrates Google Gemini AI for creative story generation
- **services/mediaService.ts**: Client-side perceptual hash generation using blockhash-js
- **services/configService.ts**: Loads metadata tag configuration from metadata.json
- **services/supabaseService.ts**: Placeholder for future Supabase client integration
- **services/exiftoolService.ts**: Placeholder (not currently used)

### Backend (Supabase Edge Functions - Deno)
- **supabase/functions/process-upload/index.ts**: Receives multipart/form-data uploads from Uppy, extracts EXIF using exifr library, returns metadata JSON
- **supabase/functions/extract-metadata/index.ts**: Alternative endpoint accepting raw image buffer for metadata extraction

### Database Schema
- **media_metadata** table: Stores file metadata, EXIF data, perceptual hashes
- **hamming_distance()** function: SQL function for comparing perceptual hashes (similarity detection)
- Migrations follow pattern: `<yyyyMMddhhmmss>_<camelCaseDescription>.sql`

## Key Integration Points

### Upload Flow
1. User selects image in UppyUploader component
2. Uppy auto-posts to `http://localhost:54321/functions/v1/process-upload` (local dev)
3. Edge Function extracts EXIF metadata using exifr
4. Frontend receives metadata and generates perceptual hash client-side
5. Gemini analyzes metadata and creates narrative story
6. MetadataDisplay renders results

### Environment Configuration
- **GEMINI_API_KEY**: Required in `.env.local` for AI story generation
- Vite config maps `GEMINI_API_KEY` → `process.env.API_KEY` at build time
- Supabase Edge Functions use default local URL: `http://localhost:54321`

### Metadata Configuration
- **metadata.json**: Defines which EXIF tags to extract and display
- Structure: `{ tags: [{ key, label, category }] }`
- Used by geminiService to format prompts and MetadataDisplay for rendering

## Important Patterns

### Service Initialization
- Gemini service uses `process.env.API_KEY!` with non-null assertion
- Config service loads metadata.json asynchronously at app startup
- Error handling displays user-friendly messages in UI

### Edge Function CORS
All Edge Functions include CORS headers for cross-origin requests:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### Perceptual Hashing
- Uses blockhash-js with 16-bit precision for image fingerprinting
- Generated client-side from image preview URL
- Intended for future duplicate detection via hamming distance

## Notes
- Supabase client integration is stubbed but not implemented
- Database migrations exist but may not be actively used in current flow
- App designed for local Supabase development (requires Docker + Supabase CLI)
