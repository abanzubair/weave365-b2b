/**
 * Dedicated Stripe-Inspired Checkout Page Component
 * Handles both Standard Shipping & White-Label Direct Dropshipping.
 */
import { useState, useEffect, useMemo } from 'react';
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
  HelpCircle,
  ChevronDown,
  X,
  Smartphone,
} from 'lucide-react';
import { storeConfig } from '../config.js';
import {
  customerPrice,
  formatMoney,
  buildWhatsappUrl,
  calculateComboDiscount,
  fallbackProductImage,
} from '../storefrontShared.jsx';
import { WhatsappIcon } from '../components/WhatsappIcon.jsx';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { priceNoticeForAccess } from '../utils/buyerAccess.js';
import { recordReferral } from '../utils/influencerHelpers.js';

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
  updateQuantity,
  removeProduct,
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

  // Payment method: 'upi' | 'card' | 'cod'
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showExpressPayNotice, setShowExpressPayNotice] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [pendingWhatsappUrl, setPendingWhatsappUrl] = useState('');
  const [activeDeliveryDetails, setActiveDeliveryDetails] = useState(null);

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

  // Weight & Shipping Fee calculation (₹150 per kg, ceiled for any fraction)
  const { totalWeightKg, billedWeightKg, expeditedShippingFee, shippingFee } = useMemo(() => {
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
    const expeditedFee = billedKg * 150;
    const actualFee = shippingSpeed === 'expedited' ? expeditedFee : 0;

    return {
      totalWeightKg: totalKg,
      billedWeightKg: billedKg,
      expeditedShippingFee: expeditedFee,
      shippingFee: actualFee,
    };
  }, [items, shippingSpeed]);

  // Financial calculations
  const canViewPrices = priceAccess?.canViewPrices !== false;
  const { subtotal, discount, total } = useMemo(() => {
    if (!canViewPrices || !items.length) {
      return { subtotal: 0, discount: 0, total: 0 };
    }

    let sub = 0;
    let disc = 0;
    let baseTotal = 0;

    const isWholesale = priceAccess?.priceGroup === 'wholesale';
    if (isWholesale) {
      const groups = {};
      items.forEach((item) => {
        const key = item.productGroupKey;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });

      let sum = 0;
      Object.values(groups).forEach((groupItems) => {
        const firstItem = groupItems[0];
        if (!firstItem) return;
        const setQty = firstItem.quantity;
        const isUnder999 =
          String(firstItem.product?.category || '').toLowerCase() === 'under 999';
        const discountFactor = isUnder999
          ? 1.0
          : setQty >= 10
          ? 0.95
          : setQty >= 5
          ? 0.98
          : 1.0;

        groupItems.forEach((item) => {
          const itemPrice = customerPrice(item.variant?.prices, priceAccess) || 0;
          sum += itemPrice * item.quantity * discountFactor;
        });
      });
      sub = Math.round(sum);
      disc = 0;
      baseTotal = sub;
    } else {
      sub = items.reduce(
        (sum, item) =>
          sum + (customerPrice(item.variant?.prices, priceAccess) || 0) * item.quantity,
        0
      );
      disc = calculateComboDiscount(items, priceAccess);
      baseTotal = Math.max(0, sub - disc);
    }

    return { subtotal: sub, discount: disc, total: baseTotal + shippingFee };
  }, [canViewPrices, items, priceAccess, shippingFee]);

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

  const recordOrderReceived = async (deliveryDetails, currentWhatsappUrl) => {
    let newOrderId = null;
    setIsSubmitting(true);

    if (isSupabaseConfigured && deliveryDetails) {
      try {
        const isDropshipOrder = Boolean(deliveryDetails.is_dropship);
        const orderMessage = isDropshipOrder
          ? `DIRECT DROPSHIP ORDER (BLIND PACKAGING)\n\nSender (Parcel Label):\nName: ${deliveryDetails.dropship_sender_name}\nPhone: ${deliveryDetails.dropship_sender_phone}\nAddress: ${deliveryDetails.dropship_sender_address}, ${deliveryDetails.dropship_sender_city}, ${deliveryDetails.dropship_sender_state} - ${deliveryDetails.dropship_sender_pincode}\n\nRecipient Delivery Address:\nName: ${deliveryDetails.full_name}\nPhone: ${deliveryDetails.phone_number}\nAddress: ${deliveryDetails.address_line1}${deliveryDetails.address_line2 ? ', ' + deliveryDetails.address_line2 : ''}\nCity: ${deliveryDetails.city}, ${deliveryDetails.state} - ${deliveryDetails.pincode}\nCountry: India\n\nPackaging: ${deliveryDetails.dropship_packing_preference || 'Blind Shipping'}`
          : `Order paid via UPI/Checkout.\n\nDelivery Address:\nName: ${deliveryDetails.full_name}\nPhone: ${deliveryDetails.phone_number}\nAddress: ${deliveryDetails.address_line1}${deliveryDetails.address_line2 ? ', ' + deliveryDetails.address_line2 : ''}\nCity: ${deliveryDetails.city}, ${deliveryDetails.state} - ${deliveryDetails.pincode}\nCountry: India`;

        const { data: insertData, error: insertErr } = await supabase
          .from('orders')
          .insert({
            user_id: priceAccess?.userId || user?.id || undefined,
            email: email || priceAccess?.userEmail || user?.email || undefined,
            buyer_name: isDropshipOrder ? deliveryDetails.dropship_sender_name : (deliveryDetails.full_name || priceAccess?.buyerName || 'Guest Buyer'),
            business_name: isDropshipOrder ? deliveryDetails.dropship_sender_name : (priceAccess?.businessName || undefined),
            phone: isDropshipOrder ? deliveryDetails.dropship_sender_phone : (deliveryDetails.phone_number || priceAccess?.buyerPhone || undefined),
            pincode: deliveryDetails.pincode || priceAccess?.buyerPincode || undefined,
            status: 'new',
            message: orderMessage,
            is_dropship: isDropshipOrder,
            dropship_sender_name: deliveryDetails.dropship_sender_name || null,
            dropship_sender_phone: deliveryDetails.dropship_sender_phone || null,
            dropship_sender_address: deliveryDetails.dropship_sender_address || null,
            dropship_sender_city: deliveryDetails.dropship_sender_city || null,
            dropship_sender_state: deliveryDetails.dropship_sender_state || null,
            dropship_sender_pincode: deliveryDetails.dropship_sender_pincode || null,
            dropship_recipient_name: deliveryDetails.full_name || null,
            dropship_recipient_phone: deliveryDetails.phone_number || null,
            dropship_recipient_address: `${deliveryDetails.address_line1}${deliveryDetails.address_line2 ? ', ' + deliveryDetails.address_line2 : ''}`,
            dropship_recipient_city: deliveryDetails.city || null,
            dropship_recipient_state: deliveryDetails.state || null,
            dropship_recipient_pincode: deliveryDetails.pincode || null,
            dropship_packing_preference: deliveryDetails.dropship_packing_preference || null,
            items: items.map(item => ({
              product_id: item.productGroupKey,
              product_title: item.product?.title || '',
              variant_code: item.variant?.code || '',
              color: item.selectedColorName || '',
              quantity: item.quantity,
              price: customerPrice(item.variant?.prices, priceAccess),
            })),
          })
          .select('id')
          .single();

        if (insertErr) throw insertErr;

        if (insertData?.id) {
          newOrderId = insertData.id;

          const orderItems = items.map(item => ({
            product_id: item.productGroupKey,
            product_title: item.product?.title || '',
            variant_code: item.variant?.code || '',
            color: item.selectedColorName || '',
            quantity: item.quantity,
            price: customerPrice(item.variant?.prices, priceAccess),
          }));
          const saleAmount = items.reduce((sum, it) => sum + (Number(customerPrice(it.variant?.prices, priceAccess)) || 0) * (Number(it.quantity) || 1), 0);

          void recordReferral({
            orderId: newOrderId,
            buyerId: priceAccess?.userId || user?.id || null,
            buyerName: priceAccess?.buyerName || deliveryDetails.full_name || 'Guest Buyer',
            items: orderItems,
            saleAmount: saleAmount,
          });

          // Send email alert
          fetch('/api/inquiry-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              buyer_name: deliveryDetails.full_name,
              email: email || user?.email,
              phone: deliveryDetails.phone_number,
              pincode: deliveryDetails.pincode,
              message: orderMessage,
              items: orderItems,
            }),
          }).catch(err => console.error('Failed to send email notification:', err));
        }
      } catch (err) {
        console.error('Failed to record order to Supabase:', err);
      }
    }

    setIsSubmitting(false);

    if (currentWhatsappUrl && typeof window !== 'undefined') {
      window.open(currentWhatsappUrl, '_blank', 'noopener,noreferrer');
    }

    if (clearCart) {
      clearCart();
    }

    if (newOrderId && navigate) {
      navigate('order-tracking', newOrderId);
    } else {
      setOrderSuccess(true);
    }
  };

  const handleOrderSubmit = async (e) => {
    e?.preventDefault();
    if (!items.length) return;

    // Form validations
    if (!formName.trim() || !formPhone.trim() || !formAddr1.trim() || !formCity.trim() || !formState.trim() || !formPincode.trim()) {
      alert('Please fill in all required delivery address fields.');
      return;
    }

    if (shippingMode === 'dropship' && (!senderName.trim() || !senderPhone.trim() || !senderAddress.trim() || !senderCity.trim() || !senderState.trim() || !senderPincode.trim())) {
      alert('Please complete all required Reseller (Sender) Details for white-label dropshipping.');
      return;
    }

    setIsSubmitting(true);

    const deliveryDetails = {
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

    setActiveDeliveryDetails(deliveryDetails);

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

    // Build WhatsApp order payload
    const whatsappUrl = buildWhatsappUrl(
      items,
      total,
      formPincode,
      codStatus,
      priceAccess,
      undefined,
      deliveryDetails,
      paymentMethod === 'upi'
    );

    setPendingWhatsappUrl(whatsappUrl);

    const isMobile = typeof window !== 'undefined' && (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
    );

    if (isMobile) {
      // Mobile: Open native UPI App chooser directly!
      window.location.href = rawUpiUrl;
      setTimeout(() => {
        void recordOrderReceived(deliveryDetails, whatsappUrl);
      }, 1200);
    } else {
      // Desktop: Open QR Code modal
      setIsSubmitting(false);
      setShowQrModal(true);
    }
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
    return (
      <div className="checkout-page-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '60px 20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', backgroundColor: '#f8fafc', padding: '40px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <CheckCircle size={64} style={{ color: '#16a34a', marginBottom: '20px' }} />
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>
            Order Initiated Successfully!
          </h2>
          <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
            Your order details have been compiled and sent to our Weave365 order desk. We will confirm dispatch details shortly.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              className="checkout-submit-btn"
              onClick={() => {
                if (clearCart) clearCart();
                navigate('account');
              }}
              style={{ width: 'auto', padding: '0 24px' }}
            >
              View Order History
            </button>
            <button
              type="button"
              className="shipping-mode-btn"
              onClick={() => navigate('catalogue')}
              style={{ padding: '0 20px', border: '1px solid #cbd5e1' }}
            >
              Continue Shopping
            </button>
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
            <div className="checkout-total-amount">{formatMoney(total)}</div>

            {/* Cart Items List */}
            <div className="checkout-items-list">
              {items.map((item, idx) => {
                const itemUnitPrice = customerPrice(item.variant?.prices, priceAccess) || 0;
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
                      {formatMoney(itemUnitPrice * item.quantity)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Financial Summary Table */}
            <div className="checkout-financial-table">
              <div className="checkout-summary-row">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="checkout-summary-row" style={{ color: '#16a34a', fontWeight: '600' }}>
                  <span>Combo Discount</span>
                  <span>-{formatMoney(discount)}</span>
                </div>
              )}

              <div className="checkout-summary-row">
                <span>Shipping ({shippingSpeed === 'expedited' ? 'Express' : 'Standard Ground'})</span>
                <span style={{ color: shippingSpeed === 'expedited' ? '#0f172a' : '#16a34a', fontWeight: '500' }}>
                  {shippingSpeed === 'expedited'
                    ? `${formatMoney(expeditedShippingFee)} (${billedWeightKg} kg)`
                    : formPincode ? 'FREE (Pan-India)' : 'Calculated at checkout'}
                </span>
              </div>

              <div className="checkout-summary-row total-row">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
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

        {/* Right Pane: Stripe-Style Checkout Form */}
        <div className="checkout-form-pane">
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

          <form onSubmit={handleOrderSubmit} className="checkout-form-group">
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
                      <label htmlFor="checkout-addr1">Street Address *</label>
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
                      <label htmlFor="checkout-addr2">Landmark / Area (Optional)</label>
                      <input
                        id="checkout-addr2"
                        type="text"
                        className="checkout-input"
                        placeholder="Near Landmark"
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
                        {codStatus === 'available' && (
                          <div className="pincode-status-badge available">
                            <CheckCircle size={12} /> Serviceable & COD Available
                          </div>
                        )}
                        {codStatus === 'unavailable' && (
                          <div className="pincode-status-badge unavailable">
                            Pre-paid Only Pincode
                          </div>
                        )}
                      </div>
                      <div className="checkout-field">
                        <label>Country</label>
                        <input type="text" className="checkout-input" value="India" disabled />
                      </div>
                    </div>

                    {user?.id && (
                      <label className="checkout-checkbox-label">
                        <input
                          type="checkbox"
                          checked={saveToAccount}
                          onChange={(e) => setSaveToAccount(e.target.checked)}
                        />
                        Save this address to my account for future orders
                      </label>
                    )}
                  </>
                )}
              </>
            ) : (
              /* Direct Dropshipping Form */
              <>
                <div className="checkout-section-title">
                  <Package size={18} /> Reseller Details (Sender)
                </div>

                <div className="checkout-input-row">
                  <div className="checkout-field">
                    <label htmlFor="sender-name">Business Name *</label>
                    <input
                      id="sender-name"
                      type="text"
                      className="checkout-input"
                      placeholder="e.g. Royal Silk Boutique"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="checkout-field">
                    <label htmlFor="sender-phone">Phone Number *</label>
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
              <Truck size={18} /> Delivery Speed & Shipping Method
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
                    <div><strong>Standard Shipping:</strong> Free Across India</div>
                    <div className="shipping-delivery-days">Estimated Delivery: <strong>4–5 Business Days</strong></div>
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

            {/* Payment Method Details */}
            <div className="checkout-section-title" style={{ marginTop: '20px' }}>
              <CreditCard size={18} /> Payment Details
            </div>

            <div className="payment-method-group">
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
                    <div className="payment-method-title">Instant UPI / QR Transfer</div>
                    <div className="payment-method-desc">GPay, PhonePe, Paytm, BHIM UPI</div>
                  </div>
                </div>
                <QrCode size={20} style={{ color: '#0f172a' }} />
              </label>

              {paymentMethod === 'upi' && (
                <div className="upi-qr-box">
                  <div style={{ fontSize: '0.86rem', color: '#475569', fontWeight: '500' }}>
                    Scan QR with any UPI App (GPay, PhonePe, Paytm):
                  </div>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(rawUpiUrl)}`}
                    alt="UPI Payment QR Code"
                    style={{ width: '170px', height: '170px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', padding: '6px' }}
                  />
                  <div className="upi-vpa-code">{storeConfig.upiId || 'weave365@upi'}</div>
                  <button
                    type="button"
                    className="shipping-mode-btn"
                    onClick={copyUpiId}
                    style={{ border: '1px solid #cbd5e1', padding: '6px 16px', fontSize: '0.8rem' }}
                  >
                    {copiedUpi ? <Check size={14} /> : <Copy size={14} />}
                    {copiedUpi ? 'Copied UPI VPA!' : 'Copy UPI ID'}
                  </button>
                </div>
              )}

              {/*
              <label
                className={`payment-method-card ${paymentMethod === 'card' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <div className="payment-method-left">
                  <input
                    type="radio"
                    name="paymentType"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                  />
                  <div>
                    <div className="payment-method-title">Debit / Credit Card & NetBanking</div>
                    <div className="payment-method-desc">Visa, Mastercard, RuPay, All major banks</div>
                  </div>
                </div>
                <CreditCard size={20} style={{ color: '#0f172a' }} />
              </label>
              */}
            </div>

            {/* Main Submit Action Button */}
            <button
              type="submit"
              className="checkout-submit-btn"
              disabled={isSubmitting}
              style={{ marginTop: '20px' }}
            >
              {isSubmitting ? (
                'Processing Order...'
              ) : (
                shippingMode === 'dropship'
                  ? `Place Dropship Order • ${formatMoney(total)}`
                  : `Pay ${formatMoney(total)}`
              )}
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
              <ShieldCheck size={14} style={{ color: '#16a34a' }} /> Encrypted & Secure 256-Bit SSL Checkout
            </div>
          </form>
        </div>
      </div>

      {/* Desktop UPI QR Modal Overlay */}
      {showQrModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
          onClick={() => setShowQrModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '420px',
              width: '100%',
              padding: '32px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: '4px',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ fontWeight: '700', fontSize: '1.2rem', color: '#0f172a' }}>
              Scan QR to Complete Payment
            </div>

            <div style={{ fontSize: '0.88rem', color: '#64748b' }}>
              Scan using any UPI App (GPay, PhonePe, Paytm, BHIM)
            </div>

            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(rawUpiUrl)}`}
                alt="UPI Payment QR Code"
                style={{ width: '210px', height: '210px', borderRadius: '8px', display: 'block', margin: '0 auto' }}
              />
            </div>

            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>
              {formatMoney(total)}
            </div>

            <div className="upi-vpa-code" style={{ width: '100%', boxSizing: 'border-box' }}>
              {storeConfig.upiId}
            </div>

            <button
              type="button"
              className="checkout-submit-btn"
              onClick={() => {
                setShowQrModal(false);
                void recordOrderReceived(activeDeliveryDetails, pendingWhatsappUrl);
              }}
              style={{ width: '100%', backgroundColor: '#16a34a', marginTop: '8px' }}
            >
              I Have Paid • Confirm Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
