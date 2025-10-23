import { GoogleGenAI } from "@google/genai";

/**
 * @fileoverview Google Gemini AI service for generating creative narrative stories from image metadata.
 * This service integrates with Google's Gemini API to analyze EXIF and provider metadata,
 * generating evocative stories and contextual descriptions based on the image's embedded data.
 *
 * @module geminiService
 */

// Initialize GoogleGenAI client with API key from environment variables
// API_KEY is mapped from GEMINI_API_KEY in vite.config.ts
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Configuration structure for metadata tags to be analyzed.
 * Defines which EXIF tags should be extracted and how they should be labeled.
 *
 * @interface AppConfig
 * @property {TagConfig[]} tags - Array of metadata tag configurations
 */
interface AppConfig {
    tags: {
        /** The EXIF tag key (e.g., "Make", "Model", "DateTimeOriginal") */
        key: string;
        /** Human-readable label for display (e.g., "Camera Make", "Date Taken") */
        label: string;
        /** Category grouping for organization (e.g., "camera", "location", "technical") */
        category: string;
    }[];
}

/**
 * Formats extracted metadata into a human-readable string for AI prompt generation.
 * Combines provider metadata (e.g., from Google Drive, Dropbox) and embedded EXIF data
 * into a structured format that the AI model can analyze.
 *
 * @private
 * @param {Record<string, any>} embedded - Embedded EXIF metadata extracted from the image file
 * @param {Record<string, any>} [provider] - Optional metadata from the file provider/cloud service
 * @param {AppConfig} config - Application configuration defining which tags to include
 * @param {string} imageFormat - The image file format (e.g., "jpg", "png", "tiff")
 * @returns {string} Formatted metadata string ready for AI prompt inclusion
 *
 * @example
 * ```typescript
 * const formatted = formatMetadataForPrompt(
 *   { Make: "Canon", Model: "EOS 5D" },
 *   { host: "Google Drive", name: "vacation.jpg" },
 *   config,
 *   "jpg"
 * );
 * // Returns:
 * // "Image Format: JPG
 * //
 * // Source Information (from cloud provider):
 * // - Source Service: Google Drive
 * // - Original Filename: vacation.jpg
 * //
 * // Embedded File Metadata:
 * // - Camera Make: Canon
 * // - Camera Model: EOS 5D"
 * ```
 */
const formatMetadataForPrompt = (
    embedded: Record<string, any>,
    provider: Record<string, any> | undefined,
    config: AppConfig,
    imageFormat: string
): string => {
    let formattedString = `Image Format: ${imageFormat.toUpperCase()}\n\n`;
    
    // Format Provider Metadata
    if (provider) {
        formattedString += "Source Information (from cloud provider):\n";
        // A few common fields from providers like Google Drive, Dropbox, etc.
        const providerFields: Record<string, string> = {
            'name': 'Original Filename',
            'host': 'Source Service',
            'description': 'Description',
            'id': 'Source ID'
        }
        let providerFieldCount = 0;
        for (const key in providerFields) {
            if(provider[key]){
                formattedString += `- ${providerFields[key]}: ${provider[key]}\n`;
                providerFieldCount++;
            }
        }
         if (providerFieldCount > 0) formattedString += "\n";
    }

    // Format Embedded Metadata
    formattedString += "Embedded File Metadata:\n";
    let embeddedFieldCount = 0;

    for (const tag of config.tags) {
        if (embedded[tag.key]) {
            let value = embedded[tag.key];
            if (Array.isArray(value)) {
                value = value.join(', ');
            }
            formattedString += `- ${tag.label}: ${value}\n`;
            embeddedFieldCount++;
        }
    }

    if(embeddedFieldCount === 0) {
        formattedString += "No relevant embedded metadata was found in this image.\n"
    }

    return formattedString;
};

/**
 * Analyzes image metadata using Google's Gemini AI to generate a creative narrative story.
 * This function sends formatted metadata to the Gemini API and receives an evocative story
 * or rich description about the moment the photo was likely taken.
 *
 * @async
 * @export
 * @param {Record<string, any>} embeddedMetadata - EXIF and technical metadata embedded in the image file.
 *   Common fields include Make, Model, DateTimeOriginal, GPS coordinates, exposure settings, etc.
 * @param {Record<string, any>} [providerMetadata] - Optional metadata from cloud storage providers
 *   (e.g., Google Drive, Dropbox). May include original filename, description, upload date, source ID.
 * @param {AppConfig | null} config - Application configuration with tag definitions. If null,
 *   the function throws an error as configuration is required for formatting.
 * @param {string} imageFormat - The image file extension or format (e.g., "jpg", "png", "tiff", "webp").
 *   Used to provide context about the image type to the AI model.
 * @returns {Promise<string>} A promise that resolves to the AI-generated creative narrative story
 *   based on the provided metadata. The story focuses on inferring context, mood, and potential narrative.
 * @throws {Error} Throws an error if the configuration is unavailable or if the Gemini API call fails
 *
 * @example
 * ```typescript
 * const story = await analyzeMetadataWithGemini(
 *   {
 *     Make: "Canon",
 *     Model: "EOS 5D Mark IV",
 *     DateTimeOriginal: "2024:03:15 14:30:22",
 *     GPSLatitude: 40.7128,
 *     GPSLongitude: -74.0060
 *   },
 *   { host: "Google Drive", name: "sunset.jpg" },
 *   appConfig,
 *   "jpg"
 * );
 * console.log(story);
 * // Output: "On a crisp March afternoon in New York City, a photographer
 * // wielding their trusty Canon EOS 5D Mark IV captured this moment..."
 * ```
 *
 * @example
 * ```typescript
 * // Handling errors
 * try {
 *   const analysis = await analyzeMetadataWithGemini(metadata, provider, config, "png");
 *   displayStory(analysis);
 * } catch (error) {
 *   console.error("Failed to generate story:", error.message);
 *   // Error message will be user-friendly: "The AI service is currently unavailable."
 * }
 * ```
 */
export const analyzeMetadataWithGemini = async (
    embeddedMetadata: Record<string, any>,
    providerMetadata: Record<string, any> | undefined,
    config: AppConfig | null,
    imageFormat: string
): Promise<string> => {
  try {
    if (!config) {
        throw new Error("Application configuration is not available.");
    }

    const formattedMetadata = formatMetadataForPrompt(embeddedMetadata, providerMetadata, config, imageFormat);

    const prompt = `You are an expert photo analyst with a poetic touch. Based on the following metadata from an image, create a short, evocative story or a rich description about the moment this photo was likely taken. Infer the context, mood, and potential narrative. Use all available data, including the source information and the technical/descriptive embedded tags, to build your story. Be creative and focus on storytelling.

Metadata:
${formattedMetadata}

Your Analysis:`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.8,
          topP: 0.95,
        }
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("The AI service is currently unavailable.");
  }
};