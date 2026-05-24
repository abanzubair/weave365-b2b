/**
 * BulkInquiry View
 * Purpose: Renders the comprehensive B2B wholesale inquiry questionnaire.
 * Gathers order specifications (category, quantity, target budget, fabric preferences, timelines)
 * and formats the request into a WhatsApp dispatch link for immediate weaver concierge assistance.
 */
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  PackageCheck,
  Phone,
  Send,
  Sparkles,
  Truck,
} from 'lucide-react';
import { storeConfig } from '../config.js';
import { normalizePincodeInput, WhatsappIcon } from '../storefrontShared.jsx';

const initialInquiry = {
  name: '',
  businessName: '',
  phone: '',
  email: '',
  city: '',
  state: '',
  category: 'Sarees',
  quantity: '',
  budget: '',
  fabric: '',
  work: '',
  occasion: '',
  pincode: '',
  timeline: 'Flexible',
  reference: '',
  message: '',
};

const categories = ['Sarees', 'Suits', 'Dupattas', 'Lehengas', 'Fabric', 'Mixed order'];
const timelines = ['Urgent', 'Within 7 days', 'Within 15 days', 'Flexible'];
const preferenceOptions = ['Katan Silk', 'Dola Silk', 'Cotton', 'Georgette', 'Zari', 'Printed', 'Designer', 'Wedding'];

