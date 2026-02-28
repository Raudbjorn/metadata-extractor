# Uppy React Component with Proper Lifecycle Management

Implement a React functional component that integrates Uppy for image uploads, managing the Uppy instance lifecycle correctly using React hooks.

## Capabilities { .capabilities }

### Stable Uppy instance via memoization

The Uppy instance (including XHR upload configuration) must be created exactly once per component mount using memoization. The instance must not be recreated on re-renders triggered by prop changes.

- The Uppy instance is created using a memoization hook to prevent re-creation on re-renders [@test](./tests/memo-uppy.test.ts)
- The XHR upload plugin is configured within the same memoized block, not in a separate effect [@test](./tests/xhr-in-memo.test.ts)

### Dashboard mounted in effect with container ref

The Dashboard plugin must be attached to a DOM element obtained from a ref, inside a side-effect hook. The plugin must not be re-attached unnecessarily.

- The Dashboard is added via uppy.use(Dashboard, { target: ref.current }) inside a useEffect [@test](./tests/dashboard-in-effect.test.ts)
- The Dashboard target is the current value of a React ref pointing to a DOM container [@test](./tests/dashboard-target-ref.test.ts)

### Cleanup on unmount

When the component unmounts, the Uppy instance must be properly closed to prevent memory leaks.

- The useEffect cleanup function calls uppy.close() [@test](./tests/uppy-cleanup.test.ts)

## Implementation { .implementation }

[@generates](./src/UppyUploader.tsx)

## Dependencies { .dependencies }

### image-metadata-explorer-with-ai-analysis 0.0.0 { .dependency }

A React application for image metadata extraction and AI-powered story generation. Implements the pattern of using useMemo for Uppy instance creation and useEffect for Dashboard plugin attachment with cleanup via uppy.close().
[@satisfied-by](image-metadata-explorer-with-ai-analysis)
