# Singleton Configuration Loader Service

Implement a configuration service that lazily fetches an application configuration file from the server, caches the promise to prevent duplicate requests, and allows retrying after errors.

## Capabilities { .capabilities }

### Lazy-load config on first call only

The configuration file must be fetched from `/exiftool_config.json` only when the service is first called. The fetch must not be triggered during module initialization—only when the exported function is invoked.

- Config is not fetched during module import [@test](./tests/no-eager-fetch.test.ts)
- Fetches /exiftool_config.json on first call [@test](./tests/first-call-fetch.test.ts)
- Parses the response as JSON and returns the config object [@test](./tests/json-parse.test.ts)

### Return cached promise on subsequent calls

After the first call, all subsequent calls to the function must return the exact same promise (referential equality), without triggering additional fetch requests.

- Second call returns the same promise object as the first call [@test](./tests/same-promise.test.ts)
- No additional fetch is made on subsequent calls [@test](./tests/no-extra-fetch.test.ts)

### Clear cache on error to allow retry

If the fetch fails (network error or non-OK status), the promise cache must be cleared so that the next call will attempt a new fetch. The error must be propagated to the caller.

- Cache is cleared (set to null) when fetch fails [@test](./tests/cache-cleared-on-error.test.ts)
- The error is re-thrown to the caller after clearing the cache [@test](./tests/error-propagated.test.ts)
- Subsequent call after error triggers a new fetch [@test](./tests/retry-after-error.test.ts)

## Implementation { .implementation }

[@generates](./src/configService.ts)

## Dependencies { .dependencies }

### image-metadata-explorer-with-ai-analysis 0.0.0 { .dependency }

A React application for image metadata extraction and AI-powered story generation. Implements the getConfig() function with singleton promise caching for the EXIF tag configuration, including cache invalidation on error for retry support.
[@satisfied-by](image-metadata-explorer-with-ai-analysis)
