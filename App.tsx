// FIX: Implemented the main App component to resolve placeholder errors. This component orchestrates the application's UI and logic, managing state for file uploads, metadata analysis, and displaying results.
import React, { useState, useEffect } from 'react';
import UppyUploader from './components/UppyUploader';
import MetadataDisplay from './components/MetadataDisplay';
import { analyzeMetadataWithGemini } from './services/geminiService';
import { generatePerceptualHash } from './services/mediaService';
import { getConfig } from './services/configService';
import { LogoIcon } from './components/Icons';

interface FileDetails {
  previewUrl: string;
  name: string;
  type: string;
  size: number;
}

interface Metadata {
  embedded: Record<string, any>;
  provider?: Record<string, any>;
  perceptualHash?: string;
}

const App: React.FC = () => {
  const [fileDetails, setFileDetails] = useState<FileDetails | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [appConfig, setAppConfig] = useState<any>(null);

  useEffect(() => {
    getConfig()
      .then(setAppConfig)
      .catch(err => {
        console.error("Failed to load app config:", err);
        setError("Could not load application configuration. Please try again later.");
      });
  }, []);

  const handleUploadSuccess = async ({ file, metadata: embeddedMetadata }: { file: any, metadata: any }) => {
    const details = {
      previewUrl: file.preview || URL.createObjectURL(file.data),
      name: file.name,
      type: file.type,
      size: file.size,
    };
    setFileDetails(details);

    setIsLoading(true);
    setError('');
    setAnalysis('');

    try {
        const hash = await generatePerceptualHash(details.previewUrl);
        const fullMetadata: Metadata = {
            embedded: embeddedMetadata,
            perceptualHash: hash,
        };
        setMetadata(fullMetadata);

        const geminiAnalysis = await analyzeMetadataWithGemini(
            fullMetadata.embedded,
            fullMetadata.provider,
            appConfig,
            file.extension || file.type.split('/')[1]
        );
        setAnalysis(geminiAnalysis);
    } catch (err: any) {
        console.error("Analysis failed:", err);
        setError(err.message || 'An unknown error occurred during analysis.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFileDetails(null);
    setMetadata(null);
    setAnalysis('');
    setError('');
    setIsLoading(false);
  };

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen font-sans">
      <div className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <LogoIcon className="h-10 w-10 text-cyan-400" />
            <h1 className="text-4xl font-bold text-gray-50">Image Metadata Storyteller</h1>
          </div>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Upload an image to extract its hidden metadata and let Gemini craft a unique story based on the data within.
          </p>
        </header>
        
        <main className="bg-gray-800/50 p-6 rounded-2xl shadow-2xl border border-gray-700 max-w-6xl mx-auto">
            {!fileDetails ? (
                <UppyUploader onUploadSuccess={handleUploadSuccess} />
            ) : metadata && (
                <MetadataDisplay
                    fileDetails={fileDetails}
                    metadata={metadata}
                    analysis={analysis}
                    isLoading={isLoading}
                    error={error}
                    config={appConfig}
                    onReset={handleReset}
                />
            )}
        </main>
        <footer className="text-center mt-8 text-gray-500 text-sm">
            <p>Powered by Gemini, Uppy, and Supabase.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
