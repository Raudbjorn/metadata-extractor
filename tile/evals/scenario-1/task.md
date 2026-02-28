# Image Upload Event Handler

Implement the event handling logic for an Uppy-based image uploader component that processes both successful uploads and errors.

## Capabilities { .capabilities }

### Success event extracts file and metadata from response

When an upload succeeds, the handler must receive both the file object and the server's response body. The file object and response body (the extracted metadata) must be passed together to a callback provided by the parent component.

- On upload-success, the callback receives `{ file, metadata: response.body }` [@test](./tests/success-callback.test.ts)
- The handler only calls the callback when both file and response.body are truthy [@test](./tests/success-guard.test.ts)

### Error event extracts message and shows user notification

When an upload fails, the error message must be extracted from the response body's `error` field if available, falling back to the native error message. The extracted message must be displayed to the user via the Uppy instance's notification mechanism with an error severity level and a 5-second display duration.

- Error message from response.body.error is preferred over error.message [@test](./tests/error-message-priority.test.ts)
- uppy.info() is called with the error message, 'error' type, and 5000ms duration [@test](./tests/uppy-info-call.test.ts)

## Implementation { .implementation }

[@generates](./src/uploadEventHandlers.ts)

## Dependencies { .dependencies }

### image-metadata-explorer-with-ai-analysis 0.0.0 { .dependency }

A React application for image metadata extraction and AI-powered story generation. Implements Uppy event handling patterns for upload-success and upload-error events with response body extraction and notification display.
[@satisfied-by](image-metadata-explorer-with-ai-analysis)
