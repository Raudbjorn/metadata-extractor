# Image File Upload Component

Implement a React component that provides a drag-and-drop image upload interface with the following requirements:

## Capabilities { .capabilities }

### Single-file image upload with type and size restrictions

The component must accept only image files (JPEG, PNG, TIFF, and WEBP formats) and enforce a maximum file size of 10 megabytes. Only one file may be uploaded at a time, and the upload should begin automatically as soon as a file is added.

- Upload begins automatically without requiring the user to click a separate button [@test](./tests/auto-proceed.test.ts)
- Adding a second file when one is already selected is rejected [@test](./tests/max-files.test.ts)
- Files larger than 10MB are rejected [@test](./tests/max-size.test.ts)
- Non-image file types (e.g., PDF, text) are rejected [@test](./tests/file-types.test.ts)

### Inline dashboard UI embedded in a container element

The upload interface must be rendered inline (not as a modal) inside a provided container DOM element, using a dark visual theme. A user-facing note must be displayed to inform users of the accepted formats and size limit.

- Dashboard renders inline within a specified container element [@test](./tests/inline-dashboard.test.ts)
- Dashboard uses dark theme [@test](./tests/dark-theme.test.ts)

### XHR upload to a configurable endpoint

Files must be sent via XHR to a server endpoint, using the field name `files[]`.

- Files are uploaded to the correct server endpoint with field name `files[]` [@test](./tests/xhr-upload.test.ts)

## Implementation { .implementation }

[@generates](./src/UppyUploader.tsx)

## Dependencies { .dependencies }

### image-metadata-explorer-with-ai-analysis 0.0.0 { .dependency }

A React application for image metadata extraction and AI-powered story generation. Provides the UppyUploader component pattern using Uppy with Dashboard and XHRUpload plugins.
[@satisfied-by](image-metadata-explorer-with-ai-analysis)
