import React, { useMemo, useEffect, useRef } from 'react';
import { Uppy, Dashboard, XHRUpload } from 'uppy';

interface UppyUploaderProps {
    onUploadSuccess: (result: { file: any, metadata: any }) => void;
}

const UppyUploader: React.FC<UppyUploaderProps> = ({ onUploadSuccess }) => {
    const uppy = useMemo(() => {
        const uppyInstance = new Uppy({
            autoProceed: true,
            restrictions: {
                maxNumberOfFiles: 1,
                allowedFileTypes: ['image/jpeg', 'image/png', 'image/tiff', 'image/webp'],
                maxFileSize: 10 * 1024 * 1024, // 10MB
            },
        });

        uppyInstance.use(XHRUpload, {
            // In a real Supabase project, you would get this from environment variables
            // For local dev, Supabase defaults to this endpoint.
            endpoint: 'http://localhost:54321/functions/v1/process-upload',
            fieldName: 'files[]',
        });

        uppyInstance.on('upload-success', (file, response) => {
            if (file && response.body) {
                onUploadSuccess({ file, metadata: response.body });
            }
        });
        
        uppyInstance.on('upload-error', (file, error, response) => {
            console.error('Uppy upload error:', { error, response });
            const message = response?.body?.error || error.message;
            uppyInstance.info(`Upload failed: ${message}`, 'error', 5000);
        });

        return uppyInstance;
    }, [onUploadSuccess]);

    const dashboardContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (uppy && dashboardContainerRef.current) {
            uppy.use(Dashboard, {
                target: dashboardContainerRef.current,
                inline: true,
                proudlyDisplayPoweredByUppy: false,
                theme: 'dark',
                width: '100%',
                height: 400,
                note: "Images only (JPG, PNG, TIFF, WEBP), up to 10MB",
            });
        }
        // Clean up the Uppy instance when the component unmounts
        return () => uppy.close();
    }, [uppy]);


    return (
        <div ref={dashboardContainerRef} className="rounded-lg overflow-hidden"></div>
    );
};

export default UppyUploader;