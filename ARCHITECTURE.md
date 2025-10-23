# Architecture Documentation

This document provides comprehensive flowcharts and diagrams for each service in the Image Metadata Storyteller application.

## Table of Contents

1. [Overall Application Flow](#overall-application-flow)
2. [Service Architecture](#service-architecture)
   - [Gemini Service](#gemini-service)
   - [Media Service](#media-service)
   - [Config Service](#config-service)
   - [Process-Upload Edge Function](#process-upload-edge-function)
   - [Extract-Metadata Edge Function](#extract-metadata-edge-function)
3. [Data Flow Diagrams](#data-flow-diagrams)

---

## Overall Application Flow

```mermaid
sequenceDiagram
    participant User
    participant UppyUploader
    participant EdgeFunction as Process-Upload<br/>(Edge Function)
    participant MediaService
    participant ConfigService
    participant GeminiService
    participant MetadataDisplay

    User->>UppyUploader: Upload Image
    UppyUploader->>EdgeFunction: POST multipart/form-data
    EdgeFunction->>EdgeFunction: Extract EXIF with exifr
    EdgeFunction-->>UppyUploader: Return metadata JSON

    UppyUploader->>ConfigService: getConfig()
    ConfigService-->>UppyUploader: Return tag configuration

    UppyUploader->>MediaService: generatePerceptualHash(imageUrl)
    MediaService->>MediaService: Load image to canvas
    MediaService->>MediaService: Generate blockhash
    MediaService-->>UppyUploader: Return pHash string

    UppyUploader->>GeminiService: analyzeMetadataWithGemini(metadata, config)
    GeminiService->>GeminiService: Format metadata for prompt
    GeminiService->>GeminiService: Call Gemini API
    GeminiService-->>UppyUploader: Return AI-generated story

    UppyUploader->>MetadataDisplay: Display results
    MetadataDisplay->>User: Show metadata & story
```

---

## Service Architecture

### Gemini Service

The Gemini Service handles AI-powered story generation from image metadata.

```mermaid
flowchart TD
    A[Start: analyzeMetadataWithGemini] --> B{Config available?}
    B -->|No| C[Throw Error:<br/>Config not available]
    B -->|Yes| D[formatMetadataForPrompt]

    D --> E[Build formatted string:<br/>Image Format]
    E --> F{Provider metadata<br/>exists?}
    F -->|Yes| G[Add provider info:<br/>filename, host, etc]
    F -->|No| H[Skip provider section]
    G --> H

    H --> I[Add embedded metadata<br/>section]
    I --> J[Loop through config.tags]
    J --> K{Tag exists in<br/>embedded metadata?}
    K -->|Yes| L[Add tag to output:<br/>label: value]
    K -->|No| M[Skip tag]
    L --> N{More tags?}
    M --> N
    N -->|Yes| J
    N -->|No| O{Any tags found?}

    O -->|No| P[Add 'No metadata found'<br/>message]
    O -->|Yes| Q[Continue]
    P --> Q

    Q --> R[Create AI prompt:<br/>Expert photo analyst]
    R --> S[Call Gemini API:<br/>gemini-2.5-flash]
    S --> T{API Success?}
    T -->|No| U[Throw Error:<br/>AI service unavailable]
    T -->|Yes| V[Return generated story]

    V --> W[End: Return story string]
    C --> X[End: Error thrown]
    U --> X

    style A fill:#e1f5ff
    style W fill:#c8e6c9
    style X fill:#ffcdd2
    style S fill:#fff9c4
```

#### Exported Functions

- **`analyzeMetadataWithGemini(embeddedMetadata, providerMetadata, config, imageFormat)`**
  - **Input**: EXIF data, provider data, tag config, file format
  - **Output**: Promise<string> - AI-generated narrative story
  - **Purpose**: Generate creative stories from image metadata using Gemini AI

---

### Media Service

The Media Service handles client-side image processing and perceptual hash generation.

```mermaid
flowchart TD
    A[Start: generatePerceptualHash] --> B[getImageData helper]

    B --> C[Create new Image object]
    C --> D[Set crossOrigin = 'Anonymous']
    D --> E[Attach onload handler]
    E --> F[Attach onerror handler]
    F --> G[Set image.src = imageUrl]

    G --> H{Image loads<br/>successfully?}
    H -->|No| I[Reject promise:<br/>Image load error]
    H -->|Yes| J[Create canvas element]

    J --> K[Set canvas dimensions<br/>to image size]
    K --> L[Get 2D context]
    L --> M{Context available?}
    M -->|No| N[Reject promise:<br/>Canvas context error]
    M -->|Yes| O[Draw image to canvas]

    O --> P[Extract ImageData:<br/>RGBA pixel array]
    P --> Q[Resolve promise with ImageData]

    Q --> R[Call blockhash algorithm]
    R --> S[Generate 16-bit hash<br/>16x16 grid, method 1]
    S --> T{Hash successful?}
    T -->|No| U[Log error]
    U --> V[Return empty string]
    T -->|Yes| W[Return hash as hex string]

    V --> X[End: Error handled]
    W --> Y[End: Return pHash]
    I --> X
    N --> X

    style A fill:#e1f5ff
    style Y fill:#c8e6c9
    style X fill:#ffcdd2
    style R fill:#fff9c4
    style S fill:#fff9c4
```

#### Exported Functions

- **`generatePerceptualHash(imageUrl)`**
  - **Input**: Image URL (blob, data, or HTTP URL)
  - **Output**: Promise<string> - Hexadecimal hash string
  - **Purpose**: Generate visual fingerprint for duplicate detection

---

### Config Service

The Config Service manages loading and caching of metadata tag configuration.

```mermaid
flowchart TD
    A[Start: getConfig] --> B{configPromise<br/>already cached?}

    B -->|Yes| C[Return cached promise]
    B -->|No| D[Create new fetch promise]

    D --> E[Fetch /exiftool_config.json]
    E --> F{HTTP response OK?}
    F -->|No| G[Throw Error:<br/>HTTP status error]
    F -->|Yes| H[Parse JSON response]

    H --> I{JSON parse<br/>successful?}
    I -->|No| J[Log error to console]
    J --> K[Clear configPromise cache:<br/>set to null]
    K --> L[Throw error]

    I -->|Yes| M[Store promise in<br/>configPromise variable]
    M --> N[Return AppConfig object]

    N --> O[End: Return config]
    C --> O
    L --> P[End: Error thrown]
    G --> P

    style A fill:#e1f5ff
    style O fill:#c8e6c9
    style P fill:#ffcdd2
    style M fill:#fff9c4
```

#### Exported Functions

- **`getConfig()`**
  - **Input**: None
  - **Output**: Promise<AppConfig> - Tag configuration object
  - **Purpose**: Load and cache EXIF tag definitions

#### Configuration Structure

```typescript
interface AppConfig {
  tags: Array<{
    key: string;      // EXIF tag identifier (e.g., "Make")
    label: string;    // Display name (e.g., "Camera Make")
    category: string; // Grouping (e.g., "camera", "location")
  }>;
}
```

---

### Process-Upload Edge Function

The main Edge Function for handling Uppy uploads and extracting metadata.

```mermaid
flowchart TD
    A[Start: HTTP Request] --> B{Request method?}

    B -->|OPTIONS| C[Handle CORS preflight]
    C --> D[Return 200 OK<br/>with CORS headers]

    B -->|POST| E[Parse FormData from body]
    E --> F{Field 'files[]'<br/>exists?}

    F -->|No| G[Throw Error:<br/>File not found in form data]
    F -->|Yes| H{File is valid<br/>not string?}
    H -->|No| G

    H -->|Yes| I[Convert file to ArrayBuffer]
    I --> J[Call exifr.parse buffer, true]

    J --> K{EXIF extraction<br/>successful?}
    K -->|No| L[Catch error]
    L --> M[Log error to console]
    M --> N[Return 500 error:<br/>Failed to process file]

    K -->|Yes| O[Return 200 OK:<br/>JSON metadata]

    D --> P[End: Response sent]
    O --> P
    N --> P
    G --> L

    style A fill:#e1f5ff
    style P fill:#c8e6c9
    style N fill:#ffcdd2
    style J fill:#fff9c4
```

#### Request/Response

**Request:**
```http
POST /functions/v1/process-upload
Content-Type: multipart/form-data; boundary=---...

------...
Content-Disposition: form-data; name="files[]"; filename="photo.jpg"
Content-Type: image/jpeg

<binary image data>
------...--
```

**Response (Success):**
```json
{
  "Make": "Canon",
  "Model": "EOS 5D Mark IV",
  "DateTimeOriginal": "2024:03:15 14:30:22",
  "GPSLatitude": 40.7128,
  "GPSLongitude": -74.0060,
  "ExposureTime": 0.008,
  "FNumber": 2.8,
  "ISO": 400
}
```

---

### Extract-Metadata Edge Function

Alternative Edge Function for raw binary uploads (not currently used).

```mermaid
flowchart TD
    A[Start: HTTP Request] --> B{Request method?}

    B -->|OPTIONS| C[Handle CORS preflight]
    C --> D[Return 200 OK<br/>with CORS headers]

    B -->|POST| E{Request body<br/>exists?}
    E -->|No| F[Throw Error:<br/>Request body is empty]

    E -->|Yes| G[Read body as ArrayBuffer]
    G --> H[Call exifr.parse buffer, true]

    H --> I{EXIF extraction<br/>successful?}
    I -->|No| J[Catch error]
    J --> K[Log error to console]
    K --> L[Return 500 error:<br/>error.message]

    I -->|Yes| M[Wrap metadata in object:<br/>metadata: metadata]
    M --> N[Return 200 OK:<br/>JSON response]

    D --> O[End: Response sent]
    N --> O
    L --> O
    F --> J

    style A fill:#e1f5ff
    style O fill:#c8e6c9
    style L fill:#ffcdd2
    style H fill:#fff9c4
```

#### Request/Response

**Request:**
```http
POST /functions/v1/extract-metadata
Content-Type: application/octet-stream

<raw binary image data>
```

**Response (Success):**
```json
{
  "metadata": {
    "Make": "Canon",
    "Model": "EOS 5D Mark IV",
    ...
  }
}
```

---

## Data Flow Diagrams

### Component Interaction

```mermaid
graph TB
    subgraph Frontend["Frontend (React)"]
        App[App.tsx]
        Uppy[UppyUploader.tsx]
        Display[MetadataDisplay.tsx]
    end

    subgraph Services["Services Layer"]
        Config[configService.ts]
        Media[mediaService.ts]
        Gemini[geminiService.ts]
        Supabase[supabaseService.ts<br/>PLACEHOLDER]
    end

    subgraph Backend["Supabase Edge Functions (Deno)"]
        ProcessUpload[process-upload]
        ExtractMeta[extract-metadata<br/>NOT USED]
    end

    subgraph External["External APIs"]
        GeminiAPI[Google Gemini API]
        ExifTool[exiftool_config.json]
    end

    App --> Uppy
    Uppy --> ProcessUpload
    Uppy --> Media
    Uppy --> Config
    Uppy --> Gemini

    Config --> ExifTool
    Gemini --> GeminiAPI

    Uppy --> Display
    Display --> App

    style Supabase fill:#ffebee
    style ExtractMeta fill:#ffebee
    style ProcessUpload fill:#e3f2fd
    style Gemini fill:#e3f2fd
    style Media fill:#e3f2fd
    style Config fill:#e3f2fd
```

### State Management Flow

```mermaid
stateDiagram-v2
    [*] --> Idle: App Loads

    Idle --> LoadingConfig: useEffect
    LoadingConfig --> ConfigLoaded: Config fetched
    LoadingConfig --> ConfigError: Fetch failed

    ConfigLoaded --> AwaitingUpload: Ready for user
    ConfigError --> AwaitingUpload: Show warning

    AwaitingUpload --> Uploading: User selects image
    Uploading --> ExtractingMetadata: Uppy auto-uploads

    ExtractingMetadata --> GeneratingHash: Metadata received
    GeneratingHash --> CallingAI: Hash generated
    CallingAI --> DisplayingResults: Story received

    ExtractingMetadata --> ErrorState: Upload failed
    GeneratingHash --> ErrorState: Hash failed
    CallingAI --> ErrorState: AI failed

    DisplayingResults --> AwaitingUpload: User resets
    ErrorState --> AwaitingUpload: User resets

    DisplayingResults --> [*]
```

---

## Database Schema

```mermaid
erDiagram
    MEDIA_METADATA {
        uuid id PK
        text file_name
        text file_type
        bigint file_size
        jsonb metadata
        text phash
        timestamp created_at
    }

    MEDIA_METADATA ||--o{ SIMILAR_IMAGES : "finds via hamming_distance"

    SIMILAR_IMAGES {
        uuid source_id FK
        uuid match_id FK
        int hamming_distance
    }
```

### SQL Functions

```sql
-- Calculate Hamming distance between two perceptual hashes
CREATE FUNCTION hamming_distance(hash1 TEXT, hash2 TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
-- Implementation counts differing bits between two hex hashes
$$;
```

---

## Technology Stack

```mermaid
mindmap
  root((Image Metadata<br/>Storyteller))
    Frontend
      React 19
      TypeScript
      Vite
      Uppy
    Services
      Gemini AI
      blockhash-js
      Fetch API
    Backend
      Supabase Edge Functions
      Deno Runtime
      exifr
    Database
      PostgreSQL
      JSONB
      Custom Functions
    DevOps
      Docker
      Supabase CLI
      Git
```

---

## Future Enhancements

```mermaid
graph LR
    A[Current State] --> B[Supabase Client Integration]
    B --> C[Metadata Persistence]
    C --> D[Duplicate Detection]
    D --> E[User Authentication]
    E --> F[Analysis History]
    F --> G[Batch Processing]
    G --> H[Advanced Search]

    style A fill:#e3f2fd
    style H fill:#c8e6c9
```

### Planned Features

1. **Database Integration**: Enable `supabaseService.ts` to persist metadata
2. **Duplicate Detection**: Use perceptual hashes with Hamming distance
3. **User Accounts**: Track upload history per user
4. **Batch Upload**: Process multiple images simultaneously
5. **Advanced Filters**: Search by location, date, camera model
6. **Export Options**: Download metadata as CSV/JSON
7. **Realtime Updates**: WebSocket notifications for processing status
