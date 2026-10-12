/**
 * @file clientImageOptimizer.js
 * @description On-device client-side image optimization script for Weave365.
 * Strictly verifies image file types, inspects dimensions, scales down images
 * exceeding 2K resolution (2048px max width/height) preserving aspect ratio,
 * and compresses them using browser Canvas API before uploading to Cloudflare R2.
 */

const MAX_2K_DIMENSION = 2048; // 2K max resolution limit
const DEFAULT_QUALITY = 0.88; // High visual fidelity with strong compression

/**
 * Validates that the provided file is strictly an image file.
 * Rejects PDFs, documents, text files, and executables.
 */
export function isStrictImageFile(file) {
  if (!file || typeof file !== 'object') return false;
  const mime = String(file.type || '').toLowerCase().trim();
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
  if (allowedMimes.includes(mime)) return true;

  // Fallback check on extension if MIME is generic image/*
  const name = String(file.name || '').toLowerCase().trim();
  const ext = name.split('.').pop();
  return ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(ext);
}

/**
 * Optimizes an image file on device (in browser memory) before uploading.
 * 
 * @param {File} file - Original file from user
 * @param {Object} options - Configuration options
 * @param {number} [options.maxDimension=2048] - Max width or height (2K)
 * @param {number} [options.quality=0.88] - WebP/JPEG quality (0 to 1)
 * @param {Function} [options.onProgress] - Callback: (percentage, statusText) => void
 * @returns {Promise<{ file: File, wasOptimized: boolean, originalSize: number, optimizedSize: number, width: number, height: number }>}
 */
export async function optimizeImageOnDevice(file, options = {}) {
  const maxDimension = options.maxDimension || MAX_2K_DIMENSION;
  const quality = options.quality || DEFAULT_QUALITY;
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : () => {};

  // 1. Strict validation: Only images allowed
  if (!isStrictImageFile(file)) {
    throw new Error('Only image files (JPEG, PNG, WEBP) can be uploaded. Documents or PDFs are not allowed.');
  }

  onProgress(15, 'Reading image file on device...');

  const originalSize = file.size;

  // 2. Load into HTML Image object via ObjectURL
  const objectUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const maxSide = Math.max(width, height);

      // Check if image size or resolution exceeds thresholds
      const exceeds2K = maxSide > maxDimension;
      const exceedsFileSize = originalSize > 1.2 * 1024 * 1024; // > 1.2 MB
      const needsOptimization = exceeds2K || exceedsFileSize;

      if (!needsOptimization) {
        onProgress(100, 'Image is within 2K limits');
        resolve({
          file,
          wasOptimized: false,
          originalSize,
          optimizedSize: originalSize,
          width,
          height,
        });
        return;
      }

      onProgress(40, `Optimizing to 2K (Original: ${width}×${height})...`);

      // 3. Compute scaled dimensions preserving aspect ratio
      let targetWidth = width;
      let targetHeight = height;

      if (exceeds2K) {
        const scale = maxDimension / maxSide;
        targetWidth = Math.round(width * scale);
        targetHeight = Math.round(height * scale);
      }

      onProgress(65, `Rendering canvas at ${targetWidth}×${targetHeight}...`);

      // 4. Draw to Canvas with high-quality smoothing
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to original file if canvas context is unavailable
        resolve({
          file,
          wasOptimized: false,
          originalSize,
          optimizedSize: originalSize,
          width,
          height,
        });
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      onProgress(85, 'Compressing optimized image...');

      // 5. Convert canvas to WebP or JPEG blob
      const targetMime = 'image/webp';
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({
              file,
              wasOptimized: false,
              originalSize,
              optimizedSize: originalSize,
              width,
              height,
            });
            return;
          }

          // Generate clean file name
          const originalBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'image';
          const optimizedFileName = `${originalBaseName}.webp`;

          const optimizedFile = new File([blob], optimizedFileName, {
            type: targetMime,
            lastModified: Date.now(),
          });

          onProgress(100, `Optimized on device (${formatBytes(originalSize)} → ${formatBytes(blob.size)})`);

          resolve({
            file: optimizedFile,
            wasOptimized: true,
            originalSize,
            optimizedSize: blob.size,
            width: targetWidth,
            height: targetHeight,
          });
        },
        targetMime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to parse image file. Please verify the file is a valid image.'));
    };

    img.src = objectUrl;
  });
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
