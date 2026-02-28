# React Components

React functional components for image upload, metadata display, and UI icons.

## Capabilities

### UppyUploader (`components/UppyUploader.tsx`)

Primary image upload interface using Uppy library. Provides a polished drag-and-drop dashboard with automatic upload on file selection.

```typescript { .api }
interface UppyUploaderProps {
  /**
   * Callback invoked when image upload succeeds and EXIF metadata is received from Edge Function.
   * @param result.file - Uppy file object with: data (File), name, type, size, extension,
   *   preview (blob URL), and other Uppy metadata fields.
   * @param result.metadata - EXIF metadata JSON returned by the Edge Function (flat object
   *   with all EXIF tag key-value pairs).
   */
  onUploadSuccess: (result: { file: any, metadata: any }) => void;
}

export default UppyUploader: React.FC<UppyUploaderProps>;
```

**Usage:**

```tsx
import UppyUploader from './components/UppyUploader';

function App() {
  const handleUploadSuccess = ({ file, metadata }) => {
    console.log('File name:', file.name);
    console.log('File type:', file.type);
    console.log('Preview URL:', file.preview);
    console.log('EXIF data:', metadata);
    // metadata is flat EXIF object: { Make: "Canon", Model: "...", GPSLatitude: 40.7, ... }
  };

  return <UppyUploader onUploadSuccess={handleUploadSuccess} />;
}
```

**Uppy configuration:**
- `autoProceed: true` - uploads immediately on file selection (no confirm step)
- `maxNumberOfFiles: 1`
- `allowedFileTypes: ['image/jpeg', 'image/png', 'image/tiff', 'image/webp']`
- `maxFileSize: 10 * 1024 * 1024` (10MB)
- Upload endpoint: `http://localhost:54321/functions/v1/process-upload`
- XHRUpload field name: `files[]`

**Dashboard configuration:**
- `inline: true` (embedded in page, not modal)
- `theme: 'dark'`
- `width: '100%'`, `height: 400`
- `proudlyDisplayPoweredByUppy: false`
- Note text: "Images only (JPG, PNG, TIFF, WEBP), up to 10MB"

**Events:**
- `upload-success`: Calls `onUploadSuccess({ file, metadata: response.body })`
- `upload-error`: Logs error, shows Uppy toast notification with error message

**Lifecycle:** Uppy instance created with `useMemo`, Dashboard attached in `useEffect`. Instance closed (`uppy.close()`) on component unmount.

---

### MetadataDisplay (`components/MetadataDisplay.tsx`)

Displays uploaded image preview, categorized EXIF metadata, perceptual hash fingerprint, and AI-generated story.

```typescript { .api }
interface MetadataDisplayProps {
  /** EXIF metadata from Edge Function + computed perceptual hash */
  metadata: {
    embedded: Record<string, any>;  // Flat EXIF key-value pairs
    provider?: Record<string, any>; // Optional cloud provider metadata
    perceptualHash?: string;        // Hex perceptual hash (optional)
  };
  /** AI-generated narrative story from Gemini (empty string while loading) */
  analysis: string;
  /** True while Gemini AI analysis is in progress */
  isLoading: boolean;
  /** Error message to display (empty string if no error) */
  error: string;
  /** AppConfig for categorized metadata display; null shows "Configuration not available" */
  config: AppConfig | null;
  /** Uploaded file details for header and preview */
  fileDetails: {
    previewUrl: string; // Object URL or data URL for <img> src
    name: string;       // Display filename
    type: string;       // MIME type string (e.g., "image/jpeg")
    size: number;       // File size in bytes
  };
  /** Callback to reset application state and allow new upload */
  onReset: () => void;
}

export default MetadataDisplay: React.FC<MetadataDisplayProps>;
```

**Usage:**

```tsx
import MetadataDisplay from './components/MetadataDisplay';

<MetadataDisplay
  fileDetails={{
    previewUrl: URL.createObjectURL(file),
    name: file.name,
    type: file.type,
    size: file.size,
  }}
  metadata={{
    embedded: { Make: "Canon", Model: "EOS 5D", GPSLatitude: 40.7 },
    perceptualHash: "89a7c4d3e1f2b5a6...",
  }}
  analysis="On a crisp afternoon..."
  isLoading={false}
  error=""
  config={appConfig}
  onReset={() => setFileDetails(null)}
/>
```

**Layout:**
- Header: filename + file type/size + "Upload New" reset button
- 3-column grid (1 col image preview, 2 col metadata area):
  - Image preview (`<img>` with previewUrl)
  - "AI Storyteller Analysis" section: loading spinner / error / story text
  - "Image Fingerprint" section: hex hash + description (only if `perceptualHash` present)
  - "Embedded Metadata" section: EXIF data grouped by `config.tags[].category`

**Metadata rendering:**
- Groups tags by `category` from `config.tags`
- Only shows tags that exist in `metadata.embedded`
- Array values displayed joined with `, `
- Shows "No relevant embedded metadata found" if no tags match

**Internal sub-components (not exported):**
- `MetadataSection` - titled section wrapper
- `MetadataItem` - label-value pair row

