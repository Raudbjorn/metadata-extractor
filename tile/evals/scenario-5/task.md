# AI-Powered Image Metadata Story Generator

Implement an async function that takes image metadata and an application configuration, then calls the Google Gemini API to generate a creative narrative story based on the metadata.

## Capabilities { .capabilities }

### Initialize Google GenAI client with API key

The Google GenAI client must be initialized at module level using an API key from environment variables. The client must be created once and reused for all calls.

- Client is initialized with `new GoogleGenAI({ apiKey: process.env.API_KEY })` at module scope [@test](./tests/client-init.test.ts)

### Validate config before making API call

The function must accept an optional config parameter. If the config is null or undefined, the function must throw an error indicating the configuration is unavailable rather than proceeding with the API call.

- Throws an error when config is null [@test](./tests/null-config-throws.test.ts)

### Generate content using gemini-2.5-flash model

The function must call ai.models.generateContent() with the model name 'gemini-2.5-flash', the formatted metadata as the contents string, and generation configuration including temperature of 0.8 and topP of 0.95. The function must return the response's text property.

- Uses model 'gemini-2.5-flash' [@test](./tests/model-name.test.ts)
- Sets temperature to 0.8 and topP to 0.95 in the config [@test](./tests/generation-config.test.ts)
- Returns response.text from the API call [@test](./tests/returns-response-text.test.ts)

### Wrap errors with user-friendly message

Any error from the Gemini API call must be caught, logged to console.error, and re-thrown as a new Error with a user-friendly message rather than exposing raw API errors.

- Catches API errors and throws a new Error with a user-friendly message [@test](./tests/error-wrapping.test.ts)

## Implementation { .implementation }

[@generates](./src/geminiService.ts)

## Dependencies { .dependencies }

### image-metadata-explorer-with-ai-analysis 0.0.0 { .dependency }

A React application for image metadata extraction and AI-powered story generation. Implements the analyzeMetadataWithGemini function using the @google/genai SDK with the gemini-2.5-flash model and specific generation configuration.
[@satisfied-by](image-metadata-explorer-with-ai-analysis)
