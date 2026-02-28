# Client-side Image Perceptual Hash Generator

Implement a browser-based service that generates a perceptual hash (visual fingerprint) for an image given its URL, suitable for duplicate detection.

## Capabilities { .capabilities }

### Load image pixel data via HTML5 Canvas

Given an image URL, the service must load the image using the browser's Image API, draw it onto an offscreen canvas, and extract the raw RGBA pixel data as an ImageData object. The image must be configured to allow cross-origin loading.

- Image is loaded with crossOrigin set to "Anonymous" [@test](./tests/crossorigin.test.ts)
- Canvas dimensions match the loaded image's natural dimensions [@test](./tests/canvas-dimensions.test.ts)
- getImageData() is called to extract pixel data from the full canvas area [@test](./tests/get-image-data.test.ts)
- Rejects with an error if the canvas context cannot be obtained [@test](./tests/canvas-context-error.test.ts)

### Generate blockhash with 16-bit precision

The extracted ImageData must be passed to the blockhash algorithm with 16-bit precision (producing a 64-bit hash) using method 1. The result must be returned as a hexadecimal string.

- blockhash is called with bits=16 and method=1 [@test](./tests/blockhash-args.test.ts)
- Returns the hexadecimal hash string from blockhash [@test](./tests/hash-return.test.ts)

### Graceful error handling returning empty string

If any step fails (image load error, canvas error, hash error), the function must catch the error, log it to the console, and return an empty string rather than throwing.

- Returns an empty string on image load failure [@test](./tests/error-empty-string.test.ts)

## Implementation { .implementation }

[@generates](./src/mediaService.ts)

## Dependencies { .dependencies }

### image-metadata-explorer-with-ai-analysis 0.0.0 { .dependency }

A React application for image metadata extraction and AI-powered story generation. Implements client-side perceptual hash generation using blockhash-js with HTML5 Canvas pixel extraction.
[@satisfied-by](image-metadata-explorer-with-ai-analysis)
