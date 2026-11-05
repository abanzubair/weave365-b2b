/**
 * @file Account.jsx
 * @description The user account area view for boutique owners and resellers. Aggregates and displays
 * buyer profile details, approved B2B pricing groups, active bulk order lists, saved favorites,
 * and entry points to the personalized Reseller Business Center (white-label storefront tools).
 * 
 * @module views/Account
 * @param {Object} props
 * @param {Object} props.user - Current user object from Supabase authentication
 * @param {Object} props.buyerProfile - Buyer profile data including business name, pincode, etc.
 * @param {Object} props.priceAccess - Evaluated price permissions, buyer groups, and approval states
 * @param {Array} props.cartItems - Items currently in the draft order list
 * @param {Array} props.favoriteProducts - Bookmarked products list
 * @param {Function} props.navigate - Application route/navigation handler
 * @param {Function} props.openAuth - Trigger callback to display login/registration modal
 * @param {Function} props.updateQuantity - Callback to adjust the quantity of items in the draft order list
 * @param {Function} props.onSignOut - Callback to end the user session
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Bookmark, 
  ClipboardList, 
  Heart, 
  History, 
  Lock,
  LockKeyhole, 
  ShoppingBag, 
  UserRound, 
  MapPin, 
  Plus, 
  Edit, 
  Edit3,
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  Boxes, 
  Store, 
  Globe,
  Code2, 
  ArrowUpRight, 
  LogOut, 
  Copy,
  ExternalLink,
  Phone,
  Check,
  Share2,
  User,
  Upload,
  List,
  LayoutGrid,
  ChevronDown,
  ChevronUp
} from '../components/icons.jsx';
import { customerPrice, fallbackProductImage, formatMoney, calculateHybridCartTotals, calculateComboDiscount } from '../storefrontShared.jsx';
import { getOptimizedImageUrl, getOriginalImageUrl } from '../utils/imageOptimizer.js';
import { priceNoticeForAccess, isAccountLocked, detectAccountCategory, isVendorProfile } from '../utils/buyerAccess.js';
import { ResellerTools } from '../components/ResellerTools.jsx';
import { ResellerUpgradeCard } from '../components/ResellerUpgradeCard.jsx';
import { UserProfileTab } from '../components/UserProfileTab.jsx';
import { VendorStockPanel } from '../components/VendorStockPanel.jsx';
import { SellerProductUpload } from '../components/SellerProductUpload.jsx';
import { DeveloperDashboard } from '../components/developer/DeveloperDashboard.jsx';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { applyAsInfluencer, fetchInfluencerStats } from '../utils/influencerHelpers.js';
import { isProfileComplete } from '../utils/profileHelpers.js';
import { adminEmails, storeConfig } from '../config.js';
import '../styles/developerDashboard.css';
import '../styles/accountMinimal.css';

function titleCase(value) {
  return String(value || 'pending')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusBadgeStyle(status) {
  const s = String(status || 'new').toLowerCase();
  switch (s) {
    case 'delivered':
    case 'done':
    case 'completed':
      return { backgroundColor: '#eafaf1', color: '#2e7d32', border: '1px solid rgba(46, 125, 50, 0.2)' };
    case 'dispatched':
    case 'in_transit':
    case 'shipped':
      return { backgroundColor: '#fdf2f8', color: '#be185d', border: '1px solid #fbcfe8' };
    case 'paid':
    case 'payment_received':
    case 'payment received':
      return { backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' };
    case 'verified':
    case 'processing':
    case 'qc':
    case 'in_fulfillment':
    case 'active':
      return { backgroundColor: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' };
    case 'pending_payment':
    case 'payment_pending':
      return { backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' };
    case 'cancelled':
    case 'rejected':
      return { backgroundColor: '#ffebee', color: '#c62828', border: '1px solid rgba(198, 40, 40, 0.2)' };
    default:
      return { backgroundColor: '#f5f5f5', color: '#616161', border: '1px solid rgba(97, 97, 97, 0.2)' };
  }
}

function isOrderDropship(order) {
  if (!order) return false;
  if (order.is_dropship || order.isDropship) return true;
  if (order._sourceTable === 'api_orders') return true;
  if (order.inquiry_type === 'reseller_api_order') return true;
  if (Array.isArray(order.order_dropship_senders) && order.order_dropship_senders.length > 0) return true;
  if (order.order_dropship_senders && typeof order.order_dropship_senders === 'object' && Object.keys(order.order_dropship_senders).length > 0) return true;
  if (order.dropship_sender_name || order.dropship_recipient_name) return true;
  return false;
}

export function Account({
  user,
  setUser,
  buyerProfile,
  setBuyerProfile,
  priceAccess,
  cartItems,
  favoriteProducts,
  products = [],
  navigate,
  openAuth,
  updateQuantity,
  onSignOut,
  initialTab,
}) {
  const userEmail = String(user?.email || '').toLowerCase().trim();
  const isAdmin = Boolean(userEmail && adminEmails.includes(userEmail)) || user?.role === 'admin' || user?.user_metadata?.role === 'admin' || buyerProfile?.role === 'admin';

  const isVendor = !isAdmin && (
                   isVendorProfile(buyerProfile) ||
                   isVendorProfile(user?.user_metadata?.buyer_profile) ||
                   isVendorProfile(user?.buyer_profile) ||
                   buyerProfile?.buyer_type === 'vendor' ||
                   user?.user_metadata?.buyer_profile?.buyer_type === 'vendor' ||
                   user?.buyer_profile?.buyer_type === 'vendor' ||
                   buyerProfile?.buyer_subtype?.toLowerCase().includes('vendor') ||
                   user?.user_metadata?.buyer_profile?.buyer_subtype?.toLowerCase().includes('vendor') ||
                   user?.buyer_profile?.buyer_subtype?.toLowerCase().includes('vendor') ||
                   buyerProfile?.role === 'vendor' ||
                   user?.user_metadata?.role === 'vendor' ||
                   user?.role === 'vendor' ||
                   buyerProfile?.user_type === 'supplier' ||
                   user?.user_metadata?.user_type === 'supplier' ||
                   priceAccess?.buyerType === 'vendor' ||
                   Boolean(buyerProfile?.vendor_code) ||
                   Boolean(user?.user_metadata?.buyer_profile?.vendor_code) ||
                   Boolean(user?.buyer_profile?.vendor_code));

  const accountLocked = isAccountLocked(buyerProfile, user);

  const isCustomer = !isAdmin && !isVendor && (priceAccess?.isCustomer ?? (detectAccountCategory(user, buyerProfile) === 'customer'));

  // Quick WhatsApp upgrade link for customer accounts wishing to switch to a business account
  const cleanStoreWa = String(storeConfig?.whatsapp || '9919101369').replace(/\D/g, '');
  const fullWaPhone = cleanStoreWa.length === 10 ? `91${cleanStoreWa}` : cleanStoreWa;
  const activeCustomerName = buyerProfile?.full_name || user?.user_metadata?.full_name || '';
  const activeCustomerEmail = user?.email || buyerProfile?.email || '';
  const businessWaMsg = `Hi Weave365, I would like to switch my account to a Business & Reseller account.\nName: ${activeCustomerName || 'N/A'}\nEmail: ${activeCustomerEmail || 'N/A'}`;
  const businessWaUrl = `https://wa.me/${fullWaPhone}?text=${encodeURIComponent(businessWaMsg)}`;

  const userSwitchedTabRef = useRef(false);

  const resolveDefaultTab = useCallback(() => {
    if (initialTab === 'upload' || initialTab === 'vendor-upload') {
      return isVendor ? 'vendor-upload' : 'orders';
    }
    if (
      initialTab === 'stock' ||
      initialTab === 'vendor' ||
      initialTab === 'vendor-stock' ||
      initialTab === 'inventory' ||
      initialTab === 'stock-inventory'
    ) {
      return isVendor ? 'vendor-stock' : 'orders';
    }
    if (isVendor && (initialTab === 'influencer' || initialTab === 'affiliates' || initialTab === 'developer')) {
      return 'vendor-stock';
    }
    if (initialTab) return initialTab;
    if (isVendor && !accountLocked) return 'vendor-stock';
    return 'profile';
  }, [initialTab, isVendor, accountLocked]);

  const [activeTab, setActiveTab] = useState(() => {
    if (accountLocked) return 'profile';
    return resolveDefaultTab();
  });

  const handleSelectTab = useCallback((tabName) => {
    userSwitchedTabRef.current = true;
    setActiveTab(tabName);
  }, []);

  const [orderSubTab, setOrderSubTab] = useState('history');
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'dropship' | 'direct'

  useEffect(() => {
    if (accountLocked) {
      setActiveTab('profile');
      return;
    }
    if (initialTab) {
      userSwitchedTabRef.current = false;
      if (initialTab === 'upload' || initialTab === 'vendor-upload') {
        setActiveTab(isVendor ? 'vendor-upload' : 'orders');
      } else if (
        initialTab === 'stock' ||
        initialTab === 'vendor' ||
        initialTab === 'vendor-stock' ||
        initialTab === 'inventory' ||
        initialTab === 'stock-inventory'
      ) {
        setActiveTab(isVendor ? 'vendor-stock' : 'orders');
      } else if (isVendor && (initialTab === 'influencer' || initialTab === 'affiliates' || initialTab === 'developer')) {
        setActiveTab('vendor-stock');
      } else {
        setActiveTab(initialTab);
      }
      return;
    }

    // Default opening tab for seller account is stock inventory
    if (isVendor && !userSwitchedTabRef.current) {
      setActiveTab('vendor-stock');
    }
  }, [initialTab, isVendor, accountLocked]);

  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showAddEditForm, setShowAddEditForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Placed orders state
  const [placedOrders, setPlacedOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [copiedTrackingId, setCopiedTrackingId] = useState(null);
  const [orderViewMode, setOrderViewMode] = useState('ledger');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const copyCustomerTrackingLink = (orderRef) => {
    if (typeof window === 'undefined') return;
    const link = `${window.location.origin}/order-tracking/${encodeURIComponent(orderRef)}`;
    navigator.clipboard.writeText(link);
    setCopiedTrackingId(orderRef);
    setTimeout(() => setCopiedTrackingId(null), 2000);
  };

  // Influencer Program State
  const [influencerProfile, setInfluencerProfile] = useState(null);
  const [influencerLoading, setInfluencerLoading] = useState(false);
  const [influencerStats, setInfluencerStats] = useState({ clicks: 0, referrals: [] });

  // Application Form State
  const [infFormCode, setInfFormCode] = useState('');
  const [infFormPayoutMethod, setInfFormPayoutMethod] = useState('upi');
  const [infFormUpiId, setInfFormUpiId] = useState('');
  const [infFormBankName, setInfFormBankName] = useState('');
  const [infFormAccountNo, setInfFormAccountNo] = useState('');
  const [infFormIfsc, setInfFormIfsc] = useState('');
  const [infFormSubmitting, setInfFormSubmitting] = useState(false);
  const [infFormError, setInfFormError] = useState('');

  const fetchInfluencerData = async () => {
    if (!user?.id || !isSupabaseConfigured) return;
    setInfluencerLoading(true);
    try {
      const stats = await fetchInfluencerStats(user.id);
      setInfluencerProfile(stats.profile);
      setInfluencerStats({
        clicks: stats.clicks,
        referrals: stats.referrals
      });
      // prefill referral code form with full name slug if empty
      if (!stats.profile && !infFormCode) {
        const name = buyerProfile?.full_name || buyerProfile?.business_name || '';
        if (name) {
          const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '');
          setInfFormCode(slug.toUpperCase().slice(0, 10));
        }
      }
    } catch (err) {
      console.error('Error loading influencer data:', err);
    } finally {
      setInfluencerLoading(false);
    }
  };

  const handleApplyInfluencer = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!infFormCode || infFormCode.length < 3) {
      setInfFormError('Referral code must be at least 3 characters.');
      return;
    }
    setInfFormSubmitting(true);
    setInfFormError('');
    try {
      const paymentDetails = infFormPayoutMethod === 'upi' 
        ? { payout_method: 'upi', upi_id: infFormUpiId }
        : { payout_method: 'bank', bank_name: infFormBankName, account_number: infFormAccountNo, ifsc: infFormIfsc };

      const { data, error: applyErr } = await applyAsInfluencer(user.id, infFormCode, paymentDetails);
      if (applyErr) {
        setInfFormError(applyErr.message || 'Failed to submit application.');
      } else {
        await fetchInfluencerData();
      }
    } catch (err) {
      console.error('Apply influencer error:', err);
      setInfFormError(err.message || 'Error occurred while applying.');
    } finally {
      setInfFormSubmitting(false);
    }
  };

  // Address form fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddr1, setFormAddr1] = useState('');
  const [formAddr2, setFormAddr2] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const [formCountry, setFormCountry] = useState('India');
  const [isDefault, setIsDefault] = useState(false);

  const normalizePincodeInput = (value) => {
    return String(value || '').replace(/[^a-zA-Z0-9\s-]/g, '').slice(0, 12);
  };

  const fetchAddresses = async () => {
    if (!user?.id || !isSupabaseConfigured) return;
    setAddressLoading(true);
    try {
      const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
      if (error) throw error;
      setAddresses(data || []);
    } catch (err) {
      console.error('Error loading addresses:', err);
    } finally {
      setAddressLoading(false);
    }
  };

  const fetchPlacedOrders = async () => {
    if (!user?.id || !isSupabaseConfigured) return;
    setOrdersLoading(true);
    try {
      const queries = [
        supabase
          .from('orders')
          .select('*, order_delivery_addresses(*), order_dropship_senders(*), order_items(*), order_fulfillments(*)')
          .eq('user_id', user.id),
        supabase.from('inquiries').select('*').eq('user_id', user.id)
      ];

      try {
        queries.push(
          supabase
            .from('api_orders')
            .select('*')
            .eq('user_id', user.id)
        );
      } catch (e) {
        // Safe catch if api_orders is unavailable
      }

      const results = await Promise.allSettled(queries);
      const ordersRes = results[0]?.status === 'fulfilled' ? results[0].value : { data: [], error: results[0]?.reason };
      const inquiriesRes = results[1]?.status === 'fulfilled' ? results[1].value : { data: [], error: results[1]?.reason };
      const apiOrdersRes = results[2]?.status === 'fulfilled' ? results[2].value : { data: [], error: results[2]?.reason };

      const rawOrders = (ordersRes.data || []).map(o => ({ ...o, _sourceTable: 'orders' }));
      const rawInquiries = (inquiriesRes.data || []).map(i => ({ ...i, _sourceTable: 'inquiries' }));
      const rawApiOrders = (!apiOrdersRes?.error && apiOrdersRes?.data) ? apiOrdersRes.data.map(a => {
        let parsedItems = [];
        if (Array.isArray(a.items)) {
          parsedItems = a.items;
        } else if (typeof a.items === 'string') {
          try {
            parsedItems = JSON.parse(a.items);
          } catch (_) {
            parsedItems = [];
          }
        }

        let explicitSenderAddress = null;
        if (a.shipping_notes) {
          const addrMatch = a.shipping_notes.match(/\[Sender Address:\s*({[^}]+})\]/i);
          if (addrMatch) {
            try {
              explicitSenderAddress = JSON.parse(addrMatch[1]);
            } catch (_) {}
          }
        }

        const userDefaultAddr = addresses.find(ad => ad.is_default) || addresses[0] || null;
        const customDispatchAddr = buyerProfile?.qualification?.dispatch_address || null;

        const senderName = a.sender_name || customDispatchAddr?.name || customDispatchAddr?.full_name || userDefaultAddr?.full_name || buyerProfile?.business_name || buyerProfile?.full_name || 'Reseller';
        const senderPhone = a.sender_phone || customDispatchAddr?.phone || customDispatchAddr?.phone_number || userDefaultAddr?.phone_number || buyerProfile?.whatsapp || '';
        const senderLine1 = explicitSenderAddress?.address || customDispatchAddr?.address_line1 || userDefaultAddr?.address_line1 || '';
        const senderLine2 = explicitSenderAddress?.address_line2 || customDispatchAddr?.address_line2 || userDefaultAddr?.address_line2 || '';
        const fullSenderStreet = [senderLine1, senderLine2].filter(Boolean).join(', ');
        const senderCity = explicitSenderAddress?.city || customDispatchAddr?.city || userDefaultAddr?.city || buyerProfile?.city || '';
        const senderState = explicitSenderAddress?.state || customDispatchAddr?.state || userDefaultAddr?.state || buyerProfile?.state || '';
        const senderPincode = explicitSenderAddress?.pincode || customDispatchAddr?.pincode || userDefaultAddr?.pincode || buyerProfile?.pincode || '';

        return {
          ...a,
          _sourceTable: 'api_orders',
          is_dropship: true,
          order_number: a.order_number || (a.reseller_order_id ? (String(a.reseller_order_id).startsWith('API-') ? a.reseller_order_id : `API-${a.reseller_order_id}`) : a.id),
          buyer_name: a.recipient_name || a.buyer_name,
          phone: a.recipient_phone || a.phone,
          email: a.recipient_email || a.email,
          pincode: a.recipient_pincode || a.pincode,
          dropship_sender_name: senderName,
          dropship_sender_phone: senderPhone,
          dropship_sender_address: fullSenderStreet,
          dropship_sender_city: senderCity,
          dropship_sender_state: senderState,
          dropship_sender_pincode: senderPincode,
          dropship_recipient_name: a.recipient_name,
          dropship_recipient_phone: a.recipient_phone,
          dropship_recipient_address: a.recipient_address,
          dropship_recipient_city: a.recipient_city,
          dropship_recipient_state: a.recipient_state,
          dropship_recipient_pincode: a.recipient_pincode,
          dropship_packing_preference: a.packing_preference,
          order_items: parsedItems,
          items: parsedItems,
          message: a.shipping_notes || a.message,
        };
      }) : [];

      const combined = [...rawOrders, ...rawInquiries, ...rawApiOrders];

      combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPlacedOrders(combined);
    } catch (err) {
      console.error('Error loading placed orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'addresses' && user?.id) {
      fetchAddresses();
    } else if (activeTab === 'orders' && user?.id) {
      fetchPlacedOrders();
    } else if (activeTab === 'influencer' && user?.id) {
      fetchInfluencerData();
    }
  }, [activeTab, user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchAddresses();
      fetchPlacedOrders();
      fetchInfluencerData();
    }
  }, [user?.id]);

  const handleStartEdit = (addr) => {
    setEditingAddress(addr);
    setFormName(addr.full_name || '');
    setFormPhone(addr.phone_number || '');
    setFormAddr1(addr.address_line1 || '');
    setFormAddr2(addr.address_line2 || '');
    setFormCity(addr.city || '');
    setFormState(addr.state || '');
    setFormPincode(addr.pincode || '');
    setFormCountry(addr.country || 'India');
    setIsDefault(addr.is_default || false);
    setShowAddEditForm(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!user?.id || !isSupabaseConfigured) return;

    const addrData = {
      full_name: formName.trim(),
      phone_number: formPhone.trim(),
      address_line1: formAddr1.trim(),
      address_line2: formAddr2.trim() || null,
      city: formCity.trim(),
      state: formState.trim(),
      pincode: formPincode.trim(),
      country: formCountry.trim(),
      is_default: isDefault,
    };

    try {
      if (isDefault) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      if (editingAddress) {
        const { error } = await supabase
          .from('addresses')
          .update(addrData)
          .eq('id', editingAddress.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const isFirst = addresses.length === 0;
        const { error } = await supabase
          .from('addresses')
          .insert({
            ...addrData,
            user_id: user.id,
            is_default: isDefault || isFirst,
          });
        if (error) throw error;
      }

      setShowAddEditForm(false);
      setEditingAddress(null);
      await fetchAddresses();
    } catch (err) {
      console.error('Failed to save address:', err);
      alert('Error saving address. Please try again.');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    if (!isSupabaseConfigured || !user?.id) return;

    try {
      const target = addresses.find(a => a.id === id);
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;

      if (target?.is_default && addresses.length > 1) {
        const remaining = addresses.filter(a => a.id !== id);
        await supabase
          .from('addresses')
          .update({ is_default: true })
          .eq('id', remaining[0].id)
          .eq('user_id', user.id);
      }

      await fetchAddresses();
    } catch (err) {
      console.error('Failed to delete address:', err);
      alert('Error deleting address.');
    }
  };

  const handleSetDefault = async (id) => {
    if (!user?.id || !isSupabaseConfigured) return;

    try {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;

      await fetchAddresses();
    } catch (err) {
      console.error('Failed to set default address:', err);
      alert('Error setting default address.');
    }
  };

  const hybridTotals = useMemo(() => {
    return calculateHybridCartTotals(cartItems || [], priceAccess);
  }, [cartItems, priceAccess]);

  const subtotal = hybridTotals.subtotal;
  const discount = hybridTotals.discount;
  const total = hybridTotals.total;

  const groupedCartItems = useMemo(() => {
    const groups = new Map();

    (cartItems || []).forEach((item) => {
      const key = item.productGroupKey || item.product?.id || item.productId || item.product?.title || 'unknown';
      const group = groups.get(key) || {
        key,
        product: item.product,
        variant: item.variant,
        colorOptions: item.colorOptions || item.product?.colorOptions || [],
        items: [],
      };

      group.items.push(item);
      groups.set(key, group);
    });

    return Array.from(groups.values()).map((group) => {
      const activeItems = group.items.filter(
        (item) => item.selectedColorName && item.selectedColorName !== 'Select Color'
      );
      return {
        ...group,
        totalQuantity: group.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
        selectedColorsCount: activeItems.length,
      };
    });
  }, [cartItems]);

  const userInitials = (buyerProfile?.full_name || buyerProfile?.business_name || user?.email || 'U')
    .trim()
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const enquiriesList = useMemo(() => {
    return (placedOrders || []).filter(o => o._sourceTable === 'inquiries' || String(o.status || '').toLowerCase() === 'inquiry');
  }, [placedOrders]);


  const allPaidOrdersList = useMemo(() => {
    const EXCLUDED_STATUSES = ['draft'];
    return (placedOrders || []).filter(o => {
      if (o._sourceTable === 'inquiries' || String(o.status || '').toLowerCase() === 'inquiry') return false;
      const st = String(o.status || '').toLowerCase().trim();
      if (EXCLUDED_STATUSES.includes(st)) return false;
      return true;
    });
  }, [placedOrders]);

  const dropshipOrdersList = useMemo(() => {
    return allPaidOrdersList.filter(o => isOrderDropship(o));
  }, [allPaidOrdersList]);

  const directOrdersList = useMemo(() => {
    return allPaidOrdersList.filter(o => !isOrderDropship(o));
  }, [allPaidOrdersList]);

  const resolveOrderItemImage = useCallback((item) => {
    if (!item) return fallbackProductImage;
    if (item.thumbnail_url) return item.thumbnail_url;
    if (item.image) return item.image;
    if (item.image_url) return item.image_url;
    if (item.selectedColorImage) return item.selectedColorImage;

    const skuCode = String(item.variant_code || item.sku || item.product_id || item.id || '').trim().toLowerCase();
    const itemColor = String(item.color || '').trim().toLowerCase();

    if (Array.isArray(products) && products.length > 0) {
      const matched = products.find(p => {
        if (String(p.id).toLowerCase() === skuCode || String(p.code || '').toLowerCase() === skuCode) return true;
        if (p.variants?.some(v => String(v.code || '').toLowerCase() === skuCode)) return true;
        return false;
      });

      if (matched) {
        if (itemColor && matched.colorOptions) {
          const opt = matched.colorOptions.find(c => String(c.name || '').toLowerCase() === itemColor);
          if (opt?.image) return opt.image;
        }
        if (itemColor && matched.colorImages && matched.colorImages[itemColor]) {
          return matched.colorImages[itemColor];
        }
        return matched.images?.[0] || fallbackProductImage;
      }

      if (item.product_title || item.title) {
        const titleLower = String(item.product_title || item.title).trim().toLowerCase();
        const matchedByTitle = products.find(p => String(p.title || p.name || '').toLowerCase() === titleLower);
        if (matchedByTitle) {
          if (itemColor && matchedByTitle.colorOptions) {
            const opt = matchedByTitle.colorOptions.find(c => String(c.name || '').toLowerCase() === itemColor);
            if (opt?.image) return opt.image;
          }
          if (itemColor && matchedByTitle.colorImages && matchedByTitle.colorImages[itemColor]) {
            return matchedByTitle.colorImages[itemColor];
          }
          return matchedByTitle.images?.[0] || fallbackProductImage;
        }
      }
    }
    return fallbackProductImage;
  }, [products]);

  if (!user) {
    return (
      <section className="section empty-page">
        <LockKeyhole size={32} />
        <h1>Login to access your B2B account</h1>
        <p>Your orders, saved items, addresses and wholesale pricing tier stay linked to your buyer account.</p>
        <button className="primary-button" type="button" onClick={() => navigate ? navigate('signup') : (openAuth && openAuth())}>
          Sign In / Register
        </button>
      </section>
    );
  }

  return (
    <section className="account-page-minimal">
      {/* 1. MINIMAL HERO HEADER (COMMENTED OUT)
      <div className="account-hero-minimal">
        <div className="account-hero-left">
          <div className="account-avatar-minimal">
            <span>{userInitials}</span>
            <span className="account-avatar-online-dot" title="Active B2B Session" />
          </div>
          <div className="account-identity-block">
            <div className="account-name-row">
              <h1 className="account-user-name">
                {buyerProfile?.business_name || buyerProfile?.full_name || (userEmail ? userEmail.split('@')[0] : 'My Account')}
              </h1>
              {(isAdmin || isVendor) && (
                <div className="account-chips-row">
                  <span className="account-chip role">
                    {isAdmin ? 'Administrator' : 'Vendor Partner'}
                  </span>
                </div>
              )}
            </div>
            <div className="account-sub-meta">
              <span className="account-email-text">{user.email}</span>
              {buyerProfile?.city && (
                <>
                  <span className="account-meta-dot">•</span>
                  <span>{buyerProfile.city}</span>
                </>
              )}
              {buyerProfile?.pincode && (
                <>
                  <span className="account-meta-dot">•</span>
                  <span>PIN {buyerProfile.pincode}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="account-hero-actions-minimal">
          <button 
            type="button" 
            className="account-action-outline-btn"
            onClick={() => navigate('catalogue')}
          >
            <span>Browse Catalogue</span>
            <ArrowUpRight size={14} />
          </button>
          <button 
            type="button" 
            className="account-action-logout-btn"
            onClick={onSignOut}
            title="Log Out"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
      */}

      {/* 2. LOCKED ACCOUNT NOTIFICATION OR INCOMPLETE PROFILE NOTICE */}
      {accountLocked ? (
        <div className="account-locked-top-strip" role="alert">
          <Lock size={14} className="account-locked-top-icon" />
          <div className="account-locked-top-text">
            <strong>Account Locked:</strong>
            <span>Complete your {isVendor ? 'supplier partner' : 'business & reseller'} profile below to unlock all features.</span>
          </div>
        </div>
      ) : (
        !isProfileComplete(user, buyerProfile) && (
          <div className="account-profile-incomplete-strip">
            <div className="incomplete-strip-text">
              <AlertTriangle size={17} className="incomplete-strip-icon" />
              <div>
                <strong>
                  {isVendor 
                    ? 'Complete your supplier partner profile' 
                    : (buyerProfile?.user_type === 'business' || buyerProfile?.business_name
                        ? 'Complete your wholesale profile' 
                        : 'Complete your account profile')}
                </strong>
                <span>
                  {isVendor
                    ? 'Add your contact person, city, and dispatch location to activate supplier verification.'
                    : (buyerProfile?.user_type === 'business' || buyerProfile?.business_name
                        ? 'Add your WhatsApp number, city, and pincode to activate wholesale factory pricing.'
                        : 'Add your WhatsApp number, city, and pincode for seamless order delivery and updates.')}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="account-strip-btn"
              onClick={() => handleSelectTab('profile')}
            >
              Complete Profile →
            </button>
          </div>
        )
      )}

      {/* 3. MINIMAL TAB NAVIGATION */}
      <nav className="account-nav-bar" aria-label="Account Tabs">
        {isVendor && (
          <>
            <button 
              type="button" 
              className={`account-nav-item ${activeTab === 'vendor-stock' ? 'active' : ''} ${accountLocked ? 'locked' : ''}`}
              onClick={() => !accountLocked && handleSelectTab('vendor-stock')}
              disabled={accountLocked}
              title={accountLocked ? 'Account locked: Complete profile to unlock' : undefined}
            >
              {accountLocked ? <Lock size={15} /> : <Boxes size={16} />}
              <span>Stock Inventory</span>
            </button>
            <button 
              type="button" 
              className={`account-nav-item ${activeTab === 'vendor-upload' ? 'active' : ''} ${accountLocked ? 'locked' : ''}`}
              onClick={() => !accountLocked && handleSelectTab('vendor-upload')}
              disabled={accountLocked}
              title={accountLocked ? 'Account locked: Complete profile to unlock' : undefined}
            >
              {accountLocked ? <Lock size={15} /> : <Upload size={16} />}
              <span>Upload Design</span>
            </button>
          </>
        )}
        <button 
          type="button" 
          className={`account-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => handleSelectTab('profile')}
        >
          <User size={16} />
          <span>Profile</span>
        </button>
        <button 
          type="button" 
          className={`account-nav-item ${activeTab === 'orders' ? 'active' : ''} ${accountLocked ? 'locked' : ''}`}
          onClick={() => !accountLocked && handleSelectTab('orders')}
          disabled={accountLocked}
          title={accountLocked ? 'Account locked: Complete profile to unlock' : undefined}
        >
          {accountLocked ? <Lock size={15} /> : <ClipboardList size={16} />}
          <span>Orders</span>
          {allPaidOrdersList.length > 0 && <span className="nav-count">{allPaidOrdersList.length}</span>}
        </button>
        <button 
          type="button" 
          className={`account-nav-item ${activeTab === 'addresses' ? 'active' : ''} ${accountLocked ? 'locked' : ''}`}
          onClick={() => !accountLocked && handleSelectTab('addresses')}
          disabled={accountLocked}
          title={accountLocked ? 'Account locked: Complete profile to unlock' : undefined}
        >
          {accountLocked ? <Lock size={15} /> : <MapPin size={16} />}
          <span>Addresses</span>
          {addresses.length > 0 && <span className="nav-count">{addresses.length}</span>}
        </button>
        {/* <button 
          type="button" 
          className={`account-nav-item ${activeTab === 'reseller' ? 'active' : ''}`}
          onClick={() => setActiveTab('reseller')}
        >
          <Globe size={16} />
          <span>Build Your Own Website</span>
        </button> */}
        {!isVendor && (
          <button 
            type="button" 
            className={`account-nav-item ${activeTab === 'influencer' ? 'active' : ''} ${accountLocked ? 'locked' : ''}`}
            onClick={() => !accountLocked && handleSelectTab('influencer')}
            disabled={accountLocked}
            title={accountLocked ? 'Account locked: Complete profile to unlock' : undefined}
          >
            {accountLocked ? <Lock size={15} /> : <UserRound size={16} />}
            <span>Affiliates</span>
          </button>
        )}
        {!isVendor && (
          <button 
            type="button" 
            className={`account-nav-item ${activeTab === 'developer' ? 'active' : ''} ${accountLocked ? 'locked' : ''}`}
            onClick={() => !accountLocked && handleSelectTab('developer')}
            disabled={accountLocked}
            title={accountLocked ? 'Account locked: Complete profile to unlock' : undefined}
          >
            {accountLocked ? <Lock size={15} /> : <Code2 size={16} />}
            <span>Developer API</span>
          </button>
        )}
      </nav>

      {/* 4. ACTIVE TAB CONTENT */}
      <div className="account-tab-content-area">
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="account-panel-minimal panel-transparent">
            <UserProfileTab 
              user={user} 
              buyerProfile={buyerProfile} 
              setBuyerProfile={setBuyerProfile} 
              setUser={setUser} 
            />
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="account-panel-minimal panel-transparent">
            <div className="account-section-header">
              <div className="account-order-subtabs">
                <button
                  type="button"
                  className={`account-order-subtab-btn ${orderSubTab === 'history' ? 'active' : ''}`}
                  onClick={() => setOrderSubTab('history')}
                >
                  Order History {allPaidOrdersList.length > 0 && <span className="subtab-badge">({allPaidOrdersList.length})</span>}
                </button>
                <button
                  type="button"
                  className={`account-order-subtab-btn ${orderSubTab === 'pending' ? 'active' : ''}`}
                  onClick={() => setOrderSubTab('pending')}
                >
                  Pending Order {(cartItems?.length || 0) > 0 && (
                    <span className="subtab-badge">({cartItems.length})</span>
                  )}
                </button>
                <button
                  type="button"
                  className={`account-order-subtab-btn ${orderSubTab === 'enquiry' ? 'active' : ''}`}
                  onClick={() => setOrderSubTab('enquiry')}
                >
                  Enquiry {enquiriesList.length > 0 && <span className="subtab-badge">({enquiriesList.length})</span>}
                </button>
              </div>
            </div>

            {orderSubTab === 'pending' ? (
              <div className="pending-orders-section">
                {/* 1. DRAFT SOURCING CART ITEMS */}
                {cartItems && cartItems.length > 0 && (
                  <div className="draft-cart-container">
                    <div className="draft-cart-groups-stack">
                      {groupedCartItems.map((group) => {
                        const hybridInfo = hybridTotals.productPricing?.[group.product?.id];
                        const isUnder999 = String(group.product?.category || '').toLowerCase() === 'under 999';

                        return (
                          <div className="draft-cart-group-card" key={group.key}>
                            {/* Product Header */}
                            <div className="draft-cart-group-header">
                              <div className="draft-cart-group-main">
                                {(() => {
                                  const raw = group.items[0]?.selectedColorImage || group.product?.images?.[0] || fallbackProductImage;
                                  return (
                                    <img 
                                      src={getOptimizedImageUrl(raw, 'thumbnail')} 
                                      alt={group.product?.title} 
                                      className="draft-cart-group-thumb"
                                      loading="lazy" 
                                      onError={(e) => {
                                        const fallback = getOriginalImageUrl(raw);
                                        if (e.currentTarget.src !== fallback && fallback) {
                                          e.currentTarget.src = fallback;
                                        } else {
                                          e.currentTarget.src = fallbackProductImage;
                                        }
                                      }}
                                    />
                                  );
                                })()}
                                <div className="draft-cart-group-meta">
                                  <h4 className="draft-cart-group-title">{group.product?.title || 'Product'}</h4>
                                  <div className="draft-cart-group-sub">
                                    <span className="draft-cart-code">Code: {group.variant?.code || group.product?.code || '—'}</span>
                                    <span className="account-meta-dot">•</span>
                                    <span>{group.items.length} {group.items.length === 1 ? 'Color' : 'Colors'} ({group.totalQuantity} pcs)</span>
                                  </div>
                                </div>
                              </div>

                              {!isUnder999 && hybridInfo && hybridInfo.setSize > 1 && (
                                <div className="draft-cart-tier-badge">
                                  {hybridInfo.completeSets > 0 && hybridInfo.extraPieces === 0 ? (
                                    <span className="tier-pill tier-pill-wholesale">
                                      {hybridInfo.completeSets} Full Set{hybridInfo.completeSets > 1 ? 's' : ''} ({group.totalQuantity} pcs) · Wholesale Rate
                                    </span>
                                  ) : (
                                    <span className="tier-pill tier-pill-reseller">
                                      {group.totalQuantity} pcs · Single Piece Rate
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Color Variants Rows */}
                            <div className="draft-cart-variants-list">
                              {group.items.map((item) => {
                                const unitPrice =
                                  hybridInfo && group.totalQuantity >= hybridInfo.setSize
                                    ? hybridInfo.wholesalePrice
                                    : hybridInfo?.resellerPrice || customerPrice(item.variant?.prices, priceAccess) || 0;

                                return (
                                  <div className="draft-cart-variant-row" key={item.variantCode || `${item.productId}-${item.selectedColorName}`}>
                                    <div className="draft-cart-variant-left">
                                      {item.selectedColorImage && (
                                        <img 
                                          src={item.selectedColorImage} 
                                          alt={item.selectedColorName || 'Color'}
                                          className="draft-cart-variant-swatch"
                                          onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                      )}
                                      <div className="draft-cart-variant-label-group">
                                        <span className="draft-cart-variant-name">
                                          {item.selectedColorName || item.variant?.code || 'Selected Color'}
                                        </span>
                                        {priceAccess.canViewPrices && (
                                          <span className="draft-cart-unit-rate">
                                            {formatMoney(unitPrice)} / pc
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="draft-cart-variant-right">
                                      <div className="draft-qty-picker">
                                        <button type="button" onClick={() => updateQuantity(item, item.quantity - 1)} aria-label="Decrease">−</button>
                                        <output>{item.quantity}</output>
                                        <button type="button" onClick={() => updateQuantity(item, item.quantity + 1)} aria-label="Increase">+</button>
                                      </div>

                                      <div className="draft-cart-variant-price">
                                        {priceAccess.canViewPrices ? (
                                          formatMoney(unitPrice * item.quantity)
                                        ) : (
                                          <span style={{ fontSize: '12px', color: '#6b7280' }}>Verified Only</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="draft-cart-footer">
                      <div className="draft-cart-total-summary">
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>Draft Subtotal:</span>
                        <strong style={{ fontSize: '20px', color: 'var(--ink)' }}>
                          {total != null ? formatMoney(total) : priceNoticeForAccess(priceAccess)}
                        </strong>
                      </div>
                      <div className="draft-cart-actions">
                        <button type="button" className="secondary-button" onClick={() => navigate('catalogue')}>
                          Add More Products
                        </button>
                        <button type="button" className="primary-button" onClick={() => navigate('checkout')}>
                          Proceed to Checkout →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* EMPTY STATE IF CART IS EMPTY */}
                {(!cartItems || cartItems.length === 0) && (
                  <div className="account-empty-state">
                    <ShoppingBag size={36} strokeWidth={1.5} />
                    <h3 className="account-empty-title">No pending cart items</h3>
                    <p className="account-empty-desc">Explore the wholesale catalogue to select sarees and add them to your draft order.</p>
                    <button type="button" className="primary-button" onClick={() => navigate('catalogue')}>
                      Browse Wholesale Catalogue
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="placed-orders-container">
                {ordersLoading ? (
                  <p style={{ textAlign: 'center', padding: '36px', color: '#6b7280' }}>Loading orders...</p>
                ) : (
                  (() => {
                    const currentList = orderSubTab === 'enquiry'
                      ? enquiriesList
                      : historyFilter === 'dropship'
                        ? dropshipOrdersList
                        : historyFilter === 'direct'
                          ? directOrdersList
                          : allPaidOrdersList;

                    return (
                      <>
                        {orderSubTab === 'history' && allPaidOrdersList.length > 0 && (
                          <div className="account-orders-filter-bar">
                            <div className="account-segmented-pills">
                              <button
                                type="button"
                                className={`segmented-pill ${historyFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setHistoryFilter('all')}
                              >
                                All Orders ({allPaidOrdersList.length})
                              </button>
                              <button
                                type="button"
                                className={`segmented-pill ${historyFilter === 'dropship' ? 'active' : ''}`}
                                onClick={() => setHistoryFilter('dropship')}
                              >
                                Dropship ({dropshipOrdersList.length})
                              </button>
                              <button
                                type="button"
                                className={`segmented-pill ${historyFilter === 'direct' ? 'active' : ''}`}
                                onClick={() => setHistoryFilter('direct')}
                              >
                                Direct Orders ({directOrdersList.length})
                              </button>
                            </div>

                            <div className="account-orders-view-toggle">
                              <button
                                type="button"
                                className={`view-toggle-pill ${orderViewMode === 'ledger' ? 'active' : ''}`}
                                onClick={() => setOrderViewMode('ledger')}
                                title="Modern B2B Order Ledger"
                              >
                                <List size={13} />
                                <span>Ledger</span>
                              </button>
                              <button
                                type="button"
                                className={`view-toggle-pill ${orderViewMode === 'cards' ? 'active' : ''}`}
                                onClick={() => setOrderViewMode('cards')}
                                title="2-Column Balanced Card Grid"
                              >
                                <LayoutGrid size={13} />
                                <span>Cards</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {currentList.length === 0 ? (
                          <div className="account-empty-state">
                            <ClipboardList size={36} strokeWidth={1.5} />
                            <h3 className="account-empty-title">
                              {orderSubTab === 'enquiry'
                                ? 'No inquiries yet'
                                : historyFilter === 'dropship'
                                  ? 'No dropshipping orders found'
                                  : historyFilter === 'direct'
                                    ? 'No direct orders found'
                                    : 'No orders yet'}
                            </h3>
                            <p className="account-empty-desc">
                              {orderSubTab === 'enquiry'
                                ? 'Once you submit a wholesale or custom sourcing inquiry, your live updates will appear here.'
                                : historyFilter === 'dropship'
                                  ? 'You have not placed any dropship orders matching this filter.'
                                  : historyFilter === 'direct'
                                    ? 'You have not placed any direct wholesale orders matching this filter.'
                                    : 'Your placed direct wholesale orders and live tracking updates will appear here.'}
                            </p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '14px' }}>
                              {orderSubTab === 'history' && historyFilter !== 'all' && (
                                <button type="button" className="secondary-button" onClick={() => setHistoryFilter('all')}>
                                  View All Orders ({allPaidOrdersList.length}) →
                                </button>
                              )}
                              <button type="button" className="primary-button" onClick={() => navigate('catalogue')}>
                                Browse Wholesale Catalogue
                              </button>
                            </div>
                          </div>
                        ) : orderViewMode === 'ledger' ? (
                          /* ─────────────────────────────────────────────────────────────
                             APPROACH 1: B2B ORDER LEDGER TABLE
                             Distributes information across 6 structured columns,
                             perfectly balancing wide displays without empty voids.
                             ───────────────────────────────────────────────────────────── */
                          <div className="account-orders-ledger">
                            <div className="orders-ledger-header">
                              <div className="ledger-th col-order">Order Reference</div>
                              <div className="ledger-th col-product">Products</div>
                              <div className="ledger-th col-routing">Fulfillment & Delivery</div>
                              <div className="ledger-th col-total">Total</div>
                              <div className="ledger-th col-status">Status</div>
                              <div className="ledger-th col-actions">Actions</div>
                            </div>

                            <div className="orders-ledger-body">
                              {currentList.map((order) => {
                                const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                });
                                const statusStyle = getStatusBadgeStyle(order.status);
                                const deliveryAddr = Array.isArray(order.order_delivery_addresses) ? order.order_delivery_addresses[0] : order.order_delivery_addresses;
                                const dropshipSender = Array.isArray(order.order_dropship_senders) ? order.order_dropship_senders[0] : order.order_dropship_senders;
                                const orderItemsList = (Array.isArray(order.order_items) && order.order_items.length > 0)
                                  ? order.order_items
                                  : (Array.isArray(order.items) ? order.items : []);

                                const orderTotal = (order.total_amount !== undefined && order.total_amount !== null && Number(order.total_amount) > 0)
                                  ? Number(order.total_amount)
                                  : (orderItemsList.length > 0
                                    ? orderItemsList.reduce((sum, it) => sum + (Number(it.unit_price ?? it.price) || 0) * (Number(it.quantity) || 1), 0)
                                    : 0);
                                const isDropshipOrder = isOrderDropship(order);
                                const displayRef = order.order_number || order.id;
                                const senderName = dropshipSender?.sender_name || order.dropship_sender_name || order.sender_name || order.business_name || 'Reseller';
                                const senderPhone = dropshipSender?.sender_phone || order.dropship_sender_phone || order.sender_phone || '';
                                const recipientName = deliveryAddr?.recipient_name || order.dropship_recipient_name || order.recipient_name || order.buyer_name || 'Customer';
                                const recipientPhone = deliveryAddr?.phone || order.dropship_recipient_phone || order.recipient_phone || '';
                                const recipientCity = deliveryAddr?.city || order.dropship_recipient_city || order.recipient_city || '';
                                const recipientPincode = deliveryAddr?.pincode || order.dropship_recipient_pincode || order.recipient_pincode || '';
                                const recipientAddress = deliveryAddr?.address_line1 || deliveryAddr?.address || order.dropship_recipient_address || '';

                                const primaryItem = orderItemsList[0] || {};
                                const primaryThumb = resolveOrderItemImage(primaryItem);
                                const isExpanded = expandedOrderId === order.id;

                                return (
                                  <div key={order.id} className={`orders-ledger-item-wrap ${isExpanded ? 'is-expanded' : ''}`}>
                                    <div className={`orders-ledger-row ${isDropshipOrder ? 'is-dropship' : ''}`}>
                                      {/* COL 1: ORDER REF */}
                                      <div className="ledger-td col-order">
                                        <span className="order-ref-code" title={displayRef}>
                                          #{displayRef}
                                        </span>
                                        <span className="order-date-text">{orderDate}</span>
                                        {isDropshipOrder ? (
                                          <span className="order-badge-dropship">Dropship</span>
                                        ) : (
                                          <span className="order-badge-direct">Direct Wholesale</span>
                                        )}
                                      </div>

                                      {/* COL 2: PRODUCTS */}
                                      <div className="ledger-td col-product">
                                        <div className="ledger-product-cell">
                                          <img
                                            src={getOptimizedImageUrl(primaryThumb, 'thumbnail')}
                                            alt={primaryItem?.product_title || primaryItem?.title || 'Saree'}
                                            className="order-item-thumb"
                                            loading="lazy"
                                            onError={(e) => {
                                              const fallback = getOriginalImageUrl(primaryThumb);
                                              if (e.currentTarget.src !== fallback && fallback) {
                                                e.currentTarget.src = fallback;
                                              } else {
                                                e.currentTarget.src = fallbackProductImage;
                                              }
                                            }}
                                          />
                                          <div className="order-item-details">
                                            <span className="order-item-title" title={primaryItem?.product_title || primaryItem?.title || 'Banarasi Saree'}>
                                              {primaryItem?.product_title || primaryItem?.title || 'Banarasi Saree'}
                                            </span>
                                            <div className="order-item-meta-pills">
                                              {primaryItem?.color && <span className="order-item-pill">{primaryItem.color}</span>}
                                              <span className="order-item-pill">Qty {primaryItem?.quantity || 1}</span>
                                              {(primaryItem?.sku || primaryItem?.variant_code) && (
                                                <span className="order-item-sku">#{primaryItem.sku || primaryItem.variant_code}</span>
                                              )}
                                              {orderItemsList.length > 1 && (
                                                <button
                                                  type="button"
                                                  className="order-more-items-pill"
                                                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                                >
                                                  +{orderItemsList.length - 1} more
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* COL 3: ROUTING & DELIVERY */}
                                      <div className="ledger-td col-routing">
                                        <div className="ledger-routing-block">
                                          <div className="routing-line">
                                            <span className="routing-role-label">To:</span>
                                            <span className="routing-name">{recipientName}</span>
                                            <span className="routing-sub">
                                              {[recipientCity, recipientPincode].filter(Boolean).join(' - ')}
                                            </span>
                                          </div>
                                          {isDropshipOrder && (
                                            <div className="routing-line sender-line">
                                              <span className="routing-role-label">From:</span>
                                              <span className="routing-name">{senderName}</span>
                                              <span className="routing-sub">
                                                {[order.dropship_sender_city, order.dropship_sender_pincode].filter(Boolean).join(' - ')}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* COL 4: TOTAL */}
                                      <div className="ledger-td col-total">
                                        <span className="ledger-total-value">
                                          {orderTotal > 0 ? formatMoney(orderTotal) : 'Price on request'}
                                        </span>
                                        <span className="ledger-items-count">
                                          {orderItemsList.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0)} items
                                        </span>
                                      </div>

                                      {/* COL 5: STATUS */}
                                      <div className="ledger-td col-status">
                                        <span className="order-status-pill" style={statusStyle}>
                                          <span className="status-dot" />
                                          {order.status === 'payment_received' 
                                            ? 'Payment Received' 
                                            : (order.status === 'pending_payment' || order.status === 'payment_pending')
                                              ? 'Payment Pending'
                                              : (order.status?.replace(/_/g, ' ') || (order._sourceTable === 'inquiries' ? 'Inquiry Submitted' : 'Received'))}
                                        </span>
                                      </div>

                                      {/* COL 6: ACTIONS */}
                                      <div className="ledger-td col-actions">
                                        <div className="ledger-actions-group">
                                          {isDropshipOrder && (
                                            <button
                                              type="button"
                                              className="order-copy-link-btn"
                                              onClick={() => copyCustomerTrackingLink(displayRef)}
                                              title="Copy tracking link for your customer"
                                            >
                                              {copiedTrackingId === displayRef ? (
                                                <>
                                                  <Check size={13} style={{ color: '#059669' }} />
                                                  <span style={{ color: '#059669' }}>Copied</span>
                                                </>
                                              ) : (
                                                <>
                                                  <Share2 size={13} />
                                                  <span>Customer Link</span>
                                                </>
                                              )}
                                            </button>
                                          )}
                                          <button 
                                            type="button" 
                                            className="order-track-btn"
                                            onClick={() => navigate('order-tracking', displayRef)}
                                          >
                                            <span>Track Order</span>
                                            <ArrowUpRight size={13} />
                                          </button>
                                          <button
                                            type="button"
                                            className="order-expand-toggle-btn"
                                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                            title={isExpanded ? 'Collapse details' : 'Expand full details'}
                                          >
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* EXPANDED ACCORDION DRAWER */}
                                    {isExpanded && (
                                      <div className="orders-ledger-expand-panel">
                                        <div className="expand-panel-grid">
                                          <div className="expand-panel-col">
                                            <h4 className="expand-col-heading">Delivery Address</h4>
                                            <p className="expand-addr-text">
                                              <strong>{recipientName}</strong><br />
                                              {recipientAddress && <>{recipientAddress}<br /></>}
                                              {[recipientCity, recipientPincode].filter(Boolean).join(' - ')}<br />
                                              {recipientPhone && <>Phone: {recipientPhone}</>}
                                            </p>
                                          </div>
                                          {isDropshipOrder && (
                                            <div className="expand-panel-col">
                                              <h4 className="expand-col-heading">Sender (Ship From)</h4>
                                              <p className="expand-addr-text">
                                                <strong>{senderName}</strong><br />
                                                {order.dropship_sender_address && <>{order.dropship_sender_address}<br /></>}
                                                {[order.dropship_sender_city, order.dropship_sender_pincode].filter(Boolean).join(' - ')}<br />
                                                {senderPhone && <>Phone: {senderPhone}</>}
                                              </p>
                                            </div>
                                          )}
                                          <div className="expand-panel-col">
                                            <h4 className="expand-col-heading">All Order Items ({orderItemsList.length})</h4>
                                            <div className="expand-items-list">
                                              {orderItemsList.map((it, iIdx) => {
                                                const itThumb = resolveOrderItemImage(it);
                                                return (
                                                  <div key={iIdx} className="expand-item-row">
                                                    <img
                                                      src={getOptimizedImageUrl(itThumb, 'thumbnail')}
                                                      alt={it.product_title || it.title || 'Saree'}
                                                      className="expand-item-thumb"
                                                      loading="lazy"
                                                    />
                                                    <div className="expand-item-info">
                                                      <span className="expand-item-title">{it.product_title || it.title || 'Banarasi Saree'}</span>
                                                      <span className="expand-item-meta">
                                                        {it.color ? `${it.color} · ` : ''}Qty {it.quantity || 1}
                                                        {(it.unit_price || it.price) ? ` · ${formatMoney(it.unit_price || it.price)}` : ''}
                                                      </span>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          /* ─────────────────────────────────────────────────────────────
                             APPROACH 2: 2-COLUMN BALANCED CARD GRID
                             Cards sit in a clean 2-column grid (~770px wide each)
                             rather than spanning across the full 1600px width.
                             ───────────────────────────────────────────────────────────── */
                          <div className="account-orders-grid">
                            {currentList.map((order) => {
                              const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              });
                              const statusStyle = getStatusBadgeStyle(order.status);
                              const deliveryAddr = Array.isArray(order.order_delivery_addresses) ? order.order_delivery_addresses[0] : order.order_delivery_addresses;
                              const dropshipSender = Array.isArray(order.order_dropship_senders) ? order.order_dropship_senders[0] : order.order_dropship_senders;
                              const orderItemsList = (Array.isArray(order.order_items) && order.order_items.length > 0)
                                ? order.order_items
                                : (Array.isArray(order.items) ? order.items : []);

                              const orderTotal = (order.total_amount !== undefined && order.total_amount !== null && Number(order.total_amount) > 0)
                                ? Number(order.total_amount)
                                : (orderItemsList.length > 0
                                  ? orderItemsList.reduce((sum, it) => sum + (Number(it.unit_price ?? it.price) || 0) * (Number(it.quantity) || 1), 0)
                                  : 0);
                              const isDropshipOrder = isOrderDropship(order);
                              const displayRef = order.order_number || order.id;
                              const senderName = dropshipSender?.sender_name || order.dropship_sender_name || order.sender_name || order.business_name || 'Reseller';
                              const senderPhone = dropshipSender?.sender_phone || order.dropship_sender_phone || order.sender_phone || '';
                              const recipientName = deliveryAddr?.recipient_name || order.dropship_recipient_name || order.recipient_name || order.buyer_name || 'Customer';
                              const recipientPhone = deliveryAddr?.phone || order.dropship_recipient_phone || order.recipient_phone || '';
                              const recipientCity = deliveryAddr?.city || order.dropship_recipient_city || order.recipient_city || '';
                              const recipientPincode = deliveryAddr?.pincode || order.dropship_recipient_pincode || order.recipient_pincode || '';

                              return (
                                <div 
                                  key={order.id} 
                                  className={`account-minimal-order-card ${isDropshipOrder ? 'is-dropship' : ''}`}
                                >
                                  {/* TOP BAR */}
                                  <div className="order-card-top-bar">
                                    <div className="order-ref-group">
                                      <span className="order-ref-code" title={displayRef}>
                                        #{displayRef}
                                      </span>
                                      <span className="order-ref-dot">·</span>
                                      <span className="order-date-text">{orderDate}</span>
                                      {isDropshipOrder ? (
                                        <span className="order-badge-dropship">
                                          Dropship
                                        </span>
                                      ) : (
                                        <span className="order-badge-direct">
                                          Direct
                                        </span>
                                      )}
                                    </div>
                                    <span 
                                      className="order-status-pill"
                                      style={statusStyle}
                                    >
                                      <span className="status-dot" />
                                      {order.status === 'payment_received' 
                                        ? 'Payment Received' 
                                        : (order.status === 'pending_payment' || order.status === 'payment_pending')
                                          ? 'Payment Pending'
                                          : (order.status?.replace(/_/g, ' ') || (order._sourceTable === 'inquiries' ? 'Inquiry Submitted' : 'Received'))}
                                    </span>
                                  </div>

                                  {/* DROPSHIP SENDER & RECIPIENT */}
                                  {isDropshipOrder && (
                                    <div className="order-dropship-spec-box">
                                      <div className="dropship-spec-col">
                                        <span className="dropship-spec-label">Deliver To</span>
                                        <span className="dropship-spec-name">{recipientName}</span>
                                        <span className="dropship-spec-meta">
                                          {[recipientCity, recipientPincode].filter(Boolean).join(' - ')}
                                          {recipientPhone ? ` · ${recipientPhone}` : ''}
                                        </span>
                                      </div>

                                      <div className="dropship-spec-col">
                                        <span className="dropship-spec-label">Sender (Ship From)</span>
                                        <span className="dropship-spec-name">{senderName}</span>
                                        {order.dropship_sender_address && (
                                          <span className="dropship-spec-meta">{order.dropship_sender_address}</span>
                                        )}
                                        <span className="dropship-spec-meta">
                                          {[order.dropship_sender_city, order.dropship_sender_pincode].filter(Boolean).join(' - ')}
                                          {senderPhone ? ` · Ph: ${senderPhone}` : ''}
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* ITEMS LIST */}
                                  <div className="order-items-list">
                                    {orderItemsList.map((item, idx) => {
                                      const itemThumb = resolveOrderItemImage(item);
                                      return (
                                        <div key={idx} className="order-item-row">
                                          <img
                                            src={getOptimizedImageUrl(itemThumb, 'thumbnail')}
                                            alt={item.product_title || item.title || 'Saree'}
                                            className="order-item-thumb"
                                            loading="lazy"
                                            onError={(e) => {
                                              const fallback = getOriginalImageUrl(itemThumb);
                                              if (e.currentTarget.src !== fallback && fallback) {
                                                e.currentTarget.src = fallback;
                                              } else {
                                                e.currentTarget.src = fallbackProductImage;
                                              }
                                            }}
                                          />
                                          <div className="order-item-details">
                                            <span className="order-item-title">
                                              {item.product_title || item.title || 'Banarasi Saree'}
                                            </span>
                                            <div className="order-item-meta-pills">
                                              {item.color && (
                                                <span className="order-item-pill">{item.color}</span>
                                              )}
                                              <span className="order-item-pill">Qty {item.quantity || 1}</span>
                                              {(item.sku || item.variant_code) && (
                                                <span className="order-item-sku">#{item.sku || item.variant_code}</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* BOTTOM BAR */}
                                  <div className="order-card-bottom-bar">
                                    <div className="order-total-block">
                                      <span className="order-total-label">Total</span>
                                      <span className="order-total-value">
                                        {orderTotal > 0 ? formatMoney(orderTotal) : 'Price on request'}
                                      </span>
                                    </div>

                                    <div className="order-card-actions">
                                      {isDropshipOrder && (
                                        <button
                                          type="button"
                                          className="order-copy-link-btn"
                                          onClick={() => copyCustomerTrackingLink(displayRef)}
                                          title="Copy tracking link for your customer"
                                        >
                                          {copiedTrackingId === displayRef ? (
                                            <>
                                              <Check size={13} style={{ color: '#059669' }} />
                                              <span style={{ color: '#059669' }}>Copied</span>
                                            </>
                                          ) : (
                                            <>
                                              <Share2 size={13} />
                                              <span>Customer Link</span>
                                            </>
                                          )}
                                        </button>
                                      )}
                                      <button 
                                        type="button" 
                                        className="order-track-btn"
                                        onClick={() => navigate('order-tracking', displayRef)}
                                      >
                                        <span>Track Order</span>
                                        <ArrowUpRight size={13} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()
                )}
              </div>
            )}
          </div>
        )}

        {/* ADDRESSES TAB */}
        {activeTab === 'addresses' && (
          <div className="account-panel-minimal panel-transparent">
            <div className="account-section-header">
              <span className="account-section-title">
                <MapPin size={18} />
                <span>Delivery Addresses</span>
              </span>
              {!showAddEditForm && (
                <button 
                  type="button" 
                  className="account-action-outline-btn"
                  onClick={() => {
                    setEditingAddress(null);
                    setFormName('');
                    setFormPhone('');
                    setFormAddr1('');
                    setFormAddr2('');
                    setFormCity('');
                    setFormState('');
                    setFormPincode('');
                    setFormCountry('India');
                    setIsDefault(false);
                    setShowAddEditForm(true);
                  }}
                >
                  <Plus size={14} />
                  <span>Add Address</span>
                </button>
              )}
            </div>

            {showAddEditForm ? (
              <form onSubmit={handleSaveAddress} className="account-address-form-minimal">
                <h3 className="address-form-title">{editingAddress ? 'Edit Delivery Address' : 'Add New Delivery Address'}</h3>
                <div className="address-form-grid">
                  <label className="field-label">
                    Full Name *
                    <input 
                      type="text" 
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required 
                    />
                  </label>
                  <label className="field-label">
                    Phone Number *
                    <input 
                      type="tel" 
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      required 
                    />
                  </label>
                  <label className="field-label full-width">
                    Address Line 1 *
                    <input 
                      type="text" 
                      value={formAddr1}
                      onChange={(e) => setFormAddr1(e.target.value)}
                      required 
                    />
                  </label>
                  <label className="field-label full-width">
                    Address Line 2 (Optional)
                    <input 
                      type="text" 
                      value={formAddr2}
                      onChange={(e) => setFormAddr2(e.target.value)}
                    />
                  </label>
                  <label className="field-label">
                    City *
                    <input 
                      type="text" 
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      required 
                    />
                  </label>
                  <label className="field-label">
                    State *
                    <input 
                      type="text" 
                      value={formState}
                      onChange={(e) => setFormState(e.target.value)}
                      required 
                    />
                  </label>
                  <label className="field-label">
                    Postal / Pincode *
                    <input 
                      type="text" 
                      value={formPincode}
                      onChange={(e) => setFormPincode(normalizePincodeInput(e.target.value))}
                      placeholder="Postal / Pincode"
                      maxLength={12}
                      required 
                    />
                  </label>
                  <label className="field-label">
                    Country *
                    <input 
                      type="text" 
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      required 
                    />
                  </label>
                </div>

                <label className="address-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    disabled={editingAddress?.is_default}
                  />
                  <span>Set as default delivery address</span>
                </label>

                <div className="form-actions-row">
                  <button type="submit" className="primary-button">
                    Save Address
                  </button>
                  <button 
                    type="button" 
                    className="secondary-button" 
                    onClick={() => setShowAddEditForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                {addressLoading && <p style={{ textAlign: 'center', padding: '36px', color: '#6b7280' }}>Loading saved addresses...</p>}
                {!addressLoading && addresses.length === 0 && (
                  <div className="account-empty-state">
                    <MapPin size={36} strokeWidth={1.5} />
                    <h3 className="account-empty-title">No saved addresses</h3>
                    <p className="account-empty-desc">Add your dispatch and delivery addresses for quick one-click checkout.</p>
                    <button 
                      type="button" 
                      className="primary-button"
                      onClick={() => {
                        setEditingAddress(null);
                        setFormName('');
                        setFormPhone('');
                        setFormAddr1('');
                        setFormAddr2('');
                        setFormCity('');
                        setFormState('');
                        setFormPincode('');
                        setFormCountry('India');
                        setIsDefault(false);
                        setShowAddEditForm(true);
                      }}
                    >
                      Add Address
                    </button>
                  </div>
                )}
                {!addressLoading && (
                  <div className="account-addresses-grid-minimal">
                    {addresses.map((addr) => (
                      <div 
                        key={addr.id} 
                        className={`account-address-card-minimal ${addr.is_default ? 'is-default' : ''}`}
                      >
                        <div className="address-card-content">
                          <div className="address-card-top">
                            <h4 className="address-name">{addr.full_name}</h4>
                            {addr.is_default && (
                              <span className="address-default-badge">
                                <Check size={11} strokeWidth={2.5} />
                                <span>Default</span>
                              </span>
                            )}
                          </div>
                          
                          <div className="address-phone-pill">
                            <Phone size={12} strokeWidth={2} />
                            <span>{addr.phone_number}</span>
                          </div>

                          <div className="address-lines">
                            <p className="address-street">{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</p>
                            <p className="address-location">{addr.city}, {addr.state} — <strong>{addr.pincode}</strong></p>
                            <p className="address-country">{addr.country || 'India'}</p>
                          </div>
                        </div>

                        <div className="address-card-actions-minimal">
                          <div className="address-actions-left">
                            <button 
                              type="button" 
                              className="address-action-chip"
                              onClick={() => handleStartEdit(addr)}
                            >
                              <Edit3 size={13} />
                              <span>Edit</span>
                            </button>
                            <button 
                              type="button" 
                              className="address-action-chip danger"
                              onClick={() => handleDeleteAddress(addr.id)}
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </div>
                          {!addr.is_default && (
                            <button 
                              type="button" 
                              className="address-action-link default-action"
                              onClick={() => handleSetDefault(addr.id)}
                            >
                              Set Default
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* BUILD YOUR OWN WEBSITE */}
        {activeTab === 'reseller' && (
          <div className="account-panel-minimal panel-transparent">
            <div className="account-section-header">
              <span className="account-section-title">
                <Globe size={18} />
                <span>Build Your Own Website</span>
              </span>
              {priceAccess.resellerDashboardEnabled && (
                <button 
                  type="button" 
                  onClick={() => navigate('reseller-dashboard')}
                  className="account-action-outline-btn"
                >
                  <span>Fullscreen Dashboard</span>
                  <ArrowUpRight size={14} />
                </button>
              )}
            </div>
            {priceAccess.resellerDashboardEnabled ? (
              <ResellerTools user={user} buyerProfile={buyerProfile} navigate={navigate} />
            ) : (
              <ResellerUpgradeCard user={user} buyerProfile={buyerProfile} />
            )}
          </div>
        )}

        {/* AFFILIATES TAB */}
        {!isVendor && activeTab === 'influencer' && (
          <div className="account-panel-minimal panel-transparent">
            <div className="account-section-header">
              <span className="account-section-title">
                <UserRound size={18} />
                <span>Weave 365 Affiliate Partner Program</span>
              </span>
            </div>

            {influencerLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto 10px' }} />
                <p>Loading partner dashboard...</p>
              </div>
            ) : !influencerProfile ? (
              /* Application Form */
              <div style={{ maxWidth: '480px', margin: '1rem auto' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px', textAlign: 'center' }}>
                  Join the Affiliate Partner Program
                </h2>
                <p style={{ fontSize: '13.5px', color: '#6b7280', marginBottom: '20px', lineHeight: '1.5', textAlign: 'center' }}>
                  Share curated Banarasi collections with boutique buyers and earn a 10% commission on completed orders.
                </p>

                <form onSubmit={handleApplyInfluencer} style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ background: '#fdfaf5', border: '1px solid #fef3c7', borderRadius: '8px', padding: '12px 14px', fontSize: '12px', color: '#92400e', display: 'flex', gap: '8px', alignItems: 'flex-start', lineHeight: '1.4' }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }} />
                    <div>
                      <strong>Payout terms:</strong> Commissions are tracked at checkout and credited to your balance after the buyer return/exchange window concludes.
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                      Desired Referral Code *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BOUTIQUE10"
                      value={infFormCode}
                      onChange={e => setInfFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      required
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '13.5px', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                      Payout Method *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setInfFormPayoutMethod('upi')}
                        style={{
                          padding: '10px',
                          borderRadius: '6px',
                          border: infFormPayoutMethod === 'upi' ? '2px solid var(--gold-dark)' : '1px solid var(--line)',
                          background: infFormPayoutMethod === 'upi' ? 'rgba(183,134,70,0.06)' : '#ffffff',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '13px',
                          color: infFormPayoutMethod === 'upi' ? 'var(--gold-dark)' : 'var(--ink)'
                        }}
                      >
                        UPI ID
                      </button>

                      <button
                        type="button"
                        onClick={() => setInfFormPayoutMethod('bank')}
                        style={{
                          padding: '10px',
                          borderRadius: '6px',
                          border: infFormPayoutMethod === 'bank' ? '2px solid var(--gold-dark)' : '1px solid var(--line)',
                          background: infFormPayoutMethod === 'bank' ? 'rgba(183,134,70,0.06)' : '#ffffff',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '13px',
                          color: infFormPayoutMethod === 'bank' ? 'var(--gold-dark)' : 'var(--ink)'
                        }}
                      >
                        Bank Transfer
                      </button>
                    </div>
                  </div>

                  {infFormPayoutMethod === 'upi' ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                        UPI ID *
                      </label>
                      <input
                        type="text"
                        placeholder="yourname@bank"
                        value={infFormUpiId}
                        onChange={e => setInfFormUpiId(e.target.value)}
                        required
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder="Bank Name (e.g. HDFC Bank)"
                        value={infFormBankName}
                        onChange={e => setInfFormBankName(e.target.value)}
                        required
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                      />
                      <input
                        type="text"
                        placeholder="Bank Account Number"
                        value={infFormAccountNo}
                        onChange={e => setInfFormAccountNo(e.target.value)}
                        required
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                      />
                      <input
                        type="text"
                        placeholder="11-digit IFSC Code"
                        value={infFormIfsc}
                        onChange={e => setInfFormIfsc(e.target.value.toUpperCase())}
                        required
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                      />
                    </div>
                  )}

                  {infFormError && (
                    <p style={{ color: '#dc2626', fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>{infFormError}</p>
                  )}

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={infFormSubmitting}
                    style={{ width: '100%', padding: '10px', marginTop: '4px' }}
                  >
                    {infFormSubmitting ? 'Submitting…' : 'Submit Application'}
                  </button>
                </form>
              </div>
            ) : !influencerProfile.is_approved ? (
              <div style={{ maxWidth: '500px', margin: '1rem auto', padding: '24px', border: '1px solid #fed7aa', borderRadius: '10px', background: '#fffdf7', textAlign: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#9a3412', marginBottom: '6px' }}>Application Under Review</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                  Your referral code <strong>{influencerProfile.referral_code}</strong> is being validated by our partner team. You will be notified once activated.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                <div className="affiliate-stats-row">
                  <div className="affiliate-stat-box">
                    <span className="affiliate-stat-label">Total Visitors</span>
                    <div className="affiliate-stat-value">{influencerStats.clicks}</div>
                    <span className="affiliate-stat-hint">Unique Clicks</span>
                  </div>
                  <div className="affiliate-stat-box">
                    <span className="affiliate-stat-label">Conversions</span>
                    <div className="affiliate-stat-value">{influencerStats.referrals.filter(r => r.status !== 'cancelled').length}</div>
                    <span className="affiliate-stat-hint">Completed Orders</span>
                  </div>
                  <div className="affiliate-stat-box">
                    <span className="affiliate-stat-label">Commission</span>
                    <div className="affiliate-stat-value">
                      {formatMoney(
                        influencerStats.referrals
                          .filter(r => r.status !== 'cancelled')
                          .reduce((sum, r) => sum + (Number(r.commission_amount) || 0), 0)
                      )}
                    </div>
                    <span className="affiliate-stat-hint">Rate: {influencerProfile.commission_percentage}%</span>
                  </div>
                  <div className="affiliate-stat-box">
                    <span className="affiliate-stat-label">Settled Payouts</span>
                    <div className="affiliate-stat-value" style={{ color: '#2e7d32' }}>
                      {formatMoney(
                        influencerStats.referrals
                          .filter(r => r.status === 'paid')
                          .reduce((sum, r) => sum + (Number(r.commission_amount) || 0), 0)
                      )}
                    </div>
                    <span className="affiliate-stat-hint">
                      Pending: {formatMoney(
                        influencerStats.referrals
                          .filter(r => r.status === 'pending')
                          .reduce((sum, r) => sum + (Number(r.commission_amount) || 0), 0)
                      )}
                    </span>
                  </div>
                </div>

                <div className="affiliate-share-box-minimal">
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)' }}>Your Unique Partner Link</span>
                  <div className="affiliate-share-input-row">
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== 'undefined' ? `${window.location.origin}/?ref=${influencerProfile.referral_code}` : ''}
                      className="affiliate-share-input"
                      onClick={e => e.target.select()}
                    />
                    <button
                      type="button"
                      className="primary-button"
                      style={{ padding: '0 16px', whiteSpace: 'nowrap', fontSize: '12.5px' }}
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          navigator.clipboard.writeText(`${window.location.origin}/?ref=${influencerProfile.referral_code}`);
                          alert('Partner link copied to clipboard!');
                        }
                      }}
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '10px' }}>
                    Referred Conversion History
                  </span>
                  {influencerStats.referrals.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '24px', border: '1px dashed var(--line)', borderRadius: '8px', color: '#6b7280', fontSize: '13px' }}>
                      No referred orders yet. Share your partner link to start earning commissions.
                    </p>
                  ) : (
                    <div style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: '8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--line)' }}>
                            <th style={{ padding: '8px 12px' }}>Date</th>
                            <th style={{ padding: '8px 12px' }}>Reference</th>
                            <th style={{ padding: '8px 12px' }}>Buyer</th>
                            <th style={{ padding: '8px 12px' }}>Order Total</th>
                            <th style={{ padding: '8px 12px' }}>Commission</th>
                            <th style={{ padding: '8px 12px' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {influencerStats.referrals.map(ref => (
                            <tr key={ref.id} style={{ borderBottom: '1px solid var(--line)' }}>
                              <td style={{ padding: '8px 12px' }}>{new Date(ref.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                              <td style={{ padding: '8px 12px' }}><code>{ref.order_id || ref.inquiry_id || 'N/A'}</code></td>
                              <td style={{ padding: '8px 12px' }}>{ref.buyer_name || 'Buyer'}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{formatMoney(ref.sale_amount)}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--gold-dark)' }}>{formatMoney(ref.commission_amount)}</td>
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: ref.status === 'paid' ? '#eafaf1' : '#fff8e1', color: ref.status === 'paid' ? '#2e7d32' : '#b78646' }}>
                                  {ref.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STOCK TAB */}
        {activeTab === 'vendor-stock' && (
          <div className="account-panel-minimal panel-transparent">
            <VendorStockPanel
              user={user}
              buyerProfile={buyerProfile}
              products={products}
            />
          </div>
        )}

        {/* VENDOR PRODUCT UPLOAD TAB */}
        {activeTab === 'vendor-upload' && (
          <div className="account-panel-minimal panel-transparent">
            <SellerProductUpload
              user={user}
              buyerProfile={buyerProfile}
              catalogProducts={products}
            />
          </div>
        )}

        {/* DEVELOPER API TAB */}
        {!isVendor && activeTab === 'developer' && (
          <div className="account-panel-minimal panel-transparent">
            {isCustomer ? (
              <div className="account-empty-state" style={{ padding: '56px 20px', maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(183, 134, 70, 0.08)',
                  border: '1px solid rgba(183, 134, 70, 0.22)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold-dark, #805d31)',
                  margin: '0 auto 12px'
                }}>
                  <Code2 size={22} strokeWidth={1.8} />
                </div>
                <h3 className="account-empty-title" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--ink, #1a1a1a)', margin: '0 0 8px' }}>
                  Developer API
                </h3>
                <p className="account-empty-desc" style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 20px', lineHeight: '1.6' }}>
                  Developer API keys, webhooks, and catalogue endpoints are available exclusively for Business & Reseller accounts.
                </p>
                <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="primary-button"
                    style={{ padding: '10px 24px', fontSize: '0.875rem', borderRadius: '8px', fontWeight: 600 }}
                    onClick={() => handleSelectTab('profile')}
                  >
                    Switch to Business Account
                  </button>
                  <a
                    href={businessWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.75rem',
                      color: 'var(--gold-dark, #805d31)',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                  >
                    <span>Request upgrade on WhatsApp</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ) : (
              <DeveloperDashboard user={user} buyerProfile={buyerProfile} setBuyerProfile={setBuyerProfile} navigate={navigate} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

