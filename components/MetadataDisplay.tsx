// FIX: Implemented the MetadataDisplay component to resolve placeholder errors.
import React from 'react';
import { LoadingIcon, ResetIcon, ErrorIcon, FingerprintIcon } from './Icons';

interface MetadataDisplayProps {
  metadata: {
    embedded: Record<string, any>;
    provider?: Record<string, any>;
    perceptualHash?: string;
  };
  analysis: string;
  isLoading: boolean;
  error: string;
  config: any;
  fileDetails: {
    previewUrl: string;
    name: string;
    type: string;
    size: number;
  };
  onReset: () => void;
}

const MetadataSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-cyan-400 mb-3 border-b border-gray-700 pb-2">{title}</h3>
        {children}
    </div>
);

const MetadataItem: React.FC<{ label: string; value: any }> = ({ label, value }) => {
    const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
    return (
        <div className="grid grid-cols-2 gap-2 text-sm mb-1">
            <dt className="font-medium text-gray-400 truncate">{label}</dt>
            <dd className="text-gray-200 text-right truncate">{displayValue}</dd>
        </div>
    );
};

const MetadataDisplay: React.FC<MetadataDisplayProps> = ({
  metadata,
  analysis,
  isLoading,
  error,
  config,
  fileDetails,
  onReset,
}) => {

  const renderEmbeddedMetadata = () => {
    if (!config?.tags) return <p className="text-gray-400 text-sm">Configuration not available.</p>;
    
    const categorizedTags: Record<string, any[]> = {};
    config.tags.forEach((tag: any) => {
        if (metadata.embedded[tag.key]) {
            if (!categorizedTags[tag.category]) {
                categorizedTags[tag.category] = [];
            }
            categorizedTags[tag.category].push(tag);
        }
    });

    if (Object.keys(categorizedTags).length === 0) {
        return <p className="text-gray-400 text-sm">No relevant embedded metadata found.</p>;
    }

    return Object.entries(categorizedTags).map(([category, tags]) => (
        <div key={category} className="mb-4 last:mb-0">
            <h4 className="font-semibold text-gray-300 mb-2 text-sm">{category}</h4>
            {tags.map(tag => (
                <MetadataItem key={tag.key} label={tag.label} value={metadata.embedded[tag.key]} />
            ))}
        </div>
    ));
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-bold text-gray-50">{fileDetails.name}</h2>
            <p className="text-gray-400">{fileDetails.type} - {(fileDetails.size / 1024).toFixed(2)} KB</p>
        </div>
        <button
          onClick={onReset}
          className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          <ResetIcon className="h-5 w-5" />
          Upload New
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
            <img src={fileDetails.previewUrl} alt="Uploaded preview" className="rounded-lg shadow-lg w-full object-contain" />
        </div>
        <div className="md:col-span-2 space-y-6">
          <MetadataSection title="AI Storyteller Analysis">
            {isLoading && (
              <div className="flex items-center justify-center p-8">
                <LoadingIcon className="h-8 w-8 animate-spin text-cyan-400" />
                <p className="ml-4 text-gray-300">Generating story...</p>
              </div>
            )}
            {error && (
              <div className="flex items-start text-red-400 p-4 bg-red-900/20 rounded-lg">
                <ErrorIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                <div>
                    <p className="font-semibold">Analysis Failed</p>
                    <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
            {analysis && (
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{analysis}</p>
            )}
          </MetadataSection>

          {metadata.perceptualHash && (
            <MetadataSection title="Image Fingerprint">
                <div className="flex items-start gap-4">
                    <FingerprintIcon className="h-8 w-8 text-gray-400 flex-shrink-0 mt-1" />
                    <div>
                        <p className="font-mono text-sm text-gray-200 break-all">{metadata.perceptualHash}</p>
                        <p className="text-xs text-gray-500 mt-2">This perceptual hash is a unique fingerprint of the image's visual content, used for detecting duplicates and finding similar photos.</p>
                    </div>
                </div>
            </MetadataSection>
          )}

          <MetadataSection title="Embedded Metadata">
            {renderEmbeddedMetadata()}
          </MetadataSection>

        </div>
      </div>
    </div>
  );
};

export default MetadataDisplay;