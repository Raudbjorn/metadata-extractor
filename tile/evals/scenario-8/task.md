# Config-driven Metadata Display Component

Implement a React component that displays image metadata grouped by category, using a configuration object to determine which tags to show and how to label them.

## Capabilities { .capabilities }

### Group metadata tags by category from config

Given an AppConfig object with a `tags` array and an embedded metadata object, the component must group the matching tags by their `category` property. Only tags where the corresponding key exists in the embedded metadata must be included. Tags whose key is absent from embedded metadata are silently omitted.

- Tags with matching keys in embedded metadata are grouped by category [@test](./tests/category-grouping.test.ts)
- Tags whose keys are not in embedded metadata are omitted [@test](./tests/absent-tags-omitted.test.ts)

### Render category sections with tag labels

Each category group must be rendered as a titled section. Within each section, each tag is displayed as a row showing the tag's `label` from the config alongside its value from the embedded metadata.

- Each category is rendered as a named section heading [@test](./tests/category-headings.test.ts)
- Each tag displays the label from config, not the raw key [@test](./tests/label-not-key.test.ts)

### Handle array values for display

Metadata values that are arrays must be converted to a comma-separated string for display. Non-array values must be converted to strings via String().

- Array metadata values are displayed as comma-separated strings [@test](./tests/array-values.test.ts)
- Non-array values are converted to strings with String() [@test](./tests/string-conversion.test.ts)

### Show fallback when no config or no matching tags

If the config object is absent or its tags array is missing, a "Configuration not available" message must be shown. If the config is present but no tags match the embedded metadata, a "No relevant embedded metadata found" message must be shown.

- Shows "Configuration not available" when config.tags is absent [@test](./tests/no-config-fallback.test.ts)
- Shows "No relevant embedded metadata found" when no tags match [@test](./tests/no-match-fallback.test.ts)

## Implementation { .implementation }

[@generates](./src/MetadataDisplay.tsx)

## Dependencies { .dependencies }

### image-metadata-explorer-with-ai-analysis 0.0.0 { .dependency }

A React application for image metadata extraction and AI-powered story generation. Implements the MetadataDisplay component with config-driven tag rendering grouped by category using MetadataSection and MetadataItem sub-components.
[@satisfied-by](image-metadata-explorer-with-ai-analysis)