---

### ImageUploader (`components/ImageUploader.tsx`)

Alternative lightweight image uploader using native HTML5 file input and fetch API. **Not used by main App** - available as a dependency-free alternative to `UppyUploader`.

```typescript { .api }
interface ImageUploaderProps {
  /**
   * Callback invoked on successful upload and metadata extraction.
   * @param result.file - File object enhanced with optional preview URL
   * @param result.metadata - EXIF metadata JSON from Edge Function
   */
  onUploadSuccess: (result: { file: File & { preview?: string }, metadata: any }) => void;
  /**
   * Upload endpoint URL.
   * @default 'http://localhost:54321/functions/v1/process-upload'
   */
  endpoint?: string;
}

export default ImageUploader: React.FC<ImageUploaderProps>;
```

**Usage:**

```tsx
import ImageUploader from './components/ImageUploader';

// Basic usage (uses default Supabase local endpoint)
<ImageUploader onUploadSuccess={({ file, metadata }) => {
  console.log('Uploaded:', file.name);
  console.log('Preview:', file.preview); // blob URL
  console.log('EXIF:', metadata);
}} />

// With custom endpoint (production)
<ImageUploader
  endpoint="https://your-project.supabase.co/functions/v1/process-upload"
  onUploadSuccess={handleSuccess}
/>
```

**Features:**
- Drag-and-drop: visual feedback (border color, scale) when dragging over
- Click to open native file picker
- Image preview shown after selection
- Progress bar (simulated: 0% → 30% on start, 70% after request, 100% on success)
- File validation: allowed types `image/jpeg`, `image/png`, `image/tiff`, `image/webp`; max 10MB
- Error display: styled red box with message
- FormData field name: `files[]` (matches Uppy default, compatible with `process-upload`)
- On success: enhances File object with `preview` property (blob URL)

**State exposed via UI (not via props):**
- Upload in progress: pointer-events disabled, opacity 60%
- Drag active: border changes to cyan, background tint, scale up
- Error: red message box below drop zone

---

### Icons (`components/Icons.tsx`)

SVG icon components based on Heroicons. All accept standard `React.SVGProps<SVGSVGElement>` for className, style, width, height, etc.

```typescript { .api }
/** Animated loading spinner (circle + arc) */
export const LoadingIcon: React.FC<React.SVGProps<SVGSVGElement>>;

/** Arrow-path/refresh icon for reset actions */
export const ResetIcon: React.FC<React.SVGProps<SVGSVGElement>>;

/** Exclamation triangle for error states */
export const ErrorIcon: React.FC<React.SVGProps<SVGSVGElement>>;

/** Book-open icon used as application logo */
export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>>;

/** Fingerprint icon for perceptual hash display */
export const FingerprintIcon: React.FC<React.SVGProps<SVGSVGElement>>;
```

**Usage:**

```tsx
import { LoadingIcon, ResetIcon, ErrorIcon, LogoIcon, FingerprintIcon } from './components/Icons';

// Apply Tailwind classes directly
<LoadingIcon className="h-8 w-8 animate-spin text-cyan-400" />
<ResetIcon className="h-5 w-5" />
<ErrorIcon className="h-5 w-5 text-red-400" />
<LogoIcon className="h-10 w-10 text-cyan-400" />
<FingerprintIcon className="h-8 w-8 text-gray-400" />
```

---

### App (`App.tsx`)

Root application component that orchestrates the full upload → metadata → hash → AI story flow.

```typescript { .api }
/** Default export - root React component, no props required */
export default App: React.FC;
```

**Usage:**

```tsx
// index.tsx - application entry point
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element to mount to");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**State managed internally:**

```typescript { .api }
interface FileDetails {
  previewUrl: string;  // Object URL or blob URL for image preview
  name: string;        // Original filename
  type: string;        // MIME type (e.g., "image/jpeg")
  size: number;        // File size in bytes
}

interface Metadata {
  embedded: Record<string, any>;  // Flat EXIF key-value pairs from Edge Function
  provider?: Record<string, any>; // Optional cloud provider metadata
  perceptualHash?: string;        // Hex string from generatePerceptualHash()
}
```

**Handler: `handleUploadSuccess({ file, metadata })`**

Called by `UppyUploader.onUploadSuccess`:
1. Extracts file details (previewUrl via `file.preview || URL.createObjectURL(file.data)`)
2. Sets loading state
3. Calls `generatePerceptualHash(previewUrl)`
4. Calls `analyzeMetadataWithGemini(embedded, provider, appConfig, imageFormat)`
5. Updates state with story; on error: sets error message

**Handler: `handleReset()`**

Resets all state to initial:
- `fileDetails = null`
- `metadata = null`
- `analysis = ""`
- `error = ""`
- `isLoading = false`

**UI layout:**
- Full-page dark background (`bg-gray-900`)
- Header: `LogoIcon` + app title + description
- Main card: `UppyUploader` (no file) or `MetadataDisplay` (file uploaded)
- Footer: "Powered by Gemini, Uppy, and Supabase."
