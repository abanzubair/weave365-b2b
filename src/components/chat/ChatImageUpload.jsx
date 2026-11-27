'use client';

import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, X } from '../icons.jsx';

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const MAX_IMAGE_WIDTH = 1024;
export const MAX_IMAGE_BYTES = 500 * 1024; // 500KB

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      if (commaIdx === -1) {
        reject(new Error('Failed to encode compressed image.'));
        return;
      }
      resolve(result.slice(commaIdx + 1));
    };
    reader.onerror = () => reject(new Error('Failed to read compressed image.'));
    reader.readAsDataURL(blob);
  });
}

function loadImageElement(objectUrl) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) {
        reject(new Error('Image dimensions could not be read.'));
        return;
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error('This image file appears damaged or unreadable.'));
    img.src = objectUrl;
  });
}

/**
 * Compresses and resizes a browser File via <canvas> to max 1024px width
 * and <= 500KB JPEG/WebP before upload.
 */
export async function compressImageFile(file) {
  if (!file || typeof file !== 'object') {
    throw new Error('No file selected.');
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error('Please upload a JPG, PNG, or WebP photo.');
  }
  if (file.size <= 0) {
    throw new Error('Selected image file is empty.');
  }

  const sourceUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(sourceUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Image processing is not supported in this browser.');
    }

    let targetWidth = Math.min(img.naturalWidth, MAX_IMAGE_WIDTH);
    let targetHeight = Math.max(1, Math.round((img.naturalHeight * targetWidth) / img.naturalWidth));

    const preferredMime = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
    const qualitySteps = [0.84, 0.72, 0.6, 0.48, 0.36];
    let bestBlob = null;

    for (let pass = 0; pass < 3; pass++) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      let activeMime = preferredMime;
      for (const quality of qualitySteps) {
        let blob = await canvasToBlob(canvas, activeMime, quality);
        if (!blob || (activeMime === 'image/webp' && blob.type !== 'image/webp')) {
          activeMime = 'image/jpeg';
          blob = await canvasToBlob(canvas, activeMime, quality);
        }
        if (!blob) continue;

        if (!bestBlob || blob.size < bestBlob.size) {
          bestBlob = blob;
        }
        if (blob.size <= MAX_IMAGE_BYTES) {
          bestBlob = blob;
          break;
        }
      }

      if (bestBlob && bestBlob.size <= MAX_IMAGE_BYTES) {
        break;
      }

      targetWidth = Math.max(320, Math.round(targetWidth * 0.75));
      targetHeight = Math.max(1, Math.round((img.naturalHeight * targetWidth) / img.naturalWidth));
    }

    if (!bestBlob || bestBlob.size > MAX_IMAGE_BYTES) {
      throw new Error('Photo could not be compressed under 500KB. Please pick a smaller image.');
    }

    const base64 = await blobToBase64(bestBlob);
    const previewUrl = URL.createObjectURL(bestBlob);

    return {
      mimeType: bestBlob.type || 'image/jpeg',
      base64,
      previewUrl,
      sizeBytes: bestBlob.size,
      width: targetWidth,
      height: targetHeight,
      name: file.name || 'fabric-photo.jpg',
    };
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export function ChatImageUpload({
  attachment = null,
  onAttach,
  onRemove,
  error = '',
  onError,
  disabled = false,
  mode = 'all', // 'button' | 'preview' | 'all'
  inputRef: externalInputRef = null,
}) {
  const internalInputRef = useRef(null);
  const fileInputRef = externalInputRef || internalInputRef;
  const [isProcessing, setIsProcessing] = useState(false);

  const showButton = mode === 'all' || mode === 'button';
  const showPreview = mode === 'all' || mode === 'preview';

  // Revoke object URL on replacement or unmount to prevent memory leaks.
  useEffect(() => {
    if (!showPreview) return undefined;
    const url = attachment?.previewUrl;
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [showPreview, attachment?.previewUrl]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    onError?.('');
    setIsProcessing(true);
    try {
      const compressed = await compressImageFile(file);
      onAttach?.(compressed);
    } catch (err) {
      onError?.(err?.message || 'Unable to process this photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {showButton && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={disabled || isProcessing}
            className="wc-sr-only"
            tabIndex={-1}
            aria-label="Choose a saree or fabric image file"
          />
          <button
            type="button"
            className="wc-attach-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isProcessing}
            aria-label={isProcessing ? 'Preparing photo' : 'Upload saree or fabric photo'}
            title="Upload saree or fabric photo (JPG, PNG, WebP)"
          >
            <ImageIcon size={18} aria-hidden="true" />
          </button>
        </>
      )}

      {showPreview && (error || attachment) && (
        <div className="wc-upload-feedback">
          {error && (
            <p className="wc-upload-error" role="status">
              {error}
            </p>
          )}
          {attachment && (
            <div className="wc-upload-preview">
              <img
                src={attachment.previewUrl}
                alt={`Attached fabric preview: ${attachment.name || 'uploaded photo'}`}
                className="wc-upload-thumb"
              />
              <div className="wc-upload-meta">
                <span className="wc-upload-name">{attachment.name || 'Attached photo'}</span>
                <span className="wc-upload-size">
                  {Math.max(1, Math.round((attachment.sizeBytes || 0) / 1024))} KB ready
                </span>
              </div>
              <button
                type="button"
                className="wc-upload-remove"
                onClick={() => {
                  onError?.('');
                  onRemove?.();
                }}
                aria-label="Remove attached photo"
                title="Remove photo"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