export function BulkInquiry({ navigate }) {
  const [inquiry, setInquiry] = useState(initialInquiry);
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const whatsappUrl = useMemo(
    () => buildBulkInquiryWhatsappUrl(inquiry, selectedPreferences),
    [inquiry, selectedPreferences],
  );

  function updateField(field, value) {
    setInquiry((current) => ({
      ...current,
      [field]: field === 'pincode' ? normalizePincodeInput(value) : value,
    }));
  }

  function togglePreference(preference) {
    setSelectedPreferences((current) =>
      current.includes(preference)
        ? current.filter((item) => item !== preference)
        : [...current, preference],
    );
  }

  function submitInquiry(event) {
    event.preventDefault();
    setSubmitted(true);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <section className="bulk-inquiry-page">
      <div className="bulk-inquiry-hero">
        <div>
          <span className="pill">Wholesale Bulk Inquiry</span>
          <h1>Banarasi Saree Wholesale Bulk Inquiry & Sourcing</h1>
          <p>
            Tell us what you need, and we will curate the right catalog for you. Share your quantity, budget, fabric preference, and delivery timeline. Our team will reply with suitable options on WhatsApp.
          </p>
          <div className="bulk-hero-actions">
            <a className="primary-button" href={`https://wa.me/${storeConfig.whatsapp}`} target="_blank" rel="noreferrer">
              <WhatsappIcon size={18} /> Chat Directly
            </a>
            <button className="secondary-button" type="button" onClick={() => navigate('wholesale-catalogue')}>
              Browse Catalog <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <aside className="bulk-response-card">
          <strong>How bulk inquiry works</strong>
          <span><PackageCheck size={18} /> Send your requirement</span>
          <span><Sparkles size={18} /> We shortlist matching designs</span>
          <span><Phone size={18} /> Team confirms pricing and availability</span>
          <span><Truck size={18} /> Dispatch plan is shared after confirmation</span>
        </aside>
      </div>

      <div className="bulk-inquiry-layout">
        <form className="bulk-inquiry-form" onSubmit={submitInquiry}>
          <div className="bulk-form-section">
            <div className="bulk-section-heading">
              <BadgeCheck />
              <span>
                <strong>Buyer Details</strong>
                Basic information for follow-up
              </span>
            </div>
            <div className="bulk-field-grid two-columns">
              <label>
                Name
                <input value={inquiry.name} onChange={(event) => updateField('name', event.target.value)} required />
              </label>
              <label>
                Business / Shop Name
                <input value={inquiry.businessName} onChange={(event) => updateField('businessName', event.target.value)} />
              </label>
              <label>
                Phone
                <input
                  value={inquiry.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  inputMode="tel"
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={inquiry.email}
                  onChange={(event) => updateField('email', event.target.value)}
                />
              </label>
              <label>
                City
                <input value={inquiry.city} onChange={(event) => updateField('city', event.target.value)} />
              </label>
              <label>
                State
                <input value={inquiry.state} onChange={(event) => updateField('state', event.target.value)} />
              </label>
            </div>
          </div>

          <div className="bulk-form-section">
            <div className="bulk-section-heading">
              <PackageCheck />
              <span>
                <strong>Order Requirement</strong>
                Quantity, budget, and product type
              </span>
            </div>
            <div className="bulk-field-grid three-columns">
              <label>
                Category
                <select value={inquiry.category} onChange={(event) => updateField('category', event.target.value)}>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label>
                Quantity / Sets
                <input
                  value={inquiry.quantity}
                  onChange={(event) => updateField('quantity', event.target.value)}
                  placeholder="Example: 50 pieces"
                  required
                />
              </label>
              <label>
                Budget
                <input
                  value={inquiry.budget}
                  onChange={(event) => updateField('budget', event.target.value)}
                  placeholder="Example: Rs. 500-800"
                />
              </label>
              <label>
                Fabric Preference
                <input value={inquiry.fabric} onChange={(event) => updateField('fabric', event.target.value)} />
              </label>
              <label>
                Work Preference
                <input value={inquiry.work} onChange={(event) => updateField('work', event.target.value)} />
              </label>
              <label>
                Occasion / Use
                <input
                  value={inquiry.occasion}
                  onChange={(event) => updateField('occasion', event.target.value)}
                  placeholder="Resale, wedding, festive..."
                />
              </label>
            </div>

            <div className="preference-chip-group" aria-label="Quick preferences">
              {preferenceOptions.map((preference) => (
                <button
                  key={preference}
                  type="button"
                  className={selectedPreferences.includes(preference) ? 'active' : ''}
                  onClick={() => togglePreference(preference)}
                >
                  {preference}
                </button>
              ))}
            </div>
          </div>

          <div className="bulk-form-section">
            <div className="bulk-section-heading">
              <Clock />
              <span>
                <strong>Delivery And Notes</strong>
                Help us respond with the right availability
              </span>
            </div>
            <div className="bulk-field-grid two-columns">
              <label>
                Delivery Pincode
                <input
                  value={inquiry.pincode}
                  onChange={(event) => updateField('pincode', event.target.value)}
                  inputMode="numeric"
                  maxLength={6}
                />
              </label>
              <label>
                Timeline
                <select value={inquiry.timeline} onChange={(event) => updateField('timeline', event.target.value)}>
                  {timelines.map((timeline) => (
                    <option key={timeline} value={timeline}>{timeline}</option>
                  ))}
                </select>
              </label>
              <label className="full-field">
                Reference Product Code / Image Link
                <input
                  value={inquiry.reference}
                  onChange={(event) => updateField('reference', event.target.value)}
                  placeholder="Paste product code, Drive link, or Instagram reference"
                />
              </label>
              <label className="full-field">
                Requirement Details
                <textarea
                  value={inquiry.message}
                  onChange={(event) => updateField('message', event.target.value)}
                  rows={5}
                  placeholder="Mention colors, price range, fabric, packing, export requirement, or any special request."
                />
              </label>
            </div>
          </div>

          <div className="bulk-submit-row">
            <button className="gold-button" type="submit">
              <Send size={18} /> Send Bulk Inquiry
            </button>
            {submitted && <p className="success">WhatsApp inquiry opened. Our team will continue from there.</p>}
          </div>
        </form>

        <aside className="bulk-summary-panel">
          <h2>Inquiry Summary</h2>
          <SummaryRow label="Category" value={inquiry.category} />
          <SummaryRow label="Quantity" value={inquiry.quantity || 'Not added'} />
          <SummaryRow label="Budget" value={inquiry.budget || 'Open'} />
          <SummaryRow label="Preferences" value={selectedPreferences.join(', ') || 'Not selected'} />
          <SummaryRow label="Timeline" value={inquiry.timeline} />
          <SummaryRow label="Pincode" value={inquiry.pincode || 'Not added'} />
          <div className="bulk-summary-note">
            <WhatsappIcon size={20} />
            <p>The final inquiry is sent as a formatted WhatsApp message to {storeConfig.name}.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="bulk-summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function buildBulkInquiryWhatsappUrl(inquiry, preferences) {
  const lines = [
    `Hello ${storeConfig.name}, I want to place a bulk inquiry.`,
    '',
    `Name: ${inquiry.name || 'Not shared'}`,
    inquiry.businessName ? `Business: ${inquiry.businessName}` : '',
    `Phone: ${inquiry.phone || 'Not shared'}`,
    inquiry.email ? `Email: ${inquiry.email}` : '',
    [inquiry.city, inquiry.state].filter(Boolean).length
      ? `Location: ${[inquiry.city, inquiry.state].filter(Boolean).join(', ')}`
      : '',
    '',
    `Category: ${inquiry.category}`,
    `Quantity: ${inquiry.quantity || 'Not shared'}`,
    inquiry.budget ? `Budget: ${inquiry.budget}` : '',
    inquiry.fabric ? `Fabric: ${inquiry.fabric}` : '',
    inquiry.work ? `Work: ${inquiry.work}` : '',
    inquiry.occasion ? `Occasion / Use: ${inquiry.occasion}` : '',
    preferences.length ? `Selected Preferences: ${preferences.join(', ')}` : '',
    '',
    inquiry.pincode ? `Delivery Pincode: ${inquiry.pincode}` : '',
    `Timeline: ${inquiry.timeline}`,
    inquiry.reference ? `Reference: ${inquiry.reference}` : '',
    inquiry.message ? `Requirement Details: ${inquiry.message}` : '',
  ].filter(Boolean);

  return `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
}
