/**
 * @fileoverview Client-side media processing service for image analysis and fingerprinting.
 * This service provides functionality for generating perceptual hashes (visual fingerprints)
 * of images, which can be used for duplicate detection and similarity comparison.
 *
 * @module mediaService
 */

import { blockhash } from 'blockhash-js';

/**
 * Loads an image from a URL and extracts its raw pixel data using HTML5 Canvas API.
 * This helper function is used internally to prepare images for perceptual hash generation.
 *
 * @private
 * @param {string} imageUrl - The URL of the image to load. Can be a data URL, blob URL,
 *   or any URL accessible from the browser (respecting CORS restrictions).
 * @returns {Promise<ImageData>} A promise that resolves to the ImageData object containing
 *   raw RGBA pixel data from the image.
 * @throws {Error} Throws an error if the image fails to load or if canvas context cannot be obtained
 *
 * @example
 * ```typescript
 * const imageData = await getImageData('blob:http://localhost:3000/abc123');
 * console.log(imageData.width, imageData.height); // 1920 1080
 * console.log(imageData.data.length); // 8294400 (1920 * 1080 * 4 RGBA values)
 * ```
 */
const getImageData = (imageUrl: string): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "Anonymous";
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const context = canvas.getContext('2d');
            if (!context) {
                return reject(new Error('Could not get canvas context'));
            }
            context.drawImage(image, 0, 0);
            resolve(context.getImageData(0, 0, image.width, image.height));
        };
        image.onerror = (err) => reject(err);
        image.src = imageUrl;
    });
};

/**
 * Generates a perceptual hash (pHash) for an image, creating a visual fingerprint.
 * Perceptual hashes are resilient to minor image modifications (resizing, compression,
 * color adjustments) and can be used to detect duplicate or similar images using
 * Hamming distance comparison.
 *
 * This implementation uses the blockhash algorithm with 16-bit precision, generating
 * a 64-bit hash (16x16 grid reduced to binary). The hash is returned as a hexadecimal string.
 *
 * @async
 * @export
 * @param {string} imageUrl - The URL of the image to hash. Supports:
 *   - Blob URLs (e.g., from File API: `URL.createObjectURL(file)`)
 *   - Data URLs (base64-encoded images)
 *   - HTTP/HTTPS URLs (must support CORS if from different origin)
 * @returns {Promise<string>} A promise that resolves to the perceptual hash as a hexadecimal string.
 *   Returns an empty string if hash generation fails (e.g., image load error, invalid format).
 *
 * @example
 * ```typescript
 * // Generate hash from uploaded file
 * const file = document.querySelector('input[type=file]').files[0];
 * const blobUrl = URL.createObjectURL(file);
 * const hash = await generatePerceptualHash(blobUrl);
 * console.log(hash); // "89a7c4d3e1f2b5a6..."
 * ```
 *
 * @example
 * ```typescript
 * // Compare two images for similarity
 * const hash1 = await generatePerceptualHash(imageUrl1);
 * const hash2 = await generatePerceptualHash(imageUrl2);
 *
 * // Calculate Hamming distance (number of differing bits)
 * // Lower distance = more similar images
 * const distance = calculateHammingDistance(hash1, hash2);
 * if (distance < 10) {
 *   console.log("Images are very similar or duplicates");
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Error handling
 * const hash = await generatePerceptualHash(invalidUrl);
 * if (!hash) {
 *   console.error("Failed to generate hash - check console for details");
 * }
 * ```
 *
 * @see {@link https://github.com/commonsmachinery/blockhash-js|blockhash-js} for algorithm details
 */
export const generatePerceptualHash = async (imageUrl: string): Promise<string> => {
    try {
        const imageData = await getImageData(imageUrl);
        // The second argument is the bits precision (e.g., 16 for a 64-bit hash).
        // The third argument is the method (1 for blockhash, 2 for a more detailed version).
        const hash = await blockhash(imageData, 16, 1);
        return hash;
    } catch (error) {
        console.error("Failed to generate perceptual hash:", error);
        // Return an empty string or throw, depending on desired error handling.
        // Returning empty string to avoid breaking the UI.
        return "";
    }
};
