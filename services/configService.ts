/**
 * @fileoverview Configuration service for loading and caching application metadata tag definitions.
 * This service manages the loading of EXIF tag configuration from a JSON file,
 * implementing singleton pattern with promise caching to prevent redundant fetches.
 *
 * @module configService
 */

/**
 * Configuration for a single EXIF metadata tag.
 * Defines how a specific tag should be extracted, labeled, and categorized.
 *
 * @interface TagConfig
 * @property {string} key - The EXIF tag identifier (e.g., "Make", "Model", "DateTimeOriginal", "GPSLatitude")
 * @property {string} label - Human-readable display name for the tag (e.g., "Camera Make", "Date Taken")
 * @property {string} category - Grouping category for organization (e.g., "camera", "location", "technical", "descriptive")
 */
interface TagConfig {
  key: string;
  label: string;
  category: string;
}

/**
 * Application configuration structure containing all metadata tag definitions.
 * This configuration drives which EXIF tags are extracted and how they are displayed.
 *
 * @interface AppConfig
 * @property {TagConfig[]} tags - Array of metadata tag configurations to extract and display
 */
interface AppConfig {
  tags: TagConfig[];
}

/**
 * Cached promise for configuration loading (singleton pattern).
 * Prevents multiple concurrent fetches of the same configuration file.
 *
 * @private
 * @type {Promise<AppConfig> | null}
 */
let configPromise: Promise<AppConfig> | null = null;

/**
 * Retrieves the application configuration, loading it from the server if necessary.
 * Implements lazy loading with promise caching - the configuration is fetched only once
 * on the first call, and subsequent calls return the cached promise.
 *
 * The configuration file (exiftool_config.json) should be available at the application root
 * and defines which EXIF tags to extract from uploaded images.
 *
 * @async
 * @export
 * @returns {Promise<AppConfig>} A promise that resolves to the application configuration object
 *   containing tag definitions for metadata extraction and display.
 * @throws {Error} Throws an error if the configuration file cannot be fetched or parsed.
 *   On error, the cache is cleared to allow retry on subsequent calls.
 *
 * @example
 * ```typescript
 * // Load configuration and use it
 * try {
 *   const config = await getConfig();
 *   console.log(`Loaded ${config.tags.length} tag definitions`);
 *   config.tags.forEach(tag => {
 *     console.log(`${tag.label} (${tag.key}) - ${tag.category}`);
 *   });
 * } catch (error) {
 *   console.error("Failed to load config:", error);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Multiple calls return the same promise (cached)
 * const config1Promise = getConfig(); // Triggers fetch
 * const config2Promise = getConfig(); // Returns cached promise
 * console.log(config1Promise === config2Promise); // true
 *
 * const config1 = await config1Promise;
 * const config2 = await config2Promise;
 * console.log(config1 === config2); // true
 * ```
 *
 * @example
 * ```typescript
 * // Configuration structure example
 * const config = await getConfig();
 * // {
 * //   tags: [
 * //     { key: "Make", label: "Camera Make", category: "camera" },
 * //     { key: "Model", label: "Camera Model", category: "camera" },
 * //     { key: "DateTimeOriginal", label: "Date Taken", category: "temporal" },
 * //     { key: "GPSLatitude", label: "Latitude", category: "location" }
 * //   ]
 * // }
 * ```
 */
export const getConfig = (): Promise<AppConfig> => {
  if (!configPromise) {
    configPromise = fetch('/exiftool_config.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .catch(error => {
        console.error("Failed to load application configuration:", error);
        configPromise = null; // Allow retrying
        throw error;
      });
  }
  return configPromise;
};
