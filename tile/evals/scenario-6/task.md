# Image Metadata Prompt Formatter

Implement a function that formats EXIF metadata and optional cloud provider metadata into a structured human-readable string suitable for inclusion in an AI prompt.

## Capabilities { .capabilities }

### Format image format header

The output string must begin with the image format in uppercase on its own line, in the pattern `Image Format: {FORMAT}`.

- Output starts with "Image Format: JPG" for imageFormat "jpg" [@test](./tests/format-header.test.ts)
- Image format is uppercased regardless of input case [@test](./tests/format-uppercase.test.ts)

### Include provider metadata section when present

When optional cloud provider metadata is provided, a "Source Information" section must be included. Only the fields `name` (as "Original Filename"), `host` (as "Source Service"), `description` (as "Description"), and `id` (as "Source ID") should be extracted if present. Fields absent from the provider object must be omitted.

- Provider section appears with label "Source Information (from cloud provider):" [@test](./tests/provider-section-label.test.ts)
- Only the four recognized provider fields are included [@test](./tests/provider-field-selection.test.ts)
- Absent provider fields are omitted, not shown as empty [@test](./tests/provider-absent-fields.test.ts)

### Include embedded EXIF tags using config

The embedded metadata section must iterate over the config's tags array and include only those tags whose key exists in the embedded metadata object. The label from the config is used as the display name. Array values must be joined with ", " for display. If no tags match, a "No relevant embedded metadata" message is shown.

- Shows "Embedded File Metadata:" section header [@test](./tests/embedded-header.test.ts)
- Uses tag.label as the display name for each field [@test](./tests/tag-label-display.test.ts)
- Array values in embedded metadata are joined with ", " [@test](./tests/array-join.test.ts)
- Shows fallback message when no tags match [@test](./tests/no-metadata-fallback.test.ts)

## Implementation { .implementation }

[@generates](./src/geminiService.ts)

## Dependencies { .dependencies }

### image-metadata-explorer-with-ai-analysis 0.0.0 { .dependency }

A React application for image metadata extraction and AI-powered story generation. Implements the formatMetadataForPrompt function that formats EXIF and provider metadata into a structured string for the Gemini AI prompt.
[@satisfied-by](image-metadata-explorer-with-ai-analysis)
