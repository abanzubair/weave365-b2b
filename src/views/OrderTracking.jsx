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
  Clock, 
  CreditCard, 
  ChevronRight, 
  AlertCircle, 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  MessageSquareText,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { formatMoney, fallbackProductImage } from '../storefrontShared.jsx';
import { storeConfig } from '../config.js';

export default function OrderTracking({ inquiryId, products = [], navigate, user }) {
  const [searchId, setSearchId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        const { data, error: rpcError } = await supabase.rpc('get_order_tracking', {
          order_id: inquiryId
        });

        if (rpcError) throw rpcError;

        if (active) {
          if (data && data.length > 0) {
            setOrder(data[0]);
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

  // Helper to parse delivery address from message block
  const parsedAddress = useMemo(() => {
    if (!order?.message) return null;
    const msg = order.message;
    const addressBlockMatch = msg.split('Delivery Address:');
    if (addressBlockMatch.length < 2) return null;
    
    const lines = addressBlockMatch[1].trim().split('\n');
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

    if (!addressObj.name || !addressObj.address) return null;
    return addressObj;
  }, [order?.message]);

  // Status mapping and step calculation
  const steps = [
    { label: 'Payment Sent', icon: CreditCard, key: 'payment_sent' },
    { label: 'Payment Received', icon: ShieldCheck, key: 'verified' },
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
        return 'Payment verified. Your order is currently being prepared and undergoes our 5-step quality verification before dispatch.';
      default:
        return 'We have received your payment screenshot. Our finance team is verifying the transaction, and we will update your tracking status shortly.';
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
      {/* Header back link */}
      <button 
        type="button" 
        onClick={() => navigate('home')} 
        className="btn-back-catalog"
        style={{ marginBottom: '1.5rem', borderWidth: 0, paddingLeft: 0 }}
      >
        <ArrowLeft size={16} /> Back to Home
      </button>

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
          <h3 style={{ color: 'var(--ink)', fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 600 }}>Tracking Unavailable</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem', maxWidth: '460px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>{error}</p>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <span className="lookup-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Order Tracking ID</span>
                <code style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 600 }}>{order.id}</code>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="lookup-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Order Date</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)' }}>
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
                    className={`tracking-step-node ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                  >
                    <div className="tracking-step-icon-wrap">
                      {isCompleted && !isActive ? <CheckCircle2 size={18} /> : <StepIcon size={18} />}
                    </div>
                    <span className="tracking-step-label">{step.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Status Update Alert Box */}
            <div className="status-update-panel">
              <div className="status-header-row">
                <span className="status-title">Latest Status Update</span>
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
                <h4><Truck size={14} /> Shipping details</h4>
                {order.tracking_carrier ? (
                  <div>
                    <p style={{ marginBottom: '0.5rem' }}>
                      Carrier: <strong>{order.tracking_carrier}</strong>
                    </p>
                    {order.tracking_number ? (
                      <p>
                        Tracking ID:{' '}
                        <a 
                          href={getCarrierUrl(order.tracking_carrier, order.tracking_number)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="tracking-id-link"
                        >
                          {order.tracking_number} <ExternalLink size={12} />
                        </a>
                      </p>
                    ) : (
                      <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Tracking number will update shortly.</p>
                    )}
                  </div>
                ) : (
                  <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                    Shipping carrier and tracking ID will be listed here as soon as the order is handed over to our shipping partner.
                  </p>
                )}
              </div>

              {/* Delivery Address */}
              <div className="details-card">
                <h4><Compass size={14} /> Delivery Address</h4>
                {parsedAddress ? (
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{parsedAddress.name}</p>
                    {parsedAddress.phone && <p style={{ fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--muted)' }}>Phone: {parsedAddress.phone}</p>}
                    <p style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>{parsedAddress.address}</p>
                    {parsedAddress.city && <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>{parsedAddress.city}</p>}
                  </div>
                ) : (
                  <p style={{ whiteSpace: 'pre-line', fontSize: '0.8rem', lineHeight: 1.4, opacity: 0.85 }}>
                    {order.message && order.message.includes('Delivery Address:') 
                      ? order.message.split('Delivery Address:')[1].trim()
                      : order.pincode ? `Shipping to pincode: ${order.pincode}` : 'Address details listed in order logs.'}
                  </p>
                )}
              </div>
            </div>

            {/* Items Summary Section */}
            {order.items && order.items.length > 0 && (
              <div className="tracking-items-section">
                <h3 className="tracking-items-title">Ordered Items ({order.items.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {order.items.map((item, index) => {
                    // Try to resolve catalog image from products array
                    const matchedProduct = products.find(p => p.id === item.product_id);
                    const imageSrc = matchedProduct?.images?.[0] || fallbackProductImage;

                    return (
                      <div key={index} className="tracking-item-row">
                        <img 
                          src={imageSrc} 
                          alt={item.product_title || 'Product'} 
                          className="tracking-item-img"
                          onError={(e) => { e.target.src = fallbackProductImage; }}
                        />
                        <div className="tracking-item-info">
                          <div className="tracking-item-name">{item.product_title || 'Premium Banarasi Saree'}</div>
                          <div className="tracking-item-meta">
                            {item.variant_code && <span>Code: <code>{item.variant_code}</code></span>}
                            {item.color && <span>Color: <strong>{item.color}</strong></span>}
                            <span>Quantity: x{item.quantity || 1}</span>
                          </div>
                        </div>
                        <div className="tracking-item-price">
                          {item.price ? formatMoney(item.price * (item.quantity || 1)) : 'TBD'}
                        </div>
                      </div>
                    );
                  })}
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
              <MessageSquareText size={18} /> Chat with Varanasi Support
            </a>
            <button 
              type="button" 
              onClick={() => navigate('home')}
              className="btn-back-catalog"
            >
              Continue Sourcing
            </button>
          </div>
        </>
      )}
    </div>
  );
}
