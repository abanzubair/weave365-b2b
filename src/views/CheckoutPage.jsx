/**
 * Dedicated Stripe-Inspired Checkout Page Component
 * Handles both Standard Shipping & White-Label Direct Dropshipping.
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  Truck,
  Package,
  ShieldCheck,
  CreditCard,
  QrCode,
  Copy,
  Check,
  ShoppingBag,
  ArrowDown,
  AlertCircle,
  Clock,
  ArrowRight,
} from '../components/icons.jsx';
import { storeConfig } from '../config.js';
import {
  calculateHybridCartTotals,
  customerPrice,
  formatMoney,
  buildWhatsappUrl,
  calculateComboDiscount,
  fallbackProductImage,
} from '../storefrontShared.jsx';

import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { recordReferral } from '../utils/influencerHelpers.js';
import QRCodeImage from '../components/QRCodeImage.jsx';
import { WhatsappIcon } from '../components/WhatsappIcon.jsx';
import '../styles/checkout.css';

export function CheckoutPage({
  items = [],
  priceAccess,
  user,
  buyerProfile,
  pincode,
  setPincode,
  codStatus,
  checkPincode,
  navigate,
  clearCart,
}) {
  // Shipping Mode: 'standard' | 'dropship'
  const [shippingMode, setShippingMode] = useState('standard');
  // Shipping Speed: 'standard' (Free) | 'expedited' (₹150/kg)
  const [shippingSpeed, setShippingSpeed] = useState('standard');

  // Address & User contact state
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [useCustomAddress, setUseCustomAddress] = useState(false);

  // Standard Recipient form fields
  const [email, setEmail] = useState(user?.email || '');
  const [formName, setFormName] = useState(
    priceAccess?.fullName || user?.user_metadata?.full_name || ''
  );
  const [formPhone, setFormPhone] = useState(
    priceAccess?.buyerPhone || user?.user_metadata?.phone || ''
  );
  const [formAddr1, setFormAddr1] = useState('');
  const [formAddr2, setFormAddr2] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formPincode, setFormPincode] = useState(pincode || '');
  const [saveToAccount, setSaveToAccount] = useState(true);

  // Dropshipping Sender form fields
  const [senderName, setSenderName] = useState(
    priceAccess?.businessName || buyerProfile?.business_name || user?.user_metadata?.business_name || ''
  );
  const [senderPhone, setSenderPhone] = useState(
    priceAccess?.buyerPhone || user?.user_metadata?.phone || ''
  );
  const [senderAddress, setSenderAddress] = useState('');
  const [senderCity, setSenderCity] = useState('');
  const [senderState, setSenderState] = useState('');
  const [senderPincode, setSenderPincode] = useState('');
  const [packingPreference, setPackingPreference] = useState(
    'Blind Packaging (Zero Supplier Branding / No Price Tags)'
  );
  const [dropshipNotes, setDropshipNotes] = useState('');

  // Payment method: 'upi' | 'whatsapp'
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [checkoutStep, setCheckoutStep] = useState('details'); // 'details' | 'payment'
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [orderError, setOrderError] = useState('');
  const [showExpressPayNotice, setShowExpressPayNotice] = useState(false);

  // Focus & viewport positioning ref for order success card
  const successCardRef = useRef(null);

  useEffect(() => {
    if (orderSuccess) {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      }
      const timer = setTimeout(() => {
        if (successCardRef.current) {
          successCardRef.current.focus?.({ preventScroll: true });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [orderSuccess]);

  // Scroll detection for product cards in order summary
  const itemsListRef = useRef(null);
  const [canScrollMore, setCanScrollMore] = useState(false);

  const checkScrollState = () => {
    const el = itemsListRef.current;
    if (el) {
      const hasScrollableContent = el.scrollHeight > el.clientHeight + 4;
      const isNotAtBottom = el.scrollTop + el.clientHeight < el.scrollHeight - 10;
      setCanScrollMore(hasScrollableContent && isNotAtBottom);
    }
  };

  useEffect(() => {
    checkScrollState();
    const timer = setTimeout(checkScrollState, 350);
    window.addEventListener('resize', checkScrollState);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScrollState);
    };
  }, [items]);

  const handleScrollMore = () => {
    if (itemsListRef.current) {
      itemsListRef.current.scrollBy({ top: 140, behavior: 'smooth' });
    }
  };

  const handleExpressPayClick = () => {
    setShowExpressPayNotice(true);
    setTimeout(() => setShowExpressPayNotice(false), 4000);
  };

  // Fetch saved addresses for logged-in user
  useEffect(() => {
    async function loadSavedAddresses() {
      if (!user?.id || !isSupabaseConfigured) return;
      try {
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false });
        if (error) throw error;

        if (data && data.length > 0) {
          setAddresses(data);
          const defaultAddr = data.find((a) => a.is_default) || data[0];
          setSelectedAddressId(defaultAddr.id);
          applySavedAddress(defaultAddr);
        } else {
          setUseCustomAddress(true);
        }
      } catch (err) {
        console.error('Failed to load saved addresses:', err);
        setUseCustomAddress(true);
      }
    }
    loadSavedAddresses();
  }, [user?.id]);

  // Sync pincode changes
  useEffect(() => {
    if (pincode) {
      setFormPincode(pincode);
    }
  }, [pincode]);

  const applySavedAddress = (addr) => {
    if (!addr) return;
    setFormName(addr.full_name || '');
    setFormPhone(addr.phone_number || '');
    setFormAddr1(addr.address_line1 || '');
    setFormAddr2(addr.address_line2 || '');
    setFormCity(addr.city || '');
    setFormState(addr.state || '');
    setFormPincode(addr.pincode || '');
    if (setPincode && addr.pincode) {
      setPincode(addr.pincode);
    }
  };

  const handleSavedAddressSelect = (addrId) => {
    setSelectedAddressId(addrId);
    if (addrId === 'new') {
      setUseCustomAddress(true);
      setFormName('');
      setFormPhone('');
      setFormAddr1('');
      setFormAddr2('');
      setFormCity('');
      setFormState('');
      setFormPincode('');
    } else {
      setUseCustomAddress(false);
      const addr = addresses.find((a) => a.id === addrId);
      applySavedAddress(addr);
    }
  };

  // Financial calculations
  const canViewPrices = priceAccess?.canViewPrices !== false;
  const { subtotal, discount, baseTotal, productPricing } = useMemo(() => {
    if (!canViewPrices || !items.length) {
      return { subtotal: 0, discount: 0, baseTotal: 0, productPricing: {} };
    }
    const totals = calculateHybridCartTotals(items, priceAccess);
    return {
      subtotal: totals.subtotal,
      discount: totals.discount,
      baseTotal: totals.total,
      productPricing: totals.productPricing || {},
    };
  }, [canViewPrices, items, priceAccess]);

  const hasSets = Object.values(productPricing || {}).some((p) => p.completeSets > 0);

  // Weight & Shipping Fee calculation
  const { totalWeightKg, billedWeightKg, standardShippingFee, expeditedShippingFee, shippingFee } = useMemo(() => {
    let totalGrams = 0;
    (items || []).forEach((item) => {
      const qty = Number(item.quantity) || 1;
      const rawW = item.product?.weight;
      let grams = 800; // default saree/suit set weight is 800g (0.8 kg)
      if (rawW && !isNaN(Number(rawW))) {
        const num = Number(rawW);
        grams = num > 15 ? num : num * 1000;
      }
      totalGrams += Math.round(grams) * qty;
    });

    const totalKg = totalGrams / 1000;
    const billedKg = Math.max(1, Math.ceil(totalGrams / 1000));
    // Standard shipping: Free across all orders
    const stdFee = 0;
    const expFee = billedKg * 150;
    const actualFee = shippingSpeed === 'expedited' ? expFee : stdFee;

    return {
      totalWeightKg: totalKg,
      billedWeightKg: billedKg,
      standardShippingFee: stdFee,
      expeditedShippingFee: expFee,
      shippingFee: actualFee,
    };
  }, [items, shippingSpeed]);


  const grossItemsTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const singlePrice = Number(
        item.variant?.prices?.b2r ||
        item.variant?.prices?.single ||
        item.variant?.prices?.reseller ||
        item.variant?.prices?.mrp ||
        item.variant?.prices?.offer ||
        item.product?.resellerPrice ||
        item.product?.price ||
        0
      );
      return sum + (singlePrice * (Number(item.quantity) || 1));
    }, 0);
  }, [items]);

  const bulkDiscount = useMemo(() => {
    return Math.max(0, grossItemsTotal - (baseTotal || 0));
  }, [grossItemsTotal, baseTotal]);

  const total = Math.max(0, (baseTotal || 0) - (discount || 0)) + shippingFee;

  const { baseAmount, gstAmount } = useMemo(() => {
    const netItems = Math.max(0, (baseTotal || 0) - (discount || 0));
    const base = Number((netItems / 1.05).toFixed(2));
    const gst = Number((netItems - base).toFixed(2));
    return { baseAmount: base, gstAmount: gst };
  }, [baseTotal, discount]);


  const upiId = storeConfig.upiId || 'weave365@upi';
  const rawUpiUrl = useMemo(
    () => `upi://pay?pa=${upiId}&pn=${encodeURIComponent(storeConfig.name || 'Weave365')}&am=${total || 0}&cu=INR&tn=${encodeURIComponent('Order Payment')}`,
    [total, upiId]
  );

  const copyUpiId = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(storeConfig.upiId || 'weave365@upi');
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const handlePincodeChange = (val) => {
    setFormPincode(val);
    if (setPincode) setPincode(val);
    if (val.length === 6 && checkPincode) {
      checkPincode();
    }
  };

  const getValidatedDeliveryDetails = () => {
    if (!formName.trim() || !formPhone.trim() || !formAddr1.trim() || !formCity.trim() || !formState.trim() || !formPincode.trim()) {
      alert('Please fill in all required delivery address fields.');
      return null;
    }

    if (shippingMode === 'dropship' && (!senderName.trim() || !senderPhone.trim() || !senderAddress.trim() || !senderCity.trim() || !senderState.trim() || !senderPincode.trim())) {
      alert('Please complete all required Reseller (Sender) Details for white-label dropshipping.');
      return null;
    }

    return {
      full_name: formName.trim(),
      phone_number: formPhone.trim(),
      address_line1: formAddr1.trim(),
      address_line2: formAddr2.trim() || null,
      city: formCity.trim(),
      state: formState.trim(),
      pincode: formPincode.trim(),
      is_dropship: shippingMode === 'dropship',
      dropship_sender_name: shippingMode === 'dropship' ? senderName.trim() : null,
      dropship_sender_phone: shippingMode === 'dropship' ? senderPhone.trim() : null,
      dropship_sender_address: shippingMode === 'dropship' ? senderAddress.trim() : null,
      dropship_sender_city: shippingMode === 'dropship' ? senderCity.trim() : null,
      dropship_sender_state: shippingMode === 'dropship' ? senderState.trim() : null,
      dropship_sender_pincode: shippingMode === 'dropship' ? senderPincode.trim() : null,
      dropship_packing_preference: shippingMode === 'dropship' ? packingPreference : null,
    };
  };

  const recordOrderReceived = async (deliveryDetails, currentWhatsappUrl, method = paymentMethod, utr = upiTransactionId) => {
    setIsSubmitting(true);
    setOrderError('');

    try {
      const isDropshipOrder = Boolean(deliveryDetails.is_dropship);
      const utrNote = utr
        ? `Paid via UPI. UTR/Ref: ${utr} (Payment Pending Verification)`
        : (method === 'whatsapp' ? 'Direct WhatsApp Order' : 'Paid via UPI (Screenshot on WhatsApp)');
      const finalNotes = dropshipNotes ? `${dropshipNotes} | ${utrNote}` : utrNote;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || null,
          email: email || user?.email || '',
          payment_method: method,
          shipping_mode: shippingMode,
          shipping_speed: shippingSpeed,
          delivery_details: deliveryDetails,
          dropship_details: {
            sender_name: senderName,
            sender_phone: senderPhone,
            sender_address: senderAddress,
            sender_city: senderCity,
            sender_state: senderState,
            sender_pincode: senderPincode,
            packing_preference: packingPreference,
          },
          items: items.map(item => ({
            product_id: item.productGroupKey,
            product_title: item.product?.title || '',
            variant_code: item.variant?.code || '',
            color: item.selectedColorName || 'Standard',
            quantity: item.quantity,
            price: customerPrice(item.variant?.prices, priceAccess),
          })),
          total_amount: total,
          notes: finalNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit order. Please check details and try again.');
      }

      const newOrderId = data.orderId;
      setCreatedOrder({
        id: newOrderId,
        orderNumber: data.orderNumber || (newOrderId ? newOrderId.slice(0, 8).toUpperCase() : 'ORD'),
        total,
        paymentMethod: method,
        deliveryDetails,
        whatsappUrl: currentWhatsappUrl,
        upiTransactionId: utr,
      });

      // Track influencer referral if applicable
      const saleAmount = items.reduce((sum, it) => sum + (Number(customerPrice(it.variant?.prices, priceAccess)) || 0) * (Number(it.quantity) || 1), 0);
      void recordReferral({
        orderId: newOrderId,
        buyerId: priceAccess?.userId || user?.id || null,
        buyerName: priceAccess?.buyerName || deliveryDetails.full_name || 'Guest Buyer',
        items: items.map(item => ({
          product_id: item.productGroupKey,
          product_title: item.product?.title || '',
          variant_code: item.variant?.code || '',
          color: item.selectedColorName || '',
          quantity: item.quantity,
          price: customerPrice(item.variant?.prices, priceAccess),
        })),
        saleAmount: saleAmount,
      });

      if (clearCart) {
        clearCart();
      }

      if (method === 'whatsapp' || method === 'upi_screenshot') {
        try {
          window.open(currentWhatsappUrl, '_blank');
        } catch (e) {
          console.warn('Popup blocked, order success screen ready:', e);
        }
      }

      setOrderSuccess(true);
    } catch (err) {
      console.error('Failed to record order:', err);
      setOrderError(err.message || 'Unable to place order right now. Please try again or place order via WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalOrderSubmit = async (method = paymentMethod, customUtr = upiTransactionId) => {
    const deliveryDetails = getValidatedDeliveryDetails();
    if (!deliveryDetails) return;

    // Save address if user checked save box and not dropshipping
    if (saveToAccount && user?.id && isSupabaseConfigured && shippingMode === 'standard' && useCustomAddress) {
      try {
        await supabase.from('addresses').insert({
          user_id: user.id,
          full_name: deliveryDetails.full_name,
          phone_number: deliveryDetails.phone_number,
          address_line1: deliveryDetails.address_line1,
          address_line2: deliveryDetails.address_line2,
          city: deliveryDetails.city,
          state: deliveryDetails.state,
          pincode: deliveryDetails.pincode,
          country: 'India',
        });
      } catch (err) {
        console.error('Error saving address:', err);
      }
    }

    const targetPhone = String(storeConfig.whatsapp || '9919101369').replace(/\D/g, '');
    const waPhone = targetPhone.startsWith('91') ? targetPhone : `91${targetPhone}`;
    const waText = method === 'whatsapp'
      ? `Hello Weave365, I would like to place an order for ${items.length} items (Total: ₹${total}). Delivery to: ${deliveryDetails.full_name}, ${deliveryDetails.city} - ${deliveryDetails.pincode}. Please confirm availability and dispatch.`
      : `Hello Weave365, I have completed the UPI payment of ₹${total} to 9919101369@kotak for my order to ${deliveryDetails.city}.${customUtr ? ` UPI Ref/UTR: ${customUtr}.` : ''} Please find my payment screenshot attached for verification.`;

    const currentWhatsappUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`;

    await recordOrderReceived(deliveryDetails, currentWhatsappUrl, method, customUtr);
  };

  const handleProceedToPayment = (e) => {
    e?.preventDefault();
    if (!items.length) return;
    setOrderError('');

    const deliveryDetails = getValidatedDeliveryDetails();
    if (!deliveryDetails) return;

    if (paymentMethod === 'whatsapp') {
      handleFinalOrderSubmit('whatsapp');
      return;
    }

    // Advance to Step 2: Payment & Proof
    setCheckoutStep('payment');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleUtrSubmit = () => {
    const cleanUtr = upiTransactionId.trim();
    if (!cleanUtr) {
      alert('Please enter the 12-digit UPI Reference / UTR Number from your payment receipt, or choose Option B below to send your payment screenshot on WhatsApp.');
      return;
    }
    if (cleanUtr.length < 6) {
      alert('Please enter a valid UPI Reference / UTR Number (usually 12 digits).');
      return;
    }
    handleFinalOrderSubmit('upi', cleanUtr);
  };

  const handleWhatsAppScreenshotSubmit = () => {
    handleFinalOrderSubmit('upi_screenshot', '');
  };

  if (!items.length && !orderSuccess) {
    return (
      <div className="checkout-page-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '60px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: '440px', margin: '0 auto' }}>
          <ShoppingBag size={56} style={{ color: 'var(--muted)', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '10px' }}>Your checkout cart is empty</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '24px' }}>
            Explore our curated luxury textile catalogue to add items to your cart.
          </p>
          <button
            type="button"
            className="checkout-submit-btn"
            onClick={() => navigate('catalogue')}
            style={{ width: 'auto', padding: '0 28px', margin: '0 auto' }}
          >
            <ArrowLeft size={18} /> Return to Catalogue
          </button>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    const isWhatsappOrder = (createdOrder?.paymentMethod || paymentMethod) === 'whatsapp';
    const recipient = createdOrder?.deliveryDetails || {};
    const orderRef = createdOrder?.orderNumber || (createdOrder?.id ? createdOrder.id.slice(0, 8).toUpperCase() : 'ORD-NEW');
    const orderTotal = createdOrder?.total || total;
    const utr = createdOrder?.upiTransactionId || upiTransactionId;

    return (
      <div
        className="checkout-page-container"
        style={{
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '28px 16px 40px',
        }}
      >
        <div
          ref={successCardRef}
          tabIndex={-1}
          style={{
            maxWidth: '490px',
            width: '100%',
            backgroundColor: '#ffffff',
            padding: '30px 24px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.05)',
            textAlign: 'center',
            outline: 'none',
            scrollMarginTop: '100px',
          }}
        >
          {/* Status Icon & Indicator */}
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: isWhatsappOrder ? '#f0fdf4' : '#f0f9ff',
              border: `1px solid ${isWhatsappOrder ? '#bbf7d0' : '#bae6fd'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}
          >
            {isWhatsappOrder ? (
              <WhatsappIcon size={26} />
            ) : (
              <Clock size={24} style={{ color: '#0284c7' }} />
            )}
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.025em' }}>
            {isWhatsappOrder ? 'Order Registered on WhatsApp' : 'Order Placed Successfully'}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
            <span style={{ color: '#64748b', fontSize: '0.86rem' }}>
              Order Reference: <strong style={{ color: '#0f172a', letterSpacing: '0.5px' }}>#{orderRef}</strong>
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: isWhatsappOrder ? '#fef3c7' : '#f0f9ff',
                color: isWhatsappOrder ? '#92400e' : '#0369a1',
                border: `1px solid ${isWhatsappOrder ? '#fde68a' : '#bae6fd'}`,
                fontSize: '0.74rem',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '12px',
                letterSpacing: '0.02em',
              }}
            >
              <Clock size={11} />
              {isWhatsappOrder ? 'WhatsApp Order' : 'Payment Verification Pending'}
            </span>
          </div>

          {/* Clean Flat Summary Rows — NO NESTED CARDS */}
          <div
            style={{
              textAlign: 'left',
              padding: '14px 0',
              borderTop: '1px solid #f1f5f9',
              borderBottom: '1px solid #f1f5f9',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              fontSize: '0.86rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px' }}>
              <span style={{ color: '#64748b' }}>Deliver To</span>
              <span style={{ fontWeight: '600', color: '#0f172a', textAlign: 'right' }}>
                {recipient.full_name || formName} ({recipient.phone_number || formPhone})
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px' }}>
              <span style={{ color: '#64748b' }}>Destination</span>
              <span style={{ color: '#0f172a', textAlign: 'right', maxWidth: '280px' }}>
                {recipient.address_line1 || formAddr1}, {recipient.city || formCity}, {recipient.state || formState} - {recipient.pincode || formPincode}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px' }}>
              <span style={{ color: '#64748b' }}>Amount Due</span>
              <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.96rem' }}>
                {formatMoney(orderTotal, 2)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px' }}>
              <span style={{ color: '#64748b' }}>Estimated Delivery</span>
              <span style={{ color: '#0f172a', fontWeight: '500' }}>
                {shippingSpeed === 'expedited' ? '2–3 Business Days' : '4–5 Business Days'}
              </span>
            </div>

            {utr && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px', paddingTop: '2px' }}>
                <span style={{ color: '#64748b' }}>Submitted UTR</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0369a1', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                  {utr}
                </span>
              </div>
            )}
          </div>

          {/* Contextual Notice */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #f1f5f9',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '18px',
              textAlign: 'left',
              fontSize: '0.8rem',
              color: '#475569',
              lineHeight: '1.45',
            }}
          >
            <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '2px', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isWhatsappOrder ? 'Next Steps' : 'Payment Verification'}
            </div>
            {isWhatsappOrder
              ? 'We have recorded your order details. Connect with our Varanasi weaving desk on WhatsApp to confirm availability and parcel dispatch.'
              : utr
              ? 'We will verify your payment against your UTR (typically within 15–30 minutes). You will receive a WhatsApp dispatch confirmation once matched.'
              : 'Please tap below to send your payment screenshot on WhatsApp so we can verify your payment and immediately dispatch your parcel.'}
          </div>

          {/* Primary & Secondary Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {createdOrder?.whatsappUrl && (
              <a
                href={createdOrder.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: '#4A5A31',
                  color: '#ffffff',
                  padding: '11px 20px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(74, 90, 49, 0.25)',
                  transition: 'background-color 0.2s',
                }}
              >
                <WhatsappIcon size={18} />
                {isWhatsappOrder
                  ? 'Open WhatsApp to Confirm Dispatch'
                  : utr
                  ? 'Message Weaver Desk on WhatsApp'
                  : 'Send Payment Screenshot on WhatsApp'}
              </a>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="checkout-submit-btn"
                onClick={() => navigate('account')}
                style={{ flex: 1, height: '42px', fontSize: '0.85rem' }}
              >
                View My Orders
              </button>
              <button
                type="button"
                className="shipping-mode-btn"
                onClick={() => navigate('catalogue')}
                style={{ flex: 1, height: '42px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page-container">
      <div className="checkout-grid">
        {/* Left Pane: Stripe-Style Order Summary */}
        <div className="checkout-summary-pane">
          <div>
            <div className="checkout-brand-header">
              <button
                type="button"
                className="checkout-back-link"
                onClick={() => navigate('catalogue')}
              >
                <ArrowLeft size={16} /> Store
              </button>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span style={{ fontWeight: '700', fontSize: '1rem', letterSpacing: '-0.01em' }}>
                Weave 365
              </span>
            </div>

            <div className="checkout-pay-title">Pay Weave365</div>
            <div className="checkout-total-amount">{formatMoney(total, 2)}</div>

            {/* Cart Items List */}
            <div className="checkout-items-wrapper">
              <div
                className="checkout-items-list"
                ref={itemsListRef}
                onScroll={checkScrollState}
              >
                {items.map((item, idx) => {
                  const itemSinglePrice = Number(
                    item.variant?.prices?.b2r ||
                    item.variant?.prices?.single ||
                    item.variant?.prices?.reseller ||
                    item.variant?.prices?.mrp ||
                    item.variant?.prices?.offer ||
                    item.product?.resellerPrice ||
                    item.product?.price ||
                    0
                  );
                  const itemImg = item.selectedColorImage || item.variant?.image || item.product?.images?.[0] || fallbackProductImage;

                  return (
                    <div className="checkout-item-row" key={`${item.productGroupKey}-${item.variantCode}-${idx}`}>
                      <img src={itemImg} alt={item.product?.title || 'Product'} className="checkout-item-thumb" />
                      <div className="checkout-item-details">
                        <div className="checkout-item-name">{item.product?.title}</div>
                        <div className="checkout-item-variant">
                          Color: {item.selectedColorName || 'Standard'} {item.variant?.code ? `• SKU: ${item.variant.code}` : ''} • Qty: {item.quantity}
                        </div>
                      </div>
                      <div className="checkout-item-price">
                        {canViewPrices ? formatMoney(itemSinglePrice * item.quantity) : priceNoticeForAccess(priceAccess)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {canScrollMore && (
                <button
                  type="button"
                  className="checkout-scroll-indicator"
                  onClick={handleScrollMore}
                  title="Scroll down for more cards"
                  aria-label="Scroll down for more cards"
                >
                  <ArrowDown size={16} />
                </button>
              )}
            </div>

            {/* Financial Summary Table */}
            <div className="checkout-financial-table">
              {bulkDiscount > 0 && (
                <>
                  <div className="checkout-summary-row">
                    <span>Items Total</span>
                    <span>{formatMoney(grossItemsTotal)}</span>
                  </div>

                  <div className="checkout-summary-row" style={{ color: '#16a34a', fontWeight: '600' }}>
                    <span>Bulk Buyer Discount</span>
                    <span>-{formatMoney(bulkDiscount)}</span>
                  </div>
                </>
              )}

              <div className="checkout-summary-row">
                <span>Taxable Amount</span>
                <span style={{ color: '#0f172a', fontWeight: '500' }}>{formatMoney(baseAmount, 2)}</span>
              </div>

              <div className="checkout-summary-row">
                <span>GST 5%</span>
                <span style={{ color: '#0f172a', fontWeight: '500' }}>{formatMoney(gstAmount, 2)}</span>
              </div>

              {discount > 0 && (
                <div className="checkout-summary-row" style={{ color: '#16a34a', fontWeight: '600' }}>
                  <span>Combo Discount</span>
                  <span>-{formatMoney(discount)}</span>
                </div>
              )}

              <div className="checkout-summary-row">
                <span>Shipping ({shippingSpeed === 'expedited' ? 'Express' : 'Standard'})</span>
                <span style={{ color: '#0f172a', fontWeight: '500' }}>
                  {shippingSpeed === 'expedited'
                    ? formatMoney(expeditedShippingFee, 2)
                    : formatMoney(0, 2)}
                </span>
              </div>

              <div className="checkout-summary-row total-row">
                <span>Total</span>
                <span>{formatMoney(total, 2)}</span>
              </div>
            </div>
          </div>

          <div className="checkout-footer-notes">
            <span>Powered by <strong>Weave365</strong></span>
            <div className="checkout-footer-links">
              <a href="/terms-conditions" target="_blank" rel="noreferrer">Terms</a>
              <a href="/privacy-security" target="_blank" rel="noreferrer">Privacy</a>
            </div>
          </div>
        </div>

        {/* Right Pane: Stripe-Style Checkout Form / 2-Step Flow */}
        <div className="checkout-form-pane">
          {checkoutStep === 'details' ? (
            <>
              {/* Top Step Breadcrumb */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: '#0f172a', color: '#fff', fontSize: '0.8rem', fontWeight: '700' }}>1</span>
                  Step 1: Delivery Details
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: '500', color: '#94a3b8' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9', color: '#94a3b8', fontSize: '0.8rem', fontWeight: '700' }}>2</span>
                  Step 2: Pay & Confirm
                </div>
              </div>

              {/* Shipping Mode Segmented Control (Standard vs Dropshipping) */}
              <div className="shipping-mode-control">
                <div className="shipping-mode-label">Select Shipping Method</div>
                <div className="shipping-mode-toggle">
                  <button
                    type="button"
                    className={`shipping-mode-btn ${shippingMode === 'standard' ? 'active' : ''}`}
                    onClick={() => setShippingMode('standard')}
                  >
                    <Truck size={16} /> Ship to
                  </button>
                  <button
                    type="button"
                    className={`shipping-mode-btn ${shippingMode === 'dropship' ? 'active' : ''}`}
                    onClick={() => setShippingMode('dropship')}
                  >
                    <Package size={16} /> Dropship to
                  </button>
                </div>
                <div className={`shipping-mode-info ${shippingMode}`}>
                  {shippingMode === 'dropship' ? (
                    <>
                      <ShieldCheck size={16} className="shipping-info-icon" />
                      <span>100% white label dispatch, no weave 365 branding or pricing included.</span>
                    </>
                  ) : (
                    <>
                      <Truck size={16} className="shipping-info-icon" />
                      <span>Direct dispatch to your business or home address with standard Weave365 invoice.</span>
                    </>
                  )}
                </div>
              </div>

              <form onSubmit={handleProceedToPayment} className="checkout-form-group">
                {/* Standard Shipping Form */}
                {shippingMode === 'standard' ? (
                  <>
                    <div className="checkout-section-title">
                      <Truck size={18} /> Shipping Information
                    </div>

                    <div className="checkout-field">
                      <label htmlFor="checkout-email">Email Address</label>
                      <input
                        id="checkout-email"
                        type="email"
                        className="checkout-input"
                        placeholder="name@business.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    {/* Saved Address Picker if available */}
                    {addresses.length > 0 && (
                      <div className="checkout-field">
                        <label>Saved Delivery Addresses</label>
                        <div className="saved-address-cards">
                          {addresses.map((addr) => (
                            <label
                              key={addr.id}
                              className={`saved-address-option ${
                                selectedAddressId === addr.id && !useCustomAddress ? 'selected' : ''
                              }`}
                            >
                              <input
                                type="radio"
                                name="savedAddress"
                                checked={selectedAddressId === addr.id && !useCustomAddress}
                                onChange={() => handleSavedAddressSelect(addr.id)}
                              />
                              <div className="saved-address-text">
                                <strong>{addr.full_name}</strong> ({addr.phone_number})<br />
                                {addr.address_line1}, {addr.address_line2 ? addr.address_line2 + ', ' : ''}
                                {addr.city}, {addr.state} - {addr.pincode}
                              </div>
                            </label>
                          ))}
                          <label
                            className={`saved-address-option ${useCustomAddress ? 'selected' : ''}`}
                          >
                            <input
                              type="radio"
                              name="savedAddress"
                              checked={useCustomAddress}
                              onChange={() => handleSavedAddressSelect('new')}
                            />
                            <div className="saved-address-text">
                              <strong>+ Enter New Delivery Address</strong>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}

                    {(useCustomAddress || addresses.length === 0) && (
                      <>
                        <div className="checkout-input-row">
                          <div className="checkout-field">
                            <label htmlFor="checkout-name">Recipient Full Name *</label>
                            <input
                              id="checkout-name"
                              type="text"
                              className="checkout-input"
                              placeholder="Full Name"
                              value={formName}
                              onChange={(e) => setFormName(e.target.value)}
                              required
                            />
                          </div>
                          <div className="checkout-field">
                            <label htmlFor="checkout-phone">Phone Number *</label>
                            <input
                              id="checkout-phone"
                              type="tel"
                              className="checkout-input"
                              placeholder="10-digit mobile number"
                              value={formPhone}
                              onChange={(e) => setFormPhone(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="checkout-field">
                          <label htmlFor="checkout-addr1">Address Line 1 *</label>
                          <input
                            id="checkout-addr1"
                            type="text"
                            className="checkout-input"
                            placeholder="House / Shop No., Building, Street Name"
                            value={formAddr1}
                            onChange={(e) => setFormAddr1(e.target.value)}
                            required
                          />
                        </div>

                        <div className="checkout-field">
                          <label htmlFor="checkout-addr2">Address Line 2 (Optional)</label>
                          <input
                            id="checkout-addr2"
                            type="text"
                            className="checkout-input"
                            placeholder="Landmark, Area, Sector"
                            value={formAddr2}
                            onChange={(e) => setFormAddr2(e.target.value)}
                          />
                        </div>

                        <div className="checkout-input-row">
                          <div className="checkout-field">
                            <label htmlFor="checkout-city">City *</label>
                            <input
                              id="checkout-city"
                              type="text"
                              className="checkout-input"
                              placeholder="City"
                              value={formCity}
                              onChange={(e) => setFormCity(e.target.value)}
                              required
                            />
                          </div>
                          <div className="checkout-field">
                            <label htmlFor="checkout-state">State *</label>
                            <input
                              id="checkout-state"
                              type="text"
                              className="checkout-input"
                              placeholder="State"
                              value={formState}
                              onChange={(e) => setFormState(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="checkout-input-row">
                          <div className="checkout-field">
                            <label htmlFor="checkout-pincode">Pincode *</label>
                            <input
                              id="checkout-pincode"
                              type="text"
                              className="checkout-input"
                              placeholder="6-digit pincode"
                              maxLength={6}
                              value={formPincode}
                              onChange={(e) => handlePincodeChange(e.target.value)}
                              required
                            />
                          </div>
                          <div className="checkout-field">
                            <label>Country</label>
                            <input type="text" className="checkout-input" value="India" disabled />
                          </div>
                        </div>

                        {user?.id && (
                          <div className="checkout-checkbox-row">
                            <input
                              type="checkbox"
                              id="save-address"
                              checked={saveToAccount}
                              onChange={(e) => setSaveToAccount(e.target.checked)}
                            />
                            <label htmlFor="save-address">Save this address to my Weave365 account</label>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {/* Dropshipping Form */}
                    <div className="checkout-section-title">
                      <Package size={18} /> Reseller Sender Information (Printed on Courier Label)
                    </div>

                    <div className="checkout-input-row">
                      <div className="checkout-field">
                        <label htmlFor="sender-name">Your Boutique / Business Name *</label>
                        <input
                          id="sender-name"
                          type="text"
                          className="checkout-input"
                          placeholder="Your brand / store name"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="checkout-field">
                        <label htmlFor="sender-phone">Your Contact Phone *</label>
                        <input
                          id="sender-phone"
                          type="tel"
                          className="checkout-input"
                          placeholder="Reseller contact phone"
                          value={senderPhone}
                          onChange={(e) => setSenderPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="checkout-field">
                      <label htmlFor="sender-address">Address Line *</label>
                      <input
                        id="sender-address"
                        type="text"
                        className="checkout-input"
                        placeholder="Street / Area for shipping label"
                        value={senderAddress}
                        onChange={(e) => setSenderAddress(e.target.value)}
                        required
                      />
                    </div>

                    <div className="checkout-input-row">
                      <div className="checkout-field">
                        <label htmlFor="sender-city">City *</label>
                        <input
                          id="sender-city"
                          type="text"
                          className="checkout-input"
                          placeholder="City"
                          value={senderCity}
                          onChange={(e) => setSenderCity(e.target.value)}
                          required
                        />
                      </div>
                      <div className="checkout-field">
                        <label htmlFor="sender-state">State *</label>
                        <input
                          id="sender-state"
                          type="text"
                          className="checkout-input"
                          placeholder="State"
                          value={senderState}
                          onChange={(e) => setSenderState(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="checkout-input-row">
                      <div className="checkout-field">
                        <label htmlFor="sender-pincode">Pincode *</label>
                        <input
                          id="sender-pincode"
                          type="text"
                          className="checkout-input"
                          placeholder="6-digit pincode"
                          maxLength={6}
                          value={senderPincode}
                          onChange={(e) => setSenderPincode(e.target.value)}
                          required
                        />
                      </div>
                      <div className="checkout-field">
                        <label>Country</label>
                        <input type="text" className="checkout-input" value="India" disabled />
                      </div>
                    </div>

                    <div className="checkout-section-title" style={{ marginTop: '16px' }}>
                      <Truck size={18} /> Customer Delivery Address (Recipient)
                    </div>

                    <div className="checkout-input-row">
                      <div className="checkout-field">
                        <label htmlFor="recipient-name">Full Name *</label>
                        <input
                          id="recipient-name"
                          type="text"
                          className="checkout-input"
                          placeholder="End customer name"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="checkout-field">
                        <label htmlFor="recipient-phone">Mobile Number *</label>
                        <input
                          id="recipient-phone"
                          type="tel"
                          className="checkout-input"
                          placeholder="Customer phone"
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="checkout-field">
                      <label htmlFor="recipient-addr1">Street Address *</label>
                      <input
                        id="recipient-addr1"
                        type="text"
                        className="checkout-input"
                        placeholder="Full street address"
                        value={formAddr1}
                        onChange={(e) => setFormAddr1(e.target.value)}
                        required
                      />
                    </div>

                    <div className="checkout-input-row">
                      <div className="checkout-field">
                        <label htmlFor="recipient-city">City *</label>
                        <input
                          id="recipient-city"
                          type="text"
                          className="checkout-input"
                          placeholder="City"
                          value={formCity}
                          onChange={(e) => setFormCity(e.target.value)}
                          required
                        />
                      </div>
                      <div className="checkout-field">
                        <label htmlFor="recipient-state">State *</label>
                        <input
                          id="recipient-state"
                          type="text"
                          className="checkout-input"
                          placeholder="State"
                          value={formState}
                          onChange={(e) => setFormState(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="checkout-input-row">
                      <div className="checkout-field">
                        <label htmlFor="recipient-pincode">Pincode *</label>
                        <input
                          id="recipient-pincode"
                          type="text"
                          className="checkout-input"
                          placeholder="6-digit pincode"
                          maxLength={6}
                          value={formPincode}
                          onChange={(e) => handlePincodeChange(e.target.value)}
                          required
                        />
                      </div>
                      <div className="checkout-field">
                        <label>Country</label>
                        <input type="text" className="checkout-input" value="India" disabled />
                      </div>
                    </div>
                  </>
                )}

                <div className="checkout-section-title" style={{ marginTop: '20px' }}>
                  <Truck size={18} /> Shipping Method
                </div>

                <div className="shipping-speed-group">
                  <label
                    className={`shipping-speed-card ${shippingSpeed === 'standard' ? 'selected' : ''}`}
                    onClick={() => setShippingSpeed('standard')}
                  >
                    <div className="shipping-speed-left">
                      <input
                        type="radio"
                        name="shipping_speed"
                        value="standard"
                        checked={shippingSpeed === 'standard'}
                        onChange={() => setShippingSpeed('standard')}
                      />
                      <div className="shipping-speed-text">
                        <div>
                          <strong>Standard Shipping:</strong>{' '}
                          <span style={{ color: '#16a34a', fontWeight: '600' }}>FREE</span>
                        </div>
                        <div className="shipping-delivery-days">
                          Estimated Delivery: <strong>{hasSets ? '6–8 Business Days' : '4–5 Business Days'}</strong>
                        </div>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`shipping-speed-card ${shippingSpeed === 'expedited' ? 'selected' : ''}`}
                    onClick={() => setShippingSpeed('expedited')}
                  >
                    <div className="shipping-speed-left">
                      <input
                        type="radio"
                        name="shipping_speed"
                        value="expedited"
                        checked={shippingSpeed === 'expedited'}
                        onChange={() => setShippingSpeed('expedited')}
                      />
                      <div className="shipping-speed-text">
                        <div><strong>Expedited Shipping:</strong> Additional Courier Charges Apply</div>
                        <div className="shipping-delivery-days">Estimated Delivery: <strong>2–3 Business Days</strong></div>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Payment Route Selection */}
                <div className="checkout-section-title" style={{ marginTop: '20px' }}>
                  <CreditCard size={18} /> Payment Preference
                </div>

                <div className="payment-method-group">
                  {/* Option 1: Direct UPI / QR Bank Transfer */}
                  <label
                    className={`payment-method-card ${paymentMethod === 'upi' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('upi')}
                  >
                    <div className="payment-method-left">
                      <input
                        type="radio"
                        name="paymentType"
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                      />
                      <div>
                        <span className="payment-method-title">Direct UPI / QR Transfer</span>
                        <div className="payment-method-desc">GPay, PhonePe, Paytm, BHIM or NetBanking. Proceed to Step 2 to scan QR.</div>
                      </div>
                    </div>
                    <QrCode size={20} style={{ color: '#0f172a' }} />
                  </label>

                  {/* Option 2: Confirm & Order on WhatsApp */}
                  <label
                    className={`payment-method-card ${paymentMethod === 'whatsapp' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('whatsapp')}
                  >
                    <div className="payment-method-left">
                      <input
                        type="radio"
                        name="paymentType"
                        checked={paymentMethod === 'whatsapp'}
                        onChange={() => setPaymentMethod('whatsapp')}
                      />
                      <div>
                        <span className="payment-method-title">Direct Order on WhatsApp</span>
                        <div className="payment-method-desc">Chat directly with Varanasi weaving masters for custom bulk inquiries or instant dispatch.</div>
                      </div>
                    </div>
                    <WhatsappIcon size={20} />
                  </label>
                </div>

                {orderError && (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      marginTop: '16px',
                      color: '#991b1b',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertCircle size={18} />
                    <span>{orderError}</span>
                  </div>
                )}

                {/* Main Submit Action Button */}
                <button
                  type="submit"
                  className="checkout-submit-btn"
                  disabled={isSubmitting}
                  style={{ marginTop: '20px' }}
                >
                  {isSubmitting ? (
                    'Processing Order...'
                  ) : paymentMethod === 'whatsapp' ? (
                    <>Place Order via WhatsApp • {formatMoney(total, 2)} <ArrowRight size={18} /></>
                  ) : (
                    <>Proceed to UPI Payment • {formatMoney(total, 2)} <ArrowRight size={18} /></>
                  )}
                </button>

                <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
                  <ShieldCheck size={14} style={{ color: '#16a34a' }} /> Encrypted & Secure 256-Bit SSL Checkout
                </div>
              </form>
            </>
          ) : (
            /* Step 2: Payment & Proof Submission — Distilled, Un-nested, High-Craft */
            <div className="checkout-step-payment-pane" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* Context Header: Navigation & Order Summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('details')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#0284c7',
                      fontWeight: '600',
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      marginBottom: '8px',
                    }}
                  >
                    <ArrowLeft size={14} /> Edit delivery details
                  </button>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
                    Pay & Confirm
                  </h2>
                  <div style={{ fontSize: '0.86rem', color: '#64748b' }}>
                    Delivering to <strong>{formName}</strong> ({formPhone}) • {formCity}, {formState}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: '2px' }}>
                    Total Due
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
                    {formatMoney(total, 2)}
                  </div>
                </div>
              </div>

              {/* Section 1: Scan & Pay Affordance */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>
                    Scan QR with any UPI app
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: '#64748b', margin: 0 }}>
                    Google Pay, PhonePe, Paytm, BHIM, or NetBanking
                  </p>
                </div>

                {/* QR Code */}
                <div style={{ padding: '8px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'inline-block' }}>
                  <QRCodeImage
                    text={rawUpiUrl}
                    size={180}
                    alt="Weave365 UPI Payment QR"
                    style={{ display: 'block', borderRadius: '8px' }}
                  />
                </div>

                {/* UPI VPA Pill & Copy Button */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 12px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '0.92rem', color: '#0f172a', letterSpacing: '0.3px' }}>
                    {upiId}
                  </span>
                  <button
                    type="button"
                    onClick={copyUpiId}
                    style={{
                      background: 'none',
                      border: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: copiedUpi ? '#16a34a' : '#0369a1',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: '2px 6px',
                    }}
                  >
                    {copiedUpi ? <Check size={14} /> : <Copy size={14} />}
                    {copiedUpi ? 'Copied' : 'Copy'}
                  </button>
                </div>

                {/* Mobile Deep Link */}
                <a
                  href={rawUpiUrl}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: '#0f172a',
                    color: '#ffffff',
                    padding: '10px 22px',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    textDecoration: 'none',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.15)',
                  }}
                >
                  <QrCode size={16} /> Tap to Open in UPI App (Mobile)
                </a>
              </div>

              {/* Clean Section Divider with Subtle Spacing */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                <div style={{ maxWidth: '440px', margin: '0 auto', width: '100%' }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>
                      Confirm your payment
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
                      Submit your 12-digit UPI reference number or send your receipt on WhatsApp to start parcel packing.
                    </p>
                  </div>

                  {/* Option 1: 12-Digit UTR */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    <label htmlFor="upi-utr-input" style={{ fontSize: '0.84rem', fontWeight: '600', color: '#334155' }}>
                      12-digit UPI Reference / UTR Number
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id="upi-utr-input"
                        type="text"
                        className="checkout-input"
                        placeholder="e.g. 423589123456"
                        value={upiTransactionId}
                        onChange={(e) => setUpiTransactionId(e.target.value.replace(/\s+/g, ''))}
                        maxLength={24}
                        style={{ flex: 1, minWidth: '160px', height: '44px', fontFamily: 'monospace', fontSize: '0.9rem' }}
                      />
                      <button
                        type="button"
                        onClick={handleUtrSubmit}
                        disabled={isSubmitting}
                        className="checkout-submit-btn"
                        style={{ width: 'auto', minWidth: '120px', height: '44px', padding: '0 16px', fontSize: '0.86rem', whiteSpace: 'nowrap' }}
                      >
                        {isSubmitting ? 'Verifying...' : 'Submit UTR'}
                      </button>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      Found in Google Pay, PhonePe, or Paytm receipt under "UPI Ref" or "UTR".
                    </div>
                  </div>

                  {/* Inline Subtle "or" Divider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '16px 0', color: '#94a3b8', fontSize: '0.78rem', fontWeight: '600' }}>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                    <span>OR</span>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                  </div>

                  {/* Option 2: WhatsApp Receipt */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleWhatsAppScreenshotSubmit}
                      disabled={isSubmitting}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        maxWidth: '300px',
                        width: '100%',
                        height: '44px',
                        padding: '0 20px',
                        backgroundColor: '#4A5A31',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.88rem',
                        fontWeight: '700',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 8px rgba(74, 90, 49, 0.25)',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <WhatsappIcon size={18} />
                      {isSubmitting ? 'Registering order...' : 'Send Receipt on WhatsApp'}
                    </button>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', textAlign: 'center' }}>
                      Don't have the UTR handy? We'll open WhatsApp so you can attach your screenshot directly.
                    </div>
                  </div>

                  {orderError && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 14px', marginTop: '16px', color: '#991b1b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={18} />
                      <span>{orderError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Return Link */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setCheckoutStep('details')}
                  className="checkout-back-link"
                >
                  <ArrowLeft size={16} /> Return to delivery details
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
