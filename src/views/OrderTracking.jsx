/**
 * OrderTracking Component
 * Purpose: Allows buyers to track their order status, see shipping carrier details,
 * custom tracking messages from the admin, and ordered items.
 */
import { useEffect, useState, useMemo } from 'react';
import { 
  Truck, 
  Compass, 
  Gift, 
  CreditCard, 
  AlertCircle, 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  MessageSquareText,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  PackageCheck,
  MapPin,
  Clock
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { formatMoney, fallbackProductImage } from '../storefrontShared.jsx';
import { storeConfig } from '../config.js';
import Breadcrumb from '../components/Breadcrumb.jsx';
import '../styles/orderTracking.css';

export function OrderTracking({ inquiryId, products = [], navigate, user }) {
  const [searchId, setSearchId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [catalogProducts, setCatalogProducts] = useState(products || []);
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    if (!order?.id) return;
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Ensure catalog products are available for image & title lookups
  useEffect(() => {
    if (products && products.length > 0) {
      setCatalogProducts(products);
      return;
    }

    let active = true;
    async function loadCatalog() {
      try {
        const { data: sheetRow } = await supabase.from('sheet_data').select('csv_data').eq('id', 'products_json').maybeSingle();
        if (active && sheetRow?.csv_data) {
          const parsed = typeof sheetRow.csv_data === 'string' ? JSON.parse(sheetRow.csv_data) : sheetRow.csv_data;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCatalogProducts(parsed);
          }
        }
      } catch (err) {
        console.warn('Failed to load fallback products for tracking view:', err);
      }
    }

    void loadCatalog();
    return () => { active = false; };
  }, [products]);

  // Fetch order tracking data by ID
  useEffect(() => {
    if (!inquiryId) {
      setOrder(null);
      setError('');
      return;
    }

    let active = true;
    async function fetchTracking() {
      setLoading(true);
      setError('');
      try {
        if (!isSupabaseConfigured) {
          setError('Supabase is not configured. Real-time tracking is unavailable.');
          setLoading(false);
          return;
        }

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(inquiryId.trim())) {
          setError('Invalid order tracking ID format. Please verify your ID or contact support.');
          setOrder(null);
          setLoading(false);
          return;
        }

        // Use the secure RPC function to get order tracking by ID
        let trackingOrder = null;
        try {
          const { data, error: rpcError } = await supabase.rpc('get_order_tracking', {
            order_id: inquiryId
          });
          if (!rpcError && data && data.length > 0) {
            trackingOrder = data[0];
          }
        } catch (rpcErr) {
          console.warn('get_order_tracking RPC fallback:', rpcErr);
        }

        // Direct table fallback if RPC is unconfigured or missed api_orders
        if (!trackingOrder) {
          const [{ data: apiData }, { data: ordData }, { data: inqData }] = await Promise.all([
            supabase.from('api_orders').select('*').eq('id', inquiryId).maybeSingle().catch(() => ({ data: null })),
            supabase.from('orders').select('*').eq('id', inquiryId).maybeSingle().catch(() => ({ data: null })),
            supabase.from('inquiries').select('*').eq('id', inquiryId).maybeSingle().catch(() => ({ data: null })),
          ]);

          const found = apiData || ordData || inqData;
          if (found) {
            trackingOrder = {
              ...found,
              buyer_name: found.recipient_name || found.buyer_name,
              phone: found.recipient_phone || found.phone,
              email: found.recipient_email || found.email,
              pincode: found.recipient_pincode || found.pincode,
              is_dropship: Boolean(found.is_dropship || apiData),
              dropship_sender_name: found.sender_name || found.dropship_sender_name,
              dropship_sender_phone: found.sender_phone || found.dropship_sender_phone,
              dropship_recipient_name: found.recipient_name || found.dropship_recipient_name,
              dropship_recipient_phone: found.recipient_phone || found.dropship_recipient_phone,
              dropship_recipient_address: found.recipient_address || found.dropship_recipient_address,
              dropship_recipient_city: found.recipient_city || found.dropship_recipient_city,
              dropship_recipient_state: found.recipient_state || found.dropship_recipient_state,
              dropship_recipient_pincode: found.recipient_pincode || found.dropship_recipient_pincode,
              dropship_packing_preference: found.packing_preference || found.dropship_packing_preference,
              message: found.shipping_notes || found.message,
            };
          }
        }

        if (active) {
          if (trackingOrder) {
            setOrder(trackingOrder);
          } else {
            setError('Order tracking ID not found. Please verify your ID or contact support.');
            setOrder(null);
          }
        }
      } catch (err) {
        console.error('Error fetching order tracking:', err);
        if (active) {
          setError(err.message || 'An error occurred while loading your order.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchTracking();

    return () => {
      active = false;
    };
  }, [inquiryId]);

  // Handle manual tracking lookup
  const handleLookupSubmit = (e) => {
    e.preventDefault();
    const cleanId = searchId.trim();
    if (!cleanId) return;
    if (navigate) {
      navigate('order-tracking', cleanId);
    }
  };

  // Helper to parse delivery address from message block or dropship fields
  const parsedAddress = useMemo(() => {
    if (!order) return null;

    // If dedicated dropship columns are populated
    if (order.dropship_recipient_address) {
      const cityStatePin = [
        order.dropship_recipient_city,
        order.dropship_recipient_state,
        order.dropship_recipient_pincode ? `PIN: ${order.dropship_recipient_pincode}` : ''
      ].filter(Boolean).join(', ');

      return {
        name: order.dropship_recipient_name || order.buyer_name,
        phone: order.dropship_recipient_phone || order.phone,
        address: order.dropship_recipient_address,
        city: cityStatePin,
      };
    }

    const msg = order.message || '';

    // Case 1: Structured "Delivery Address:" block
    if (msg.includes('Delivery Address:')) {
      const parts = msg.split('Delivery Address:');
      const addressContent = parts[1].split('\n\n')[0].split('. Notes:')[0].trim();
      const lines = addressContent.split('\n');
      const addressObj = {};
      lines.forEach(line => {
        const index = line.indexOf(':');
        if (index !== -1) {
          const key = line.substring(0, index).trim().toLowerCase();
          const val = line.substring(index + 1).trim();
          if (key.includes('name')) addressObj.name = val;
          else if (key.includes('phone')) addressObj.phone = val;
          else if (key.includes('address')) addressObj.address = val;
          else if (key.includes('city')) addressObj.city = val;
          else if (key.includes('country')) addressObj.country = val;
        }
      });
      if (addressObj.address) {
        return {
          name: addressObj.name || order.buyer_name,
          phone: addressObj.phone || order.phone,
          address: addressObj.address,
          city: addressObj.city || '',
        };
      }
      return {
        name: order.buyer_name,
        phone: order.phone,
        address: addressContent,
        city: '',
      };
    }

    // Case 2: "Shipping to:" format (used in dropship orders)
    if (msg.includes('Shipping to:')) {
      const parts = msg.split('Shipping to:');
      const addressContent = parts[1].split('. Notes:')[0].trim();
      return {
        name: order.buyer_name,
        phone: order.phone,
        address: addressContent,
        city: '',
      };
    }

    return null;
  }, [order]);

  // Status mapping and step calculation
  const steps = [
    { label: 'Processing Payment', icon: CreditCard, key: 'payment_sent' },
    { label: 'Quality Check & Packing', icon: PackageCheck, key: 'verified' },
    { label: 'Dispatched', icon: Truck, key: 'dispatched' },
    { label: 'Delivered', icon: Gift, key: 'delivered' }
  ];

  const currentStatus = (order?.status || 'new').toLowerCase();

  const getStepProgress = () => {
    if (currentStatus === 'cancelled') return -1;
    if (currentStatus === 'delivered' || currentStatus === 'done') return 4;
    if (currentStatus === 'dispatched') return 3;
    if (currentStatus === 'verified' || currentStatus === 'processing' || currentStatus === 'active') return 2;
    return 1; // 'new' status / payment screenshot shared
  };

  const stepProgress = getStepProgress();

  const getStatusMessage = () => {
    if (order?.tracking_message) return order.tracking_message;

    switch (currentStatus) {
      case 'cancelled':
        return 'This order checkout has been cancelled. Please reach out to our team if you need assistance.';
      case 'delivered':
      case 'done':
        return 'Your package has been successfully delivered. We hope you love your Banarasi weaves!';
      case 'dispatched':
        return 'Great news! Your handwoven saree shipment has been dispatched from our Varanasi center and is on its way to you.';
      case 'verified':
      case 'processing':
      case 'active':
        return 'Payment verified! Your order is currently undergoing quality inspection and careful packaging at our Varanasi hub before courier dispatch.';
      default:
        return 'We have received your payment screenshot. Our finance team is verifying the transaction (this verification could take up to 2–4 hours). We will update your tracking status shortly.';
    }
  };

  // Helper to construct carrier tracking URL
  const getCarrierUrl = (carrier, number) => {
    if (!carrier || !number) return null;
    const c = carrier.toLowerCase().trim();
    const num = number.trim();
    if (c.includes('delhivery')) {
      return `https://www.delhivery.com/track/package/${num}`;
    }
    if (c.includes('bluedart') || c.includes('blue dart')) {
      return `https://www.bluedart.com/`;
    }
    if (c.includes('dtdc')) {
      return `https://www.dtdc.in/`;
    }
    if (c.includes('dhl')) {
      return `https://www.dhl.com/en/express/tracking.html?AWB=${num}`;
    }
    return `https://www.google.com/search?q=${encodeURIComponent(carrier + ' tracking ' + num)}`;
  };

  // Render order lookup page (no ID provided)
  if (!inquiryId) {
    return (
      <div className="order-tracking-container">
        <Breadcrumb items={[{ name: 'Home', url: '/', route: 'home' }, { name: 'Order Tracking' }]} navigate={navigate} />
        <div className="order-tracking-card">
          <h2 className="order-tracking-title">Track Your Order</h2>
          <p className="order-tracking-subtitle">
            Enter your order or inquiry ID to track the real-time fulfillment status of your Banarasi sarees.
          </p>
          <form onSubmit={handleLookupSubmit} className="lookup-form-wrap">
            <label className="lookup-label">Order or Inquiry ID</label>
            <div className="lookup-input-group">
              <input 
                type="text" 
                placeholder="e.g. c3f76dae-93b5-4a62-97b7-84e1837cf7b3"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="lookup-input"
                required
              />
              <button type="submit" className="lookup-btn">
                <Search size={18} /> Track
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="order-tracking-container">
      <Breadcrumb items={[{ name: 'Home', url: '/', route: 'home' }, { name: 'Order Tracking', url: '/order-tracking', route: 'order-tracking' }, { name: inquiryId }]} navigate={navigate} />

      {loading && (
        <div className="order-tracking-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="admin-sync-icon-wrap" style={{ margin: '0 auto 1.5rem', animation: 'spin 2s linear infinite' }}>
            <Compass size={24} style={{ color: 'var(--gold)' }} />
          </div>
          <p style={{ color: 'var(--muted)', fontWeight: 500 }}>Retrieving shipping details from Varanasi hub...</p>
        </div>
      )}

      {error && (
        <div className="order-tracking-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ color: '#ef4444', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <AlertCircle size={40} />
          </div>
          <h3 style={{ color: 'var(--ink)', fontSize: 'var(--h5-size)', marginBottom: '0.75rem', fontWeight: 600 }}>Tracking Unavailable</h3>
          <p style={{ color: 'var(--muted)', fontSize: 'var(--body-size)', maxWidth: '460px', margin: '0 auto 1.5rem', lineHeight: 1.6, fontWeight: 400 }}>{error}</p>
          <form onSubmit={handleLookupSubmit} className="lookup-form-wrap" style={{ maxWidth: '400px' }}>
            <div className="lookup-input-group">
              <input 
                type="text" 
                placeholder="Try another Inquiry ID"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="lookup-input"
                required
              />
              <button type="submit" className="lookup-btn">Track</button>
            </div>
          </form>
        </div>
      )}

      {order && (
        <>
          <div className="order-tracking-card">
            {/* Header Meta Strip */}
            <div className="tracking-meta-header">
              <div className="tracking-meta-left">
                <div className="tracking-id-display-row">
                  <strong className="tracking-short-id">#{String(order.id).substring(0, 8)}</strong>
                  <code className="tracking-full-id">{order.id}</code>
                  <button 
                    type="button"
                    onClick={handleCopyId}
                    className={`tracking-copy-btn ${copied ? 'copied' : ''}`}
                    title="Copy Order ID"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <div className="tracking-meta-right">
                <span className="tracking-date-val">
                  {new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {/* Step Progress Timeline */}
            <div className="tracking-steps-container">
              <div className="tracking-step-line">
                <div 
                  className="tracking-step-line-progress" 
                  style={{ width: `${Math.max(0, (Math.min(stepProgress, 4) - 1) * 33.33)}%` }}
                />
              </div>
              {steps.map((step, idx) => {
                const stepNum = idx + 1;
                const isCompleted = stepProgress >= stepNum;
                const isActive = stepProgress === stepNum;
                const StepIcon = step.icon;

                return (
                  <div 
                    key={idx} 
                    className={`tracking-step-node ${isCompleted && !isActive ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                  >
                    <div className="tracking-step-icon-wrap">
                      {isCompleted && !isActive ? <Check size={16} strokeWidth={2.5} /> : <StepIcon size={16} />}
                    </div>
                    <span className="tracking-step-label">{step.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Status Update Alert Box */}
            <div className="status-update-panel">
              <div className="status-header-row">
                <div className="status-title-group">
                  <span className="status-pulse-dot" />
                  <span className="status-title">Latest Status Update</span>
                </div>
                <span className="status-date">
                  Updated: {new Date(order.updated_at || order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <p className="status-message">"{getStatusMessage()}"</p>
            </div>

            {/* Tracking Details Grid */}
            <div className="tracking-details-grid">
              {/* Shipping Method / Carrier */}
              <div className="details-card">
                <div className="details-card-header">
                  <span className="details-card-title">
                    <Truck size={14} /> SHIPPING & FULFILLMENT
                  </span>
                </div>
                {order.tracking_carrier ? (
                  <div className="carrier-assigned-box">
                    <div className="carrier-badge-row">
                      <span className="carrier-name-tag">{order.tracking_carrier}</span>
                      {order.tracking_number && (
                        <a 
                          href={getCarrierUrl(order.tracking_carrier, order.tracking_number)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="carrier-live-track-btn"
                        >
                          Track on {order.tracking_carrier} <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    {order.tracking_number ? (
                      <p className="carrier-awb-line">
                        AWB / Tracking ID: <strong>{order.tracking_number}</strong>
                      </p>
                    ) : (
                      <p className="carrier-sub-hint">Tracking AWB is being synchronized.</p>
                    )}
                  </div>
                ) : (
                  <div className="carrier-pending-box">
                    <p className="carrier-status-note">
                      Order is undergoing 5-point quality inspection at our Varanasi fulfillment center.
                    </p>
                    <span className="carrier-pending-pill">
                      Carrier AWB will be updated upon dispatch
                    </span>
                  </div>
                )}
              </div>

              {/* Delivery Address / Dropship Info */}
              <div className="details-card">
                <div className="details-card-header">
                  <span className="details-card-title">
                    <MapPin size={14} /> DELIVERY DESTINATION
                  </span>
                </div>
                <div className="recipient-info-box">
                  <strong className="recipient-name">
                    {order.dropship_recipient_name || parsedAddress?.name || order.buyer_name || 'Customer'}
                  </strong>
                  {(order.dropship_recipient_phone || parsedAddress?.phone || order.phone) && (
                    <p className="recipient-phone">
                      Phone: {order.dropship_recipient_phone || parsedAddress?.phone || order.phone}
                    </p>
                  )}
                  <p className="recipient-address">
                    {order.dropship_recipient_address || parsedAddress?.address || (order.message && order.message.includes('Delivery Address:') ? order.message.split('Delivery Address:')[1].trim() : (order.message || 'Standard Address'))}
                  </p>
                  {(order.dropship_recipient_city || parsedAddress?.city || order.dropship_recipient_pincode || order.pincode) && (
                    <p className="recipient-pin-row">
                      {[order.dropship_recipient_city || parsedAddress?.city, order.dropship_recipient_state].filter(Boolean).join(', ')}
                      {(order.dropship_recipient_pincode || order.pincode) ? ` • PIN: ${order.dropship_recipient_pincode || order.pincode}` : ''}
                    </p>
                  )}
                  {order.is_dropship && (
                    <div className="dropship-parcel-sender">
                      Parcel Sender: <strong>{order.dropship_sender_name || 'Partner Store'}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Summary Section (Distilled) */}
            {order.items && order.items.length > 0 && (
              <div className="tracking-items-section">
                <div className="tracking-items-header">
                  <h3 className="tracking-items-title">
                    Ordered Items ({(order.items || []).length})
                  </h3>
                </div>

                <div className="tracking-items-list">
                  {order.items.map((item, index) => {
                    const itemCode = String(item.variant_code || item.sku || item.product_id || item.id || '').trim().toLowerCase();
                    const baseCode = itemCode.includes('-') ? itemCode.split('-')[0].trim() : itemCode;
                    const itemColor = String(item.color || '').trim().toLowerCase();

                    // Find product in catalog (exact match first, then baseCode fallback)
                    let matchedProduct = (catalogProducts || []).find(p => {
                      const pId = String(p.id || '').toLowerCase();
                      const pGroup = String(p.groupKey || '').toLowerCase();
                      if (pId && pId === itemCode) return true;
                      if (pGroup && pGroup === itemCode) return true;
                      if (p.variants && p.variants.some(v => String(v.code || '').toLowerCase() === itemCode)) return true;
                      return false;
                    });

                    if (!matchedProduct && baseCode) {
                      matchedProduct = (catalogProducts || []).find(p => {
                        const pId = String(p.id || '').toLowerCase();
                        const pGroup = String(p.groupKey || '').toLowerCase();
                        return (pId && pId === baseCode) || (pGroup && pGroup === baseCode);
                      });
                    }

                    let matchedVariant = null;
                    if (matchedProduct?.variants) {
                      matchedVariant = matchedProduct.variants.find(v => 
                        String(v.code || '').toLowerCase() === itemCode || 
                        (itemColor && String(v.color || v.colorName || '').toLowerCase() === itemColor)
                      );
                    }

                    // Resolve image
                    let imageSrc = item.image || item.image_url || '';
                    if (!imageSrc && matchedProduct) {
                      if (item.color && matchedProduct.colorOptions) {
                        const matchedColorOpt = matchedProduct.colorOptions.find(c => String(c.name || '').toLowerCase() === itemColor);
                        if (matchedColorOpt?.image) imageSrc = matchedColorOpt.image;
                      }
                      if (!imageSrc && item.color && matchedProduct.colorImages && matchedProduct.colorImages[item.color]) {
                        imageSrc = matchedProduct.colorImages[item.color];
                      }
                      if (!imageSrc) {
                        imageSrc = matchedVariant?.image || matchedVariant?.images?.[0] || matchedProduct.images?.[0] || '';
                      }
                    }
                    if (!imageSrc) imageSrc = fallbackProductImage;

                    // Resolve title
                    const title = item.product_title || item.title || matchedProduct?.title || matchedProduct?.name || 'Handloom Banarasi Saree';

                    // Resolve price
                    let unitPrice = Number(item.price);
                    if (!unitPrice && matchedProduct) {
                      const prices = matchedVariant?.prices || matchedProduct?.variants?.[0]?.prices || {};
                      unitPrice = Number(prices.b2r || prices.single || matchedProduct?.resellerPrice || matchedProduct?.price || 0);
                    }

                    const qty = Math.max(1, parseInt(item.quantity || 1, 10));
                    const totalPrice = unitPrice > 0 ? unitPrice * qty : null;

                    return (
                      <div key={index} className="tracking-item-row">
                        <img 
                          src={imageSrc} 
                          alt={title} 
                          className="tracking-item-img"
                          onError={(e) => { e.target.src = fallbackProductImage; }}
                        />
                        <div className="tracking-item-info">
                          <div className="tracking-item-name">{title}</div>
                          <div className="tracking-item-meta">
                            {(item.variant_code || item.sku) && (
                              <span className="item-meta-item">Code: <code>{item.variant_code || item.sku}</code></span>
                            )}
                            {item.color && (
                              <span className="item-meta-item">Color: <strong>{item.color}</strong></span>
                            )}
                            <span className="item-meta-item">Qty: {qty}</span>
                          </div>
                        </div>
                        <div className="tracking-item-price">
                          {totalPrice ? formatMoney(totalPrice) : (item.price ? formatMoney(item.price * qty) : 'Wholesale Direct')}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Items Total Summary (Distilled) */}
                <div className="tracking-total-summary-card">
                  <span>Total Order Value</span>
                  <strong>
                    {formatMoney(
                      (order.items || []).reduce((acc, it) => {
                        const unitPrice = Number(it.price) || 0;
                        const qty = Number(it.quantity) || 1;
                        return acc + (unitPrice * qty);
                      }, 0) || order.total_amount || 0
                    )}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* Action Center Links */}
          <div className="tracking-actions">
            <a 
              href={`https://wa.me/${storeConfig.phone}?text=${encodeURIComponent(
                `Hello Weave 365, I am tracking my order (${order.id}). Status is currently "${currentStatus}". Can I get an update?`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp-support"
            >
              <MessageSquareText size={16} /> <span>Chat with Support</span>
            </a>
            <button 
              type="button" 
              onClick={() => navigate('home')}
              className="btn-back-catalog"
            >
              <span>Continue Sourcing</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
