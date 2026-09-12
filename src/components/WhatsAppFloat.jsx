/**
 * @file WhatsAppFloat.jsx
 * @description Refined floating WhatsApp concierge button with multi-intent template selector.
 * Allows users to choose between Reselling, Dropshipping, Sourcing, Buying, and Questions with pre-filled
 * bespoke WhatsApp messages.
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ArrowRight } from './icons.jsx';
import { storeConfig } from '../config.js';
import { WhatsappIcon } from './WhatsappIcon.jsx';
const WA_FLOAT_STYLES = `/* ── Floating WhatsApp Concierge & Template Popover (Spatial Layout Refined) ── */

.wa-float-container {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 9990;
}

/* Floating Trigger Button (Original Style Preserved) */
.wa-float {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #e8f4f2;
  color: #128C7E;
  border: 1.5px solid rgba(18, 140, 126, 0.30);
  box-shadow:
    0 8px 24px rgba(18, 140, 126, 0.15),
    0 2px 6px rgba(18, 140, 126, 0.08);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  text-decoration: none;
  cursor: pointer;
  outline: none;
  padding: 0;
}

.wa-float:hover {
  transform: translateY(-2px);
  background: #d4ece9;
  color: #128C7E;
  border-color: #128C7E;
  box-shadow:
    0 12px 32px rgba(18, 140, 126, 0.2),
    0 4px 8px rgba(18, 140, 126, 0.1);
}

.wa-float:active {
  transform: translateY(0) scale(0.96);
}

.wa-float:focus-visible {
  outline: 2px solid #128C7E;
  outline-offset: 2px;
}

.wa-float svg {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

/* ── Popover Window Layout ── */
.wa-distilled-popover {
  position: absolute;
  bottom: calc(100% + 12px);
  right: 0;
  width: 250px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 100px);
  max-height: calc(100dvh - 100px);
  overflow-y: auto;
  scrollbar-width: thin;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow:
    0 18px 40px -8px rgba(15, 23, 42, 0.14),
    0 4px 14px -2px rgba(15, 23, 42, 0.05);
  padding: 8px 6px;
  z-index: 9999;
  transform-origin: bottom right;
  animation: waLayoutEnter 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes waLayoutEnter {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(6px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* ── Header Layout ── */
.wa-distilled-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px 8px 8px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 5px;
}

.wa-distilled-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1;
}

.wa-header-icon {
  color: #25D366;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.wa-distilled-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  flex-shrink: 0;
}

.wa-distilled-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  transition: all 0.15s ease;
}

.wa-distilled-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.wa-distilled-close:focus-visible {
  outline: 2px solid #128C7E;
  outline-offset: 1px;
}

/* ── List Layout & Touch Rhythm ── */
.wa-distilled-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wa-distilled-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 7px 9px;
  background: transparent;
  border: none;
  border-radius: 9px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  outline: none;
  font-family: inherit;
}

.wa-distilled-item:hover {
  background: #f8fafc;
}

.wa-distilled-item:active {
  background: #f1f5f9;
}

.wa-distilled-item:focus-visible {
  outline: 2px solid #128C7E;
  outline-offset: -1px;
}

.wa-distilled-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5px;
}

.wa-distilled-item-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.25;
}

.wa-distilled-item-desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wa-distilled-arrow {
  color: #cbd5e1;
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  transition: transform 0.15s ease, color 0.15s ease;
}

.wa-distilled-item:hover .wa-distilled-arrow {
  color: #128C7E;
  transform: translateX(2px);
}

