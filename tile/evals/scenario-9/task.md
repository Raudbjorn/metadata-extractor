# Application Config Load on Component Mount

Implement a React component that loads application configuration once on mount, stores it in state, and handles loading errors by setting an error message in state.

## Capabilities { .capabilities }

### Load config once on component mount

The component must trigger config loading exactly once when it first mounts, using a side-effect hook with an empty dependency array. The loaded config must be stored in component state for use in rendering and child component props.

- Config loading is triggered in a useEffect with an empty dependency array [@test](./tests/effect-dependency.test.ts)
- Resolved config is stored via a state setter [@test](./tests/config-stored-in-state.test.ts)
- Config loading is not retriggered on re-renders [@test](./tests/no-rerun-on-rerender.test.ts)

### Handle config loading errors

If the config loading fails, the component must set a user-facing error message in state. The component must not crash or show a blank screen on config failure.

- On config load error, an error state setter is called with a descriptive message [@test](./tests/error-on-failure.test.ts)
- The error is logged with console.error [@test](./tests/error-logged.test.ts)

### Pass loaded config to child components

Once loaded, the config must be passed as a prop to downstream components that need it for rendering and AI analysis.

- Config state is passed as a prop to the display component [@test](./tests/config-as-prop.test.ts)
- Config state is passed as an argument to the AI analysis function call [@test](./tests/config-to-analysis.test.ts)

## Implementation { .implementation }

[@generates](./src/App.tsx)

## Dependencies { .dependencies }

### image-metadata-explorer-with-ai-analysis 0.0.0 { .dependency }

A React application for image metadata extraction and AI-powered story generation. Implements the App component pattern of loading configuration on mount via useEffect, storing it in state, and propagating it to child components and service calls.
[@satisfied-by](image-metadata-explorer-with-ai-analysis)
