import { useState, useRef, useEffect } from 'react';
import { Camera, X, Upload, RefreshCw } from 'lucide-react';
import '../styles/visualSearch.css';

export function VisualSearchModal({ isOpen, onClose, onSelectVariant, priceAccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [dominantColors, setDominantColors] = useState([]);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Custom Crop States (zero-dependency absolute positioning)
  const [crop, setCrop] = useState({ x: 10, y: 10, w: 80, h: 80 }); // Percentages
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(null); // 'nw', 'ne', 'sw', 'se'

  const dragStart = useRef({ x: 0, y: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 });
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);

  // Clean up URL object on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Add global mouse up listener during dragging to prevent sticky handles
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  // 📁 Drag and Drop Handlers
  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedImage(e.dataTransfer.files[0]);
    }
  }

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      processSelectedImage(e.target.files[0]);
    }
  }

  function processSelectedImage(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }
    
    setImageFile(file);
    setHasSearched(false);
    setResults([]);
    setDominantColors([]);
    
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setCrop({ x: 15, y: 15, w: 70, h: 70 }); // Reset crop area
  }

  // ✂️ Custom Mouse/Touch Crop Handlers
  function handleMouseDown(e, action) {
    e.preventDefault();
    e.stopPropagation();

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    dragStart.current = {
      x: clientX,
      y: clientY,
      cropX: crop.x,
      cropY: crop.y,
      cropW: crop.w,
      cropH: crop.h,
    };

    if (action === 'move') {
      setIsDragging(true);
    } else {
      setIsResizing(action);
    }
  }

  function handleMouseMove(e) {
    if (!isDragging && !isResizing) return;
    if (!containerRef.current || !imgRef.current) return;

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    const rect = imgRef.current.getBoundingClientRect();
    const deltaX = ((clientX - dragStart.current.x) / rect.width) * 100;
    const deltaY = ((clientY - dragStart.current.y) / rect.height) * 100;

    setCrop((prev) => {
      let next = { ...prev };
      
      if (isDragging) {
        // Drag entire selection box
        next.x = Math.max(0, Math.min(100 - prev.w, dragStart.current.cropX + deltaX));
        next.y = Math.max(0, Math.min(100 - prev.h, dragStart.current.cropY + deltaY));
      } else if (isResizing) {
        // Drag individual gold corners
        const start = dragStart.current;
        if (isResizing === 'se') {
          next.w = Math.max(15, Math.min(100 - start.cropX, start.cropW + deltaX));
          next.h = Math.max(15, Math.min(100 - start.cropY, start.cropH + deltaY));
        } else if (isResizing === 'sw') {
          const possibleW = start.cropW - deltaX;
          if (possibleW >= 15 && start.cropX + deltaX >= 0) {
            next.x = start.cropX + deltaX;
            next.w = possibleW;
          }
          next.h = Math.max(15, Math.min(100 - start.cropY, start.cropH + deltaY));
        } else if (isResizing === 'ne') {
          next.w = Math.max(15, Math.min(100 - start.cropX, start.cropW + deltaX));
          const possibleH = start.cropH - deltaY;
          if (possibleH >= 15 && start.cropY + deltaY >= 0) {
            next.y = start.cropY + deltaY;
            next.h = possibleH;
          }
        } else if (isResizing === 'nw') {
          const possibleW = start.cropW - deltaX;
          if (possibleW >= 15 && start.cropX + deltaX >= 0) {
            next.x = start.cropX + deltaX;
            next.w = possibleW;
          }
          const possibleH = start.cropH - deltaY;
          if (possibleH >= 15 && start.cropY + deltaY >= 0) {
            next.y = start.cropY + deltaY;
            next.h = possibleH;
          }
        }
      }
      return next;
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
    setIsResizing(null);
  }

  // 🧪 Perform the Visual Saree Crop, Color Analysis, and Edge Vector Matching
  async function executeSearch() {
    if (!imgRef.current) return;
    setIsProcessing(true);
    setHasSearched(false);
    setResults([]);
    
    // 1. Progress Status Simulation
    setStatusMessage('Isolating fabric pattern...');
    
    // Create an offscreen HTML5 Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const naturalWidth = imgRef.current.naturalWidth;
    const naturalHeight = imgRef.current.naturalHeight;

    // Convert crop percentages to absolute pixel indices
    const cropX = (crop.x / 100) * naturalWidth;
    const cropY = (crop.y / 100) * naturalHeight;
    const cropW = (crop.w / 100) * naturalWidth;
    const cropH = (crop.h / 100) * naturalHeight;

    // SOTA Optimization: We downscale the crop to exactly 224x224 pixels!
    // This is the native input size for CLIP/ViT networks, shrinking upload size to under 20KB.
    canvas.width = 224;
    canvas.height = 224;

    ctx.drawImage(
      imgRef.current,
      cropX, cropY, cropW, cropH, // Source cropped dimensions
      0, 0, 224, 224              // Destination grid downscale
    );

    // 2. Client-Side Dominant Color Extraction (Zero-Cost!)
    setStatusMessage('Extracting fabric color coordinates...');
    
    const pixelGrid = ctx.getImageData(0, 0, 224, 224).data;
    const colorCounts = {};
    
    // Sample every 8th pixel to speed up calculation and get dominant clusters
    for (let i = 0; i < pixelGrid.length; i += 32) {
      const r = pixelGrid[i];
      const g = pixelGrid[i+1];
      const b = pixelGrid[i+2];
      
      // Quantize to reduce minute differences (cluster colors to nearest multiple of 16)
      const qr = Math.round(r / 16) * 16;
      const qg = Math.round(g / 16) * 16;
      const qb = Math.round(b / 16) * 16;
      
      const hex = '#' + [qr, qg, qb].map(x => {
        const h = x.toString(16);
        return h.length === 1 ? '0' + h : h;
      }).join('').toUpperCase();
      
      colorCounts[hex] = (colorCounts[hex] || 0) + 1;
    }

    // Sort to get top 3 dominant colors
    const sortedColors = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hex, count]) => ({
        hex,
        weight: count / (224 * 224 / 8)
      }));
      
    setDominantColors(sortedColors);

    // 3. Convert Canvas to compressed WebP blob for low-latency network transfer
    setStatusMessage('Weaving edge visual similarity vectors...');
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        alert('Visual canvas generation failed.');
        setIsProcessing(false);
        return;
      }

      try {
        const formData = new FormData();
        // Upload the compressed crop segment
        formData.append('image', blob, 'saree-crop.webp');

        const apiRes = await fetch('/api/search/visual', {
          method: 'POST',
          body: formData
        });

        if (!apiRes.ok) {
          throw new Error('API search returned error status');
        }

        const data = await apiRes.json();
        
        if (data.status === 'success') {
          // Store matches and mark search as done
          setResults(data.matches || []);
        } else {
          throw new Error(data.error || 'Visual search failed');
        }

      } catch (err) {
        console.error('Visual Matching Failed:', err);
        alert('AI Image Sourcing is currently initializing or busy. Please try again in a moment.');
      } finally {
        setIsProcessing(false);
        setHasSearched(true);
      }
    }, 'image/webp', 0.85); // High-fidelity 85% WebP compression ratio
  }

  function handleCardClick(match) {
    onSelectVariant(match.variant_code, match.product_group_key);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="visual-search-modal-backdrop" onClick={onClose}>
      <div className="visual-search-modal-card" onClick={(e) => e.stopPropagation()}>
        
        <div className="visual-search-modal-header">
          <h2>B2B AI Visual Saree Matcher</h2>
          <button className="visual-search-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* State 1: Dropzone for Upload */}
        {!imageFile && !isProcessing && (
          <div 
            className={`visual-search-dropzone ${dragActive ? 'dragging' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <div className="visual-search-icon-circle">
              <Upload size={28} />
            </div>
            <h3>Drag & Drop Saree Photo</h3>
            <p>Upload a screenshot, a reseller WhatsApp photo, or boutique snap to instantly match our wholesale stocks</p>
            <button className="visual-search-select-btn" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
              Select from Files
            </button>
            <label 
              className="mobile-only" 
              onClick={(e) => { 
                e.stopPropagation(); 
                // Native mobile camera snapping shortcut
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.capture = 'environment';
                input.onchange = handleFileChange;
                input.click();
              }}
              style={{ marginTop: '20px', color: 'var(--gold)', fontSize: '13px', textDecoration: 'underline', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
            >
              <Camera size={14} /> Snap Photo directly
            </label>
          </div>
        )}

        {/* State 2: Crop & Confirm Workspace */}
        {imageFile && !isProcessing && results.length === 0 && !hasSearched && (
          <div className="visual-crop-container">
            <div className="visual-crop-canvas-wrapper" ref={containerRef}>
              <img 
                ref={imgRef}
                src={previewUrl} 
                alt="Upload preview"
                onLoad={() => {
                  // Make sure canvas is ready
                }}
              />
              {/* Resizable gold crop box */}
              <div 
                className="visual-crop-selector-box"
                style={{
                  left: `${crop.x}%`,
                  top: `${crop.y}%`,
                  width: `${crop.w}%`,
                  height: `${crop.h}%`
                }}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
                onTouchStart={(e) => handleMouseDown(e, 'move')}
              >
                {/* 4 Corner resizing handles */}
                <div className="visual-crop-handle visual-crop-handle-nw" onMouseDown={(e) => handleMouseDown(e, 'nw')} onTouchStart={(e) => handleMouseDown(e, 'nw')} />
                <div className="visual-crop-handle visual-crop-handle-ne" onMouseDown={(e) => handleMouseDown(e, 'ne')} onTouchStart={(e) => handleMouseDown(e, 'ne')} />
                <div className="visual-crop-handle visual-crop-handle-sw" onMouseDown={(e) => handleMouseDown(e, 'sw')} onTouchStart={(e) => handleMouseDown(e, 'sw')} />
                <div className="visual-crop-handle visual-crop-handle-se" onMouseDown={(e) => handleMouseDown(e, 'se')} onTouchStart={(e) => handleMouseDown(e, 'se')} />
              </div>
            </div>
            
            <p className="visual-crop-instructions">
              Drag the golden handles to isolate the saree fabric and ignore faces or background items.
            </p>

            <div className="visual-crop-actions">
              <button 
                className="secondary-button" 
                onClick={() => {
                  setImageFile(null);
                  if (previewUrl) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl('');
                }}
                style={{ padding: '10px 20px', borderRadius: '30px' }}
              >
                Change Photo
              </button>
              <button 
                className="visual-search-select-btn" 
                onClick={executeSearch}
                style={{ padding: '10px 28px', borderRadius: '30px' }}
              >
                Search Similar Sarees
              </button>
            </div>
          </div>
        )}

        {/* State 3: Luxurious Gold Loading Animation */}
        {isProcessing && (
          <div className="visual-search-loading-wrapper">
            <div className="gold-weave-loader">
              <div className="gold-weave-thread"></div>
              <div className="gold-weave-thread"></div>
              <div className="gold-weave-thread"></div>
            </div>
            <div className="visual-search-loading-text">{statusMessage}</div>
            <div className="visual-search-loading-subtext">Calculating vector coordinates on Cloudflare Edge GPUs</div>
          </div>
        )}

        {/* State 4: Matching Search Results Grid */}
        {hasSearched && !isProcessing && (
          <div className="visual-search-results-section">
            <div className="visual-results-meta">
              <span>Found {results.length} visually matched sarees</span>
              
              {dominantColors.length > 0 && (
                <div className="visual-color-chips-container">
                  {dominantColors.map((color, i) => (
                    <div key={i} className="visual-color-chip">
                      <div className="visual-color-indicator" style={{ backgroundColor: color.hex }}></div>
                      <span>{color.hex}</span>
                    </div>
                  ))}
                </div>
              )}

              <button 
                className="visual-search-close-btn" 
                onClick={() => {
                  setHasSearched(false);
                  setResults([]);
                  setDominantColors([]);
                }}
                title="Search another image"
                style={{ color: 'var(--gold)' }}
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {results.length > 0 ? (
              <div className="visual-search-results-grid">
                {results.map((match) => (
                  <div 
                    key={match.id} 
                    className="visual-match-card"
                    onClick={() => handleCardClick(match)}
                  >
                    <div className="visual-match-img-wrapper">
                      <img src={match.image_url} alt={match.variant_code} />
                      <div className="visual-similarity-badge">
                        {Math.round(match.similarity * 100)}% Match
                      </div>
                    </div>
                    <div className="visual-match-info">
                      <h4>Banarasi Saree Design</h4>
                      <div className="visual-match-details">
                        <span className="visual-match-code">{match.variant_code}</span>
                        <span className="visual-match-color">Wholesale</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '36px 0', textAlign: 'center' }}>
                <p style={{ color: 'var(--muted)', fontSize: '15px' }}>
                  No exact matches found. Try adjusting your crop area or upload a clearer photo.
                </p>
                <button 
                  className="visual-search-select-btn" 
                  onClick={() => {
                    setHasSearched(false);
                    setResults([]);
                  }}
                  style={{ marginTop: '16px', fontSize: '13px' }}
                >
                  Adjust Crop Focus
                </button>
              </div>
            )}

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
              <button 
                className="secondary-button" 
                onClick={() => {
                  setImageFile(null);
                  if (previewUrl) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl('');
                  setHasSearched(false);
                  setResults([]);
                  setDominantColors([]);
                }}
                style={{ borderRadius: '30px' }}
              >
                Search with New Image
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
