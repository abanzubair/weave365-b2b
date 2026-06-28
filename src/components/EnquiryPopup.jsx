/**
 * EnquiryPopup Component
 * Purpose: A portal-rendered overlay confirmation popup appearing after a B2B inquiry is submitted.
 * Prompts the customer to open/resume the active WhatsApp conversation to finalize details.
 */
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { WhatsappIcon } from './WhatsappIcon.jsx';

export function EnquiryPopup({ open, onClose, whatsappUrl }) {
  if (!open) return null;

  const popup = (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="enquiry-popup-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Close popup">
          <X size={18} />
        </button>
        <h3>Enquiry Received!</h3>
        <p>
          Your enquiry has been received successfully. Connect with us on WhatsApp for a faster response.
        </p>
        <div className="enquiry-popup-actions">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="whatsapp-action-btn"
            onClick={onClose}
          >
            <WhatsappIcon size={18} /> Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(popup, document.body) : popup;
}
