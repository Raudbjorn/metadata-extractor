import { GoogleGenAI } from "@google/genai";

// Fix: Updated GoogleGenAI initialization to directly use the API key from environment variables
// as per the guidelines, assuming it is always available. A non-null assertion (!) is used
// to satisfy TypeScript's strict null checks.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface AppConfig {
    tags: { key: string; label: string; category: string; }[];
}

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