/* ── Mobile Responsive Layout ── */
@media (max-width: 768px) {
  .wa-float-container {
    bottom: calc(20px + env(safe-area-inset-bottom));
    right: calc(18px + env(safe-area-inset-right));
  }

  .wa-float {
    width: 52px;
    height: 52px;
  }

  .wa-float svg {
    width: 24px;
    height: 24px;
  }

  .wa-distilled-popover {
    width: min(280px, calc(100vw - 24px));
    right: 0;
    bottom: calc(100% + 12px);
    border-radius: 16px;
    padding: 8px 6px;
    box-shadow:
      0 22px 50px -10px rgba(15, 23, 42, 0.2),
      0 8px 20px -4px rgba(15, 23, 42, 0.1);
  }

  .wa-distilled-header {
    padding: 8px 10px 10px 10px;
    margin-bottom: 6px;
  }

  .wa-distilled-title {
    font-size: 16px;
    gap: 8px;
  }

  .wa-header-icon {
    width: 20px;
    height: 20px;
  }

  .wa-distilled-dot {
    width: 7px;
    height: 7px;
  }

  .wa-distilled-close {
    width: 30px;
    height: 30px;
  }

  .wa-distilled-close svg {
    width: 16px;
    height: 16px;
  }

  .wa-distilled-list {
    gap: 3px;
  }

  .wa-distilled-item {
    padding: 8px 10px;
    border-radius: 9px;
    gap: 8px;
  }

  .wa-distilled-text {
    gap: 2px;
  }

  .wa-distilled-item-title {
    font-size: 16px;
    line-height: 1.25;
  }

  .wa-distilled-item-desc {
    font-size: 13.5px;
    line-height: 1.35;
    white-space: normal;
  }

  .wa-distilled-arrow {
    width: 15px;
    height: 15px;
  }
}
`;

const WA_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const TEMPLATES = [
  {
    id: 'reselling',
    title: 'Reselling',
    desc: 'Reseller Tools',
    message: 'Hi! I’m interested in reselling Banarasi sarees and suits. Please share how I can get started.',
  },
  {
    id: 'dropshipping',
    title: 'Dropshipping',
    desc: 'No Inventory',
    message: 'Hi! I’d like to know more about selling Banarasi products without keeping stock. Please share the details.',
  },
  {
    id: 'sourcing',
    title: 'Sourcing',
    desc: 'Varanasi Supply',
    message: 'Hi! I’m looking to source Banarasi sarees and suits from Varanasi. Please share the details.',
  },
  {
    id: 'open-a-store',
    title: 'Open a Store',
    desc: 'Build Your Business',
    message: 'Hi! I’m interested in opening a Banarasi saree store in my city. Please share how I can get started.',
  },
  {
    id: 'buying',
    title: 'Buying',
    desc: 'Wholesale Orders',
    message: 'Hi! I’m looking to buy Banarasi sarees and suits. Please share your latest collection and wholesale prices.',
  },
  {
    id: 'questions',
    title: 'Questions',
    desc: 'Help & Support',
    message: 'Hi! I’d like to know about [write your question here]. Please help me.',
  },
  {
    id: 'community',
    title: 'WhatsApp Community',
    desc: 'Weave 365 Announcements',
    url: storeConfig.whatsappCommunity || storeConfig.whatsappChannel || 'https://chat.whatsapp.com/J6DAhAYZDrC5JPguNLfrga',
  },
];

export function WhatsAppFloat() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const phone = storeConfig.whatsapp || storeConfig.phone || '9919101369';
  const cleaned = phone.replace(/\D/g, '');
  const fullPhone = cleaned.length === 10 ? `91${cleaned}` : cleaned;

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectItem = (item) => {
    const targetUrl = item.url || `https://wa.me/${fullPhone}?text=${encodeURIComponent(item.message || '')}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <div className="wa-float-container" ref={containerRef}>
      <style dangerouslySetInnerHTML={{ __html: WA_FLOAT_STYLES }} />
      {isOpen && (
        <div 
          className="wa-distilled-popover" 
          role="dialog" 
          aria-modal="false"
          aria-label="WhatsApp quick topics"
        >
          <div className="wa-distilled-header">
            <div className="wa-distilled-title">
              <WhatsappIcon size={18} className="wa-header-icon" />
              <span>Chat on WhatsApp</span>
            </div>
            <button
              type="button"
              className="wa-distilled-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>

          <div className="wa-distilled-list">
            {TEMPLATES.map((item) => (
              <button
                key={item.id}
                type="button"
                className="wa-distilled-item"
                onClick={() => handleSelectItem(item)}
              >
                <div className="wa-distilled-text">
                  <span className="wa-distilled-item-title">{item.title}</span>
                  <span className="wa-distilled-item-desc">{item.desc}</span>
                </div>
                <ArrowRight size={13} className="wa-distilled-arrow" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Trigger Button (Original Style Preserved) */}
      <button
        type="button"
        className="wa-float"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close WhatsApp menu" : "Chat on WhatsApp"}
        title={isOpen ? "Close" : "Chat on WhatsApp"}
        aria-expanded={isOpen}
      >
        {WA_SVG}
      </button>
    </div>
  );
}
