/**
 * CartDrawer Component
 * Purpose: Renders the slide-out B2B order drawer (cart).
 * Enables real-time order list compilations, quantity adjustments, catalog color selection,
 * PAN India delivery pincode check status, and dynamic WhatsApp checkouts.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { X, ArrowRight, ArrowLeft, Plus, Zap, CreditCard, Store, MapPin } from 'lucide-react';
import { storeConfig, getProductCategorySlug } from '../config.js';
import {
  customerPrice,
  buildWhatsappUrl,
  fallbackProductImage,
  formatMoney,
  normalizePincodeInput,
  calculateComboDiscount,
} from '../storefrontShared.jsx';
import { WhatsappIcon } from './WhatsappIcon.jsx';
import { EnquiryPopup } from './EnquiryPopup.jsx';
import { priceNoticeForAccess } from '../utils/buyerAccess.js';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { recordReferral } from '../utils/influencerHelpers.js';

export function CartDrawer({
  open,
  onClose,
  items,
  updateQuantity,
  removeProduct,
  addCartColor,
  pincode,
  setPincode,
  codStatus,
  checkPincode,
  priceAccess,
  user,
  navigate,
}) {
  const [enquiryState, setEnquiryState] = useState('idle');
  const [enquiryPopupOpen, setEnquiryPopupOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showUpiDetails, setShowUpiDetails] = useState(false);
  const drawerBodyRef = useRef(null);

  // Address flow state
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressStep, setAddressStep] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Address form fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddr1, setFormAddr1] = useState('');
  const [formAddr2, setFormAddr2] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formPincode, setFormPincode] = useState(pincode || '');
  const [formCountry, setFormCountry] = useState('India');
  const [saveToAccount, setSaveToAccount] = useState(true);

  // Dropshipping state
  const [isDropship, setIsDropship] = useState(false);
  const [senderName, setSenderName] = useState(priceAccess?.businessName || user?.user_metadata?.business_name || '');
  const [senderPhone, setSenderPhone] = useState(priceAccess?.buyerPhone || user?.user_metadata?.phone || '');
  const [senderAddress, setSenderAddress] = useState('');
  const [senderCity, setSenderCity] = useState('');
  const [senderState, setSenderState] = useState('');
  const [senderPincode, setSenderPincode] = useState('');
  const [packingPreference, setPackingPreference] = useState('Blind Packaging (Zero Supplier Branding / No Price Tags)');
  const [dropshipNotes, setDropshipNotes] = useState('');

  // Sync pincode from cart check if available
  useEffect(() => {
    if (pincode) {
      setFormPincode(pincode);
    }
  }, [pincode]);

  const fetchAddresses = async () => {
    if (!user?.id || !isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAddresses(data || []);
      const defaultAddr = data?.find(a => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        setSelectedAddress(defaultAddr);
      } else if (data && data.length > 0) {
        setSelectedAddressId(data[0].id);
        setSelectedAddress(data[0]);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  useEffect(() => {
    if (open && user?.id) {
      fetchAddresses();
    }
  }, [open, user?.id]);

  const handlePaymentTriggerClick = () => {
    if (showUpiDetails || addressStep) {
      setShowUpiDetails(false);
      setAddressStep(false);
    } else {
      setAddressStep(true);
      if (addresses.length === 0) {
        setShowAddressForm(true);
      }
    }
  };

  const handleProceedToPayment = async () => {
    const dropshipMeta = isDropship ? {
      is_dropship: true,
      dropship_sender_name: senderName.trim() || priceAccess?.businessName || 'Reseller Store',
      dropship_sender_phone: senderPhone.trim() || priceAccess?.buyerPhone || 'N/A',
      dropship_sender_address: senderAddress.trim() || null,
      dropship_sender_city: senderCity.trim() || null,
      dropship_sender_state: senderState.trim() || null,
      dropship_sender_pincode: senderPincode.trim() || null,
      dropship_recipient_name: formName.trim(),
      dropship_recipient_phone: formPhone.trim(),
      dropship_recipient_address: `${formAddr1.trim()}${formAddr2.trim() ? ', ' + formAddr2.trim() : ''}`,
      dropship_recipient_city: formCity.trim(),
      dropship_recipient_state: formState.trim(),
      dropship_recipient_pincode: formPincode.trim(),
      dropship_packing_preference: packingPreference,
    } : { is_dropship: false };

    if (showAddressForm || addresses.length === 0) {
      if (!formName.trim() || !formPhone.trim() || !formAddr1.trim() || !formCity.trim() || !formState.trim() || !formPincode.trim()) {
        alert('Please fill in all required delivery address fields.');
        return;
      }

      if (isDropship && (!senderName.trim() || !senderPhone.trim() || !senderAddress.trim() || !senderCity.trim() || !senderState.trim() || !senderPincode.trim())) {
        alert('Please fill in all required Sender Address fields (Store Name, Phone, Address, City, State, Pincode).');
        return;
      }

      const addrData = {
        full_name: formName.trim(),
        phone_number: formPhone.trim(),
        address_line1: formAddr1.trim(),
        address_line2: formAddr2.trim() || null,
        city: formCity.trim(),
        state: formState.trim(),
        pincode: formPincode.trim(),
        country: formCountry.trim() || 'India',
        ...dropshipMeta,
      };

      if (saveToAccount && user?.id && isSupabaseConfigured && !isDropship) {
        try {
          const isFirst = addresses.length === 0;
          const { data, error } = await supabase
            .from('addresses')
            .insert({
              full_name: addrData.full_name,
              phone_number: addrData.phone_number,
              address_line1: addrData.address_line1,
              address_line2: addrData.address_line2,
              city: addrData.city,
              state: addrData.state,
              pincode: addrData.pincode,
              country: addrData.country,
              user_id: user.id,
              is_default: isFirst,
            })
            .select()
            .single();
          if (error) throw error;

          setSelectedAddress({ ...data, ...dropshipMeta });
          setSelectedAddressId(data.id);
          await fetchAddresses();
        } catch (err) {
          console.error('Failed to save address:', err);
          setSelectedAddress(addrData);
        }
      } else {
        setSelectedAddress(addrData);
      }

      setShowAddressForm(false);
    } else {
      const active = addresses.find(a => a.id === selectedAddressId);
      if (!active) {
        alert('Please select a delivery address.');
        return;
      }
      setSelectedAddress({ ...active, ...dropshipMeta });
    }

    setAddressStep(false);
    setShowUpiDetails(true);
  };

  const hasUnselectedColors = useMemo(() => {
    return items.some(item => item.selectedColorName === 'Select Color');
  }, [items]);

  useEffect(() => {
    if (!open) {
      setShowUpiDetails(false);
      setAddressStep(false);
      setShowAddressForm(false);
      setEnquiryState('idle');
    }
  }, [open]);

  useEffect(() => {
    if (showUpiDetails && drawerBodyRef.current) {
      const timer = setTimeout(() => {
        drawerBodyRef.current.scrollTo({
          top: drawerBodyRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showUpiDetails]);

  const canViewPrices = priceAccess?.canViewPrices !== false;
  const { subtotal, discount, total } = useMemo(() => {
    if (!canViewPrices) return { subtotal: null, discount: 0, total: null };
    const isWholesale = priceAccess?.priceGroup === 'wholesale';

    if (isWholesale) {
      const groups = {};
      items.forEach((item) => {
        const key = item.productGroupKey;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
      });

      let sum = 0;
      Object.entries(groups).forEach(([productId, groupItems]) => {
        const firstItem = groupItems[0];
        if (!firstItem) return;
        const setQty = firstItem.quantity;
        const isUnder999 = String(firstItem.product?.category || '').toLowerCase() === 'under 999';
        const discountFactor = isUnder999 ? 1.0 : (setQty >= 10 ? 0.95 : (setQty >= 5 ? 0.98 : 1.0));

        groupItems.forEach((item) => {
          const itemPrice = customerPrice(item.variant.prices, priceAccess) || 0;
          sum += itemPrice * item.quantity * discountFactor;
        });
      });
      const roundedTotal = Math.round(sum);
      return { subtotal: roundedTotal, discount: 0, total: roundedTotal };
    } else {
      const sub = items.reduce((sum, item) => sum + (customerPrice(item.variant.prices, priceAccess) || 0) * item.quantity, 0);
      const disc = calculateComboDiscount(items, priceAccess);
      return { subtotal: sub, discount: disc, total: Math.max(0, sub - disc) };
    }
  }, [canViewPrices, items, priceAccess]);

  const whatsappUrl = useMemo(
    () => buildWhatsappUrl(items, total, pincode, codStatus, priceAccess, undefined, selectedAddress),
    [codStatus, items, pincode, priceAccess, total, selectedAddress],
  );

  const paidWhatsappUrl = useMemo(
    () => buildWhatsappUrl(items, total, pincode, codStatus, priceAccess, undefined, selectedAddress, true),
    [codStatus, items, pincode, priceAccess, total, selectedAddress],
  );

  const showPayment = priceAccess?.priceGroup !== 'wholesale';
  const upiUrl = useMemo(() => {
    if (!showPayment || !total) return '';
    return `upi://pay?pa=${storeConfig.upiId}&pn=${encodeURIComponent(storeConfig.name)}&am=${total}&cu=INR`;
  }, [showPayment, total]);

  const copyUpiId = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(storeConfig.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const groupedItems = useMemo(() => {
    const groups = new Map();

    items.forEach((item) => {
      const key = item.productGroupKey;
      const group = groups.get(key) || {
        key,
        product: item.product,
        variant: item.variant,
        colorOptions: item.colorOptions,
        items: [],
      };

      group.items.push(item);
      groups.set(key, group);
    });

    return Array.from(groups.values()).map((group) => {
      const activeItems = group.items.filter((item) => item.selectedColorName && item.selectedColorName !== 'Select Color');
      return {
        ...group,
        selectedColorNames: new Set(group.items.map((item) => item.selectedColorName).filter(Boolean)),
        totalQuantity: activeItems.reduce((sum, item) => sum + item.quantity, 0),
        selectedColorsCount: activeItems.length,
      };
    });
  }, [items]);

  async function handleEnquiryClick() {
    if (hasUnselectedColors) {
      alert('Please select a color for all items before making an enquiry.');
      return;
    }
    if (enquiryState === 'sending' || items.length === 0) return;
    setEnquiryState('sending');

    if (isSupabaseConfigured) {
      try {
        const enquiryItems = items.map(item => {
          const categorySlug = item.product ? getProductCategorySlug(item.product.id || item.product.groupKey, item.product.category) : 'catalogue';
          const pId = item.productGroupKey || item.product?.id || item.product?.groupKey;
          const productUrl = pId ? `/${categorySlug}/${encodeURIComponent(pId)}` : '#';

          return {
            product_id: item.productGroupKey,
            product_title: item.product.title,
            variant_code: item.variant.code,
            color: item.selectedColorName,
            quantity: item.quantity,
            price: customerPrice(item.variant.prices, priceAccess),
            product_url: productUrl,
          };
        });

        const { data: inquiryData, error: inquiryErr } = await supabase
          .from('inquiries')
          .insert({
            user_id: priceAccess?.userId || undefined,
            email: priceAccess?.userEmail || undefined,
            buyer_name: priceAccess?.buyerName || 'Guest Buyer',
            phone: priceAccess?.buyerPhone || undefined,
            pincode: pincode || priceAccess?.buyerPincode || undefined,
            inquiry_type: 'cart',
            status: 'new',
            message: `Enquiry for ${items.length} items in cart`,
            items: enquiryItems,
          })
          .select('id')
          .single();

        if (inquiryErr) throw inquiryErr;

        if (inquiryData?.id) {
          const saleAmount = items.reduce((sum, it) => sum + (Number(customerPrice(it.variant.prices, priceAccess)) || 0) * (Number(it.quantity) || 1), 0);
          void recordReferral({
            inquiryId: inquiryData.id,
            buyerId: priceAccess?.userId || null,
            buyerName: priceAccess?.buyerName || 'Guest Buyer',
            items: enquiryItems,
            saleAmount: saleAmount,
          });
        }

        // Send email alert via Resend API endpoint
        fetch('/api/inquiry-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buyer_name: priceAccess?.buyerName || 'Guest Buyer',
            email: priceAccess?.userEmail || undefined,
            phone: priceAccess?.buyerPhone || undefined,
            pincode: pincode || priceAccess?.buyerPincode || undefined,
            message: `Enquiry for ${items.length} items in cart`,
            items: enquiryItems,
          }),
        }).catch(err => console.error('Failed to send inquiry email notification:', err));
      } catch (err) {
        console.error('Failed to log inquiry to Supabase:', err);
      }
    }

    setEnquiryState('sent');
    setEnquiryPopupOpen(true);
  }

  const handlePaidConfirmClick = async () => {
    if (hasUnselectedColors) {
      alert('Please select a color for all items before sharing payment.');
      return;
    }
    if (enquiryState === 'sending' || items.length === 0) return;

    setEnquiryState('sending');
    let newInquiryId = null;

    if (isSupabaseConfigured) {
      try {
        const isDropshipOrder = Boolean(selectedAddress?.is_dropship);
        const orderMessage = isDropshipOrder
          ? `DIRECT DROPSHIP ORDER (BLIND PACKAGING)\n\nSender (Parcel Label):\nName: ${selectedAddress?.dropship_sender_name}\nPhone: ${selectedAddress?.dropship_sender_phone}\n\nRecipient Delivery Address:\nName: ${selectedAddress?.dropship_recipient_name || selectedAddress?.full_name}\nPhone: ${selectedAddress?.dropship_recipient_phone || selectedAddress?.phone_number}\nAddress: ${selectedAddress?.address_line1}${selectedAddress?.address_line2 ? ', ' + selectedAddress?.address_line2 : ''}\nCity: ${selectedAddress?.city}, ${selectedAddress?.state} - ${selectedAddress?.pincode}\nCountry: ${selectedAddress?.country || 'India'}\n\nPackaging: ${selectedAddress?.dropship_packing_preference || 'Blind Shipping'}`
          : `Order paid via UPI. (User is sharing payment screenshot on WhatsApp)\n\nDelivery Address:\nName: ${selectedAddress?.full_name}\nPhone: ${selectedAddress?.phone_number}\nAddress: ${selectedAddress?.address_line1}${selectedAddress?.address_line2 ? ', ' + selectedAddress?.address_line2 : ''}\nCity: ${selectedAddress?.city}, ${selectedAddress?.state} - ${selectedAddress?.pincode}\nCountry: ${selectedAddress?.country || 'India'}`;

        const { data: insertData, error: insertErr } = await supabase
          .from('orders')
          .insert({
            user_id: priceAccess?.userId || undefined,
            email: priceAccess?.userEmail || undefined,
            buyer_name: isDropshipOrder ? selectedAddress?.dropship_sender_name : (priceAccess?.buyerName || 'Guest Buyer'),
            business_name: isDropshipOrder ? selectedAddress?.dropship_sender_name : (priceAccess?.businessName || undefined),
            phone: isDropshipOrder ? selectedAddress?.dropship_sender_phone : (priceAccess?.buyerPhone || undefined),
            pincode: pincode || priceAccess?.buyerPincode || selectedAddress?.pincode || undefined,
            status: 'new',
            message: orderMessage,
            is_dropship: isDropshipOrder,
            dropship_sender_name: selectedAddress?.dropship_sender_name || null,
            dropship_sender_phone: selectedAddress?.dropship_sender_phone || null,
            dropship_sender_address: selectedAddress?.dropship_sender_address || null,
            dropship_sender_city: selectedAddress?.dropship_sender_city || null,
            dropship_sender_state: selectedAddress?.dropship_sender_state || null,
            dropship_sender_pincode: selectedAddress?.dropship_sender_pincode || null,
            dropship_recipient_name: selectedAddress?.dropship_recipient_name || selectedAddress?.full_name || null,
            dropship_recipient_phone: selectedAddress?.dropship_recipient_phone || selectedAddress?.phone_number || null,
            dropship_recipient_address: selectedAddress ? `${selectedAddress.address_line1}${selectedAddress.address_line2 ? ', ' + selectedAddress.address_line2 : ''}` : null,
            dropship_recipient_city: selectedAddress?.city || null,
            dropship_recipient_state: selectedAddress?.state || null,
            dropship_recipient_pincode: selectedAddress?.pincode || null,
            dropship_packing_preference: selectedAddress?.dropship_packing_preference || null,
            items: items.map(item => ({
              product_id: item.productGroupKey,
              product_title: item.product.title,
              variant_code: item.variant.code,
              color: item.selectedColorName,
              quantity: item.quantity,
              price: customerPrice(item.variant.prices, priceAccess),
            })),
          })
          .select('id')
          .single();

        if (insertErr) throw insertErr;
        if (insertData?.id) {
          newInquiryId = insertData.id;

          const orderItems = items.map(item => ({
            product_id: item.productGroupKey,
            product_title: item.product.title,
            variant_code: item.variant.code,
            color: item.selectedColorName,
            quantity: item.quantity,
            price: customerPrice(item.variant.prices, priceAccess),
          }));
          const saleAmount = items.reduce((sum, it) => sum + (Number(customerPrice(it.variant.prices, priceAccess)) || 0) * (Number(it.quantity) || 1), 0);

          void recordReferral({
            orderId: newInquiryId,
            buyerId: priceAccess?.userId || null,
            buyerName: priceAccess?.buyerName || 'Guest Buyer',
            items: orderItems,
            saleAmount: saleAmount,
          });
        }
      } catch (err) {
        console.error('Failed to log payment order to Supabase:', err);
      }
    }

    setEnquiryState('sent');
    window.open(paidWhatsappUrl, '_blank', 'noopener,noreferrer');

    if (newInquiryId && navigate) {
      navigate('order-tracking', newInquiryId);
      if (onClose) onClose();
    }
  };

  return (
    <div
      className={`cart-drawer-shell ${open ? 'open' : ''}`}
      onMouseDown={onClose}
    >
      <aside
        className={`cart-drawer ${open ? 'open' : ''}`}
        aria-hidden={!open}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className="drawer-head">
          <h2>Order List</h2>
          <button type="button" className="icon-button" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="drawer-body" ref={drawerBodyRef}>
          {showUpiDetails ? (
            <div className="cart-upi-view">
              <button
                type="button"
                className="cart-back-btn"
                onClick={() => {
                  setShowUpiDetails(false);
                  setAddressStep(true);
                }}
              >
                <ArrowLeft size={16} /> Back to Address Selection
              </button>

              <div className="upi-payment-header">
                <strong>UPI Payment Details</strong>
                <span className="upi-payment-badge">Instant Order</span>
              </div>
              <p className="upi-payment-instructions">
                Scan QR code or click pay to complete payment. Order will be processed instantly.
              </p>
              <div className="upi-qr-wrapper">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`}
                  alt="UPI QR Code"
                  width={180}
                  height={180}
                  loading="lazy"
                  className="upi-qr-image"
                />
              </div>
              <div className="upi-details-grid">
                <div className="upi-detail-row">
                  <span>Payee Name</span>
                  <strong>{storeConfig.name}</strong>
                </div>
                <div className="upi-detail-row">
                  <span>UPI ID</span>
                  <div className="upi-id-copy-wrapper">
                    <strong>{storeConfig.upiId}</strong>
                    <button
                      type="button"
                      onClick={copyUpiId}
                      className="upi-copy-btn"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="upi-detail-row">
                  <span>Amount to Pay</span>
                  <strong className="upi-pay-amount">{formatMoney(total)}</strong>
                </div>
              </div>
              <a
                href={upiUrl}
                className="upi-pay-app-btn"
              >
                <Zap size={15} /> Pay via GPay / PhonePe / UPI
              </a>
            </div>
          ) : addressStep ? (
            <div className="cart-address-view">
              <div className="address-step-header-bar">
                <div className="address-header-top-row">
                  <button
                    type="button"
                    className="cart-back-btn"
                    onClick={() => {
                      setAddressStep(false);
                      setShowAddressForm(false);
                    }}
                  >
                    <ArrowLeft size={15} /> Order List
                  </button>

                  <div className="address-header-actions">
                    {isDropship && (
                      <span className="upi-payment-badge">Dropship Mode</span>
                    )}
                    {showAddressForm && addresses.length > 0 && (
                      <button
                        type="button"
                        className="cart-cancel-btn"
                        onClick={() => setShowAddressForm(false)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="address-step-title">
                  {showAddressForm || addresses.length === 0
                    ? (isDropship ? "Dropship Delivery & Sender Details" : "Add Delivery Address")
                    : "Select Delivery Address"}
                </h3>
              </div>

              <label className={`dropship-toggle-row ${isDropship ? 'active' : ''}`}>
                <div className="dropship-toggle-left">
                  <input
                    type="checkbox"
                    checked={isDropship}
                    onChange={(e) => setIsDropship(e.target.checked)}
                  />
                  <span className="dropship-toggle-label-text">Direct Dropshipping to Customer</span>
                </div>
              </label>

              {showAddressForm || addresses.length === 0 ? (
                <div className="address-form">

                  {isDropship && (
                    <>
                      <div className="minimal-section-title">
                        1. Sender Details (On Parcel Label)
                      </div>

                      <div className="address-form-grid" style={{ marginBottom: '14px' }}>
                        <label className="field-label">
                          Sender Store Name *
                          <input
                            type="text"
                            placeholder="e.g. Royal Heritage Store"
                            value={senderName}
                            onChange={(e) => setSenderName(e.target.value)}
                            required
                          />
                        </label>
                        <label className="field-label">
                          Sender Contact Phone *
                          <input
                            type="tel"
                            placeholder="10-digit mobile number"
                            value={senderPhone}
                            onChange={(e) => setSenderPhone(e.target.value)}
                            required
                          />
                        </label>
                        <label className="field-label full-width">
                          Sender Address Line *
                          <input
                            type="text"
                            placeholder="Shop/Building, Street, Area"
                            value={senderAddress}
                            onChange={(e) => setSenderAddress(e.target.value)}
                            required
                          />
                        </label>
                        <label className="field-label">
                          Sender City *
                          <input
                            type="text"
                            placeholder="City"
                            value={senderCity}
                            onChange={(e) => setSenderCity(e.target.value)}
                            required
                          />
                        </label>
                        <label className="field-label">
                          Sender State *
                          <input
                            type="text"
                            placeholder="State"
                            value={senderState}
                            onChange={(e) => setSenderState(e.target.value)}
                            required
                          />
                        </label>
                        <label className="field-label">
                          Sender Pincode *
                          <input
                            type="text"
                            placeholder="6-digit pincode"
                            value={senderPincode}
                            onChange={(e) => setSenderPincode(normalizePincodeInput(e.target.value))}
                            required
                          />
                        </label>
                      </div>

                      <div className="minimal-section-title">
                        2. Customer Delivery Address
                      </div>
                    </>
                  )}

                  <div className="address-form-grid">
                    <label className="field-label">
                      {isDropship ? "Customer Full Name *" : "Full Name *"}
                      <input
                        type="text"
                        placeholder={isDropship ? "End-customer's name" : "Receiver's name"}
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        required
                      />
                    </label>

                    <label className="field-label">
                      {isDropship ? "Customer Mobile Number *" : "Phone Number *"}
                      <input
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        required
                      />
                    </label>

                    <label className="field-label full-width">
                      Address Line 1 *
                      <input
                        type="text"
                        placeholder="Flat, House no., Building, Company, Apartment"
                        value={formAddr1}
                        onChange={(e) => setFormAddr1(e.target.value)}
                        required
                      />
                    </label>

                    <label className="field-label full-width">
                      Address Line 2 (Optional)
                      <input
                        type="text"
                        placeholder="Area, Street, Sector, Village"
                        value={formAddr2}
                        onChange={(e) => setFormAddr2(e.target.value)}
                      />
                    </label>

                    <label className="field-label">
                      City *
                      <input
                        type="text"
                        placeholder="City"
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        required
                      />
                    </label>

                    <label className="field-label">
                      State *
                      <input
                        type="text"
                        placeholder="State"
                        value={formState}
                        onChange={(e) => setFormState(e.target.value)}
                        required
                      />
                    </label>

                    <label className="field-label">
                      Pincode *
                      <input
                        type="text"
                        placeholder="6-digit pincode"
                        value={formPincode}
                        onChange={(e) => setFormPincode(normalizePincodeInput(e.target.value))}
                        required
                      />
                    </label>

                    <label className="field-label">
                      Country *
                      <input
                        type="text"
                        placeholder="Country"
                        value={formCountry}
                        onChange={(e) => setFormCountry(e.target.value)}
                        required
                      />
                    </label>
                  </div>

                  {isDropship && (
                    <div style={{ marginTop: '16px' }}>
                      <label className="field-label full-width" style={{ marginBottom: '10px' }}>
                        Packaging & Branding Preference
                        <select
                          value={packingPreference}
                          onChange={(e) => setPackingPreference(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                            background: '#fff',
                            fontWeight: 500,
                            fontSize: '0.85rem',
                            color: 'var(--ink)',
                            marginTop: '4px',
                          }}
                        >
                          <option value="Blind Packaging (Zero Supplier Branding / No Price Tags)">Blind Shipping (No supplier branding or prices)</option>
                          <option value="Attach Reseller Custom Invoice">Attach Reseller Custom Invoice</option>
                          <option value="Express Plain White Gift Packaging">Express Plain White Gift Packaging</option>
                        </select>
                      </label>
                    </div>
                  )}

                  {user?.id && !isDropship && (
                    <label className="address-checkbox-label">
                      <input
                        type="checkbox"
                        checked={saveToAccount}
                        onChange={(e) => setSaveToAccount(e.target.checked)}
                      />
                      <span>Save this address to my account for future use</span>
                    </label>
                  )}

                  <button
                    type="button"
                    className="primary-button proceed-address-btn"
                    onClick={handleProceedToPayment}
                  >
                    {isDropship ? "Proceed with Dropship Address" : "Deliver to this Address"} <ArrowRight size={18} />
                  </button>
                </div>
              ) : (
                <div className="address-selector-pane">
                  <div className="saved-addresses-list">
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`address-selector-card ${selectedAddressId === addr.id ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="selected_address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => {
                            setSelectedAddressId(addr.id);
                            setSelectedAddress(addr);
                          }}
                        />
                        <div className="address-card-info">
                          <span className="name-row">
                            <strong>{addr.full_name}</strong>
                            {addr.is_default && <span className="default-badge">Default</span>}
                          </span>
                          <p className="phone-text">{addr.phone_number}</p>
                          <p className="address-text">
                            {addr.address_line1}
                            {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                          </p>
                          <p className="city-text">{addr.city}, {addr.state} - {addr.pincode}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="secondary-button add-address-trigger-btn"
                    onClick={() => {
                      setShowAddressForm(true);
                      setFormPincode(pincode || '');
                      setFormName('');
                      setFormPhone('');
                      setFormAddr1('');
                      setFormAddr2('');
                      setFormCity('');
                      setFormState('');
                    }}
                  >
                    + Add New Address
                  </button>

                  <button
                    type="button"
                    className="primary-button proceed-address-btn"
                    onClick={handleProceedToPayment}
                    disabled={!selectedAddressId}
                  >
                    Proceed to Payment <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {items.length === 0 && <p className="empty-state">Order list is empty.</p>}
              {groupedItems.map((group) => (
                <article className="cart-product-card" key={group.key}>
                  <button
                    type="button"
                    className="cart-remove-group-btn"
                    onClick={() => removeProduct(group.key)}
                    aria-label="Remove product"
                  >
                    <X size={16} />
                  </button>
                  <div className="cart-product-head">
                    <img
                      className="cart-product-image"
                      src={group.items[0]?.selectedColorImage || group.product.images[0] || fallbackProductImage}
                      alt={group.product.title}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => { e.target.style.opacity = '0'; }}
                    />
                    <div>
                      <strong>{group.product.title}</strong>
                      <span className="cart-item-code">{group.variant.code}</span>
                      <span className="cart-group-summary">
                        {priceAccess?.priceGroup === 'wholesale' ? (
                          <>
                            {(() => {
                              const isUnder999 = String(group.product?.category || '').toLowerCase() === 'under 999';
                              if (isUnder999) {
                                return `${group.totalQuantity} pc${group.totalQuantity === 1 ? '' : 's'} total`;
                              }
                              return `${group.items[0]?.quantity} Set${group.items[0]?.quantity === 1 ? '' : 's'} · ${group.totalQuantity} pcs total`;
                            })()}
                            {canViewPrices && (() => {
                              const isUnder999 = String(group.product?.category || '').toLowerCase() === 'under 999';
                              if (isUnder999) return null;
                              const setQty = group.items[0]?.quantity || 1;
                              const discountFactor = setQty >= 10 ? 0.95 : (setQty >= 5 ? 0.98 : 1.0);
                              const baseSetPrice = customerPrice(group.variant.prices, priceAccess) * (group.product.totalColors || group.product.variants.length || 1);
                              const discountedSetPrice = baseSetPrice * discountFactor;
                              return (
                                <span className="cart-group-set-price" style={{ display: 'block', marginTop: '4px', fontWeight: '500', color: 'var(--ink)' }}>
                                  {formatMoney(discountedSetPrice)} / Set
                                </span>
                              );
                            })()}
                          </>
                        ) : (
                          `${group.selectedColorsCount} color${group.selectedColorsCount === 1 ? '' : 's'} selected · ${group.totalQuantity} pc`
                        )}
                      </span>
                    </div>
                  </div>

                  {priceAccess?.priceGroup !== 'wholesale' && group.items.some(item => item.selectedColorName !== 'Select Color') && (
                    <div className="cart-color-lines">
                      {group.items.map((item) => {
                        if (item.selectedColorName === 'Select Color') return null;
                        return (
                          <div className="cart-color-line" key={item.variantCode}>
                            <span className="cart-selected-swatch">
                              <img
                                src={item.selectedColorImage || fallbackProductImage}
                                alt={item.selectedColorName || 'Color swatch'}
                                loading="lazy"
                                decoding="async"
                              />
                            </span>
                            <div className="cart-color-line-copy">
                              <strong>
                                {item.selectedColorName || 'Selected color'}
                              </strong>
                              <span>
                                {canViewPrices
                                  ? `${formatMoney(customerPrice(item.variant.prices, priceAccess))} / pc`
                                  : priceNoticeForAccess(priceAccess)}
                              </span>
                            </div>
                            {priceAccess?.priceGroup !== 'wholesale' ? (
                              <div className="qty-row">
                                <button type="button" onClick={() => updateQuantity(item, item.quantity - 1)}>-</button>
                                <span>{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item, item.quantity + 1)}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <span className="cart-qty-display-wholesale" style={{ fontSize: 'var(--small-size)', color: 'var(--muted)', fontWeight: '600', paddingRight: '12px' }}>
                                {item.quantity} {item.quantity === 1 ? 'pc' : 'pcs'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {priceAccess?.priceGroup === 'wholesale' && (
                    <div className="cart-group-wholesale-stepper" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid #f2f2f2'
                    }}>
                      <span style={{ fontSize: 'var(--small-size)', color: 'var(--muted)', fontWeight: '600' }}>
                        Quantity: {group.items[0]?.quantity} Set{group.items[0]?.quantity === 1 ? '' : 's'}
                      </span>
                      <div className="qty-row">
                        <button type="button" onClick={() => updateQuantity(group.items[0], group.items[0].quantity - 1)}>-</button>
                        <span>{group.items[0]?.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(group.items[0], group.items[0].quantity + 1)}>+</button>
                      </div>
                    </div>
                  )}

                  {priceAccess?.priceGroup !== 'wholesale' && group.colorOptions.length > 0 && (
                    <div className="cart-color-picker">
                      <span>{group.selectedColorNames.has('Select Color') ? 'Select Color' : 'Add more colors'}</span>
                      <div className="cart-color-swatch-row">
                        {group.colorOptions.map((color) => (
                          <button
                            key={`${color.name}-${color.image}`}
                            type="button"
                            className={group.selectedColorNames.has(color.name) ? 'active' : ''}
                            onClick={() => addCartColor(group.items[0], color)}
                            aria-label={`Add ${color.name}`}
                            title={`Add ${color.name}`}
                          >
                            <img
                              src={color.image || fallbackProductImage}
                              alt={color.name || 'Color option'}
                              loading="lazy"
                              decoding="async"
                            />
                            <Plus size={11} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </>
          )}
        </div>
        <div className="drawer-foot">
          {discount > 0 && (
            <div className="cart-price-breakdown" style={{ marginBottom: '12px', borderBottom: '1px dashed #e6e6e6', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--small-size)', color: 'var(--muted)', marginBottom: '6px' }}>
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--small-size)', color: 'var(--primary-color)', fontWeight: '600' }}>
                <span>Combo Discount</span>
                <span>-{formatMoney(discount)}</span>
              </div>
            </div>
          )}
          <div className="total-row">
            <span>Total</span>
            <strong>{total != null ? formatMoney(total) : priceNoticeForAccess(priceAccess)}</strong>
          </div>

          {showUpiDetails ? (
            <button
              type="button"
              className="primary-button paid-confirm-btn"
              onClick={handlePaidConfirmClick}
              disabled={enquiryState === 'sending'}
              style={enquiryState === 'sent' ? { background: '#128C7E', color: '#fff', borderColor: '#128C7E' } : {}}
            >
              <WhatsappIcon size={20} /> {
                enquiryState === 'sent' ? 'Payment Shared' :
                  enquiryState === 'sending' ? 'Opening WhatsApp...' : 'Share Payment Screenshot'
              } <ArrowRight size={18} />
            </button>
          ) : addressStep ? (
            <div className="cart-info-alert">
              <svg className="alert-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>Complete your delivery details to proceed to secure payment.</span>
            </div>
          ) : (
            <>
              {hasUnselectedColors && (
                <div className="cart-info-alert warning-alert animate-shake">
                  <svg className="alert-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <span>Please select a color for all items before making an enquiry.</span>
                </div>
              )}

              {items.length > 0 && !hasUnselectedColors && priceAccess?.priceGroup === 'wholesale' && (
                <div className="cart-info-alert">
                  <svg className="alert-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>Kindly share order quantity and delivery pincode for shipping charges.</span>
                </div>
              )}

              <div className="cart-action-group">
                {items.length > 0 && showPayment && !hasUnselectedColors && (
                  <button
                    type="button"
                    className={`payment-trigger-btn ${showUpiDetails || addressStep ? 'active' : ''}`}
                    onClick={handlePaymentTriggerClick}
                  >
                    <CreditCard size={15} /> {showUpiDetails || addressStep ? 'Hide Payment' : 'Make Payment'}
                  </button>
                )}
                <button
                  type="button"
                  className={`enquiry-submit-btn ${items.length && !hasUnselectedColors ? '' : 'disabled'}`}
                  onClick={handleEnquiryClick}
                  disabled={!items.length || hasUnselectedColors}
                  style={enquiryState === 'sent' ? { background: '#128C7E', color: '#fff', borderColor: '#128C7E' } : {}}
                >
                  <WhatsappIcon size={15} /> {enquiryState === 'sent' ? 'Sent' : 'Submit Enquiry'}
                </button>
              </div>
            </>
          )}
        </div>
        <EnquiryPopup
          open={enquiryPopupOpen}
          onClose={() => setEnquiryPopupOpen(false)}
          whatsappUrl={whatsappUrl}
        />
      </aside>
    </div>
  );
}
