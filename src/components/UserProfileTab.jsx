import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, 
  AlertCircle, 
  Loader2, 
  Lock, 
  Save, 
  ChevronDown, 
  ArrowRight
} from './icons.jsx';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { normalizePincodeInput } from '../storefrontShared.jsx';
import { applyAutoApprovalToBuyerProfile, isAccountLocked, detectAccountCategory } from '../utils/buyerAccess.js';
export { detectAccountCategory };
import { saveCachedProfile, saveCachedUser } from '../utils/authCache.js';
import { storeConfig } from '../config.js';
import { WhatsappIcon } from './WhatsappIcon.jsx';
import {
  BUSINESS_TYPES,
  BUSINESS_EXPERIENCE_OPTIONS,
  BUSINESS_BUDGET_OPTIONS,
  BUSINESS_SALES_CHANNELS,
  BUSINESS_PURCHASE_INTENT_OPTIONS,
  SUPPLIER_EXPERIENCE_OPTIONS,
  SUPPLIER_PRICE_RANGES,
  SUPPLIER_BUSINESS_TYPES,
  SUPPLIER_PRODUCTS,
  SUPPLIER_WEAVING_TYPES,
  SUPPLIER_CATALOGUE_SOURCES,
} from './signup/signupConstants.js';

const countryCodes = [
  { value: '+91', label: 'India (+91)' },
  { value: '+1', label: 'USA / Canada (+1)' },
  { value: '+44', label: 'UK (+44)' },
  { value: '+971', label: 'UAE (+971)' },
  { value: '+65', label: 'Singapore (+65)' },
  { value: '+60', label: 'Malaysia (+60)' },
  { value: '+61', label: 'Australia (+61)' },
  { value: '+974', label: 'Qatar (+974)' },
  { value: '+966', label: 'Saudi Arabia (+966)' },
  { value: '+965', label: 'Kuwait (+965)' },
];

const categoryOptions = ['Saree', 'Suit', 'Lehenga', 'Dupatta', 'Under 999'];

function toTitleCase(str) {
  return String(str || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}


export function UserProfileTab({ user, buyerProfile, setBuyerProfile, setUser }) {
  const currentCategory = useMemo(() => detectAccountCategory(user, buyerProfile), [user, buyerProfile]);
  const selectedCategory = currentCategory;
  const isLocked = isAccountLocked(buyerProfile, user);

  const [formData, setFormData] = useState({
    // Contact
    fullName: '',
    countryCode: '+91',
    whatsappNumber: '',
    // Location
    city: '',
    state: '',
    pincode: '',
    country: 'India',

    // Customer
    interestedCategories: ['Saree'],

    // Business / Reseller
    businessName: '',
    businessType: 'boutique',
    website: '',
    socialHandle: '',
    businessExperience: '1_to_3_years',
    monthlyBudget: '50k_to_1lakh',
    salesChannels: ['physical_store'],
    purchaseIntent: 'within_7_days',
    buyingBehavior: 'instant',

    // Supplier
    contactPerson: '',
    supplierBusinessName: '',
    businessEmail: '',
    phone: '',
    hasGst: 'No',
    gstin: '',
    supplierBusinessType: 'Weaver',
    supplierExperience: '3 - 5 years',
    wholesalePriceRange: '₹2,000 - ₹2,999',
    instagram: '',
    ecommerceWebsite: '',
    suppliedProducts: ['Sarees'],
    weavingSpecialisation: ['Handloom'],
    manufacturingLocation: 'Varanasi',
    otherCityName: '',
    singlePieceSupply: 'Yes',
    repeatSupply: 'Yes',
    hasCatalogue: 'Yes',
    catalogueSource: 'We create our own catalogue',
  });

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // WhatsApp quick-action URLs
  const cleanStoreWa = String(storeConfig?.whatsapp || '9919101369').replace(/\D/g, '');
  const fullWaPhone = cleanStoreWa.length === 10 ? `91${cleanStoreWa}` : cleanStoreWa;
  const activeName = formData.fullName || buyerProfile?.full_name || user?.user_metadata?.full_name || '';
  const activeEmail = user?.email || buyerProfile?.email || '';
  const activePhone = formData.whatsappNumber || buyerProfile?.whatsapp || '';

  const businessWaMsg = `Hi Weave365, I would like to switch my account to a Business & Reseller account.\nName: ${activeName || 'N/A'}\nEmail: ${activeEmail || 'N/A'}\nPhone: ${activePhone || 'N/A'}`;
  const businessWaUrl = `https://wa.me/${fullWaPhone}?text=${encodeURIComponent(businessWaMsg)}`;

  const sellerWaMsg = `Hi Weave365, I would like to switch my account to a Seller account.\nName: ${activeName || 'N/A'}\nEmail: ${activeEmail || 'N/A'}\nPhone: ${activePhone || 'N/A'}`;
  const sellerWaUrl = `https://wa.me/${fullWaPhone}?text=${encodeURIComponent(sellerWaMsg)}`;
  const supplierWaUrl = sellerWaUrl;

  const supportWaMsg = `Hi Weave365, I have an inquiry regarding my account.\nName: ${activeName || 'N/A'}\nEmail: ${activeEmail || 'N/A'}\nPhone: ${activePhone || 'N/A'}`;
  const supportWaUrl = `https://wa.me/${fullWaPhone}?text=${encodeURIComponent(supportWaMsg)}`;

  useEffect(() => {
    const p = buyerProfile || user?.user_metadata?.buyer_profile || {};
    const q = p.qualification || user?.user_metadata?.qualification || user?.user_metadata?.buyer_profile?.qualification || {};

    const rawWhatsapp = p.whatsapp_number || p.whatsapp || q.phone || '';
    const cleanWhatsapp = String(rawWhatsapp).replace(/\D/g, '').slice(0, 15);

    let cleanCity = String(p.city || q.location_city || '').trim();
    let cleanState = String(p.state || '').trim();

    if (cleanCity.includes(',')) {
      const parts = cleanCity.split(',');
      cleanCity = parts[0]?.trim() || '';
      if (!cleanState && parts[1]) {
        cleanState = parts.slice(1).join(',').trim();
      }
    }

    let resolvedBusinessType = q.business_type || '';
    if (!resolvedBusinessType && p.buyer_subtype) {
      const lowerSub = String(p.buyer_subtype).toLowerCase().trim();
      const matched = BUSINESS_TYPES.find((b) => b.id === lowerSub || b.subtype.toLowerCase() === lowerSub);
      if (matched) resolvedBusinessType = matched.id;
    }
    if (!resolvedBusinessType) resolvedBusinessType = 'boutique';

    const resolvedSalesChannels = Array.isArray(q.sales_channels) && q.sales_channels.length > 0
      ? q.sales_channels
      : ['physical_store'];

    const resolvedSuppliedProducts = Array.isArray(q.supplied_products) && q.supplied_products.length > 0
      ? q.supplied_products
      : (Array.isArray(p.interested_categories) && p.interested_categories.length > 0 ? p.interested_categories : ['Sarees']);

    const resolvedWeaving = Array.isArray(q.weaving_specialisation) && q.weaving_specialisation.length > 0
      ? q.weaving_specialisation
      : ['Handloom'];

    setFormData({
      fullName: p.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || q.contact_person || '',
      countryCode: p.whatsapp_country_code || '+91',
      whatsappNumber: cleanWhatsapp,
      city: cleanCity,
      state: cleanState,
      pincode: p.pincode || '',
      country: p.country || 'India',

      // Customer
      interestedCategories: Array.isArray(p.interested_categories) && p.interested_categories.length > 0
        ? p.interested_categories
        : ['Saree'],

      // Business / Reseller
      businessName: p.business_name || q.business_name || '',
      businessType: resolvedBusinessType,
      website: p.website || q.ecommerce_website || '',
      socialHandle: p.social_handle || p.socialHandle || q.instagram || '',
      businessExperience: q.business_experience || '1_to_3_years',
      monthlyBudget: q.monthly_budget || '50k_to_1lakh',
      salesChannels: resolvedSalesChannels,
      purchaseIntent: q.purchase_intent || 'within_7_days',
      buyingBehavior: p.buying_behavior || 'instant',

      // Supplier
      contactPerson: q.contact_person || p.full_name || user?.user_metadata?.full_name || '',
      supplierBusinessName: q.business_name || p.business_name || '',
      businessEmail: q.business_email || user?.email || '',
      phone: q.phone || cleanWhatsapp,
      hasGst: q.has_gst || (q.gstin ? 'Yes' : 'No'),
      gstin: q.gstin || '',
      supplierBusinessType: q.business_type || 'Weaver',
      supplierExperience: q.business_experience || '3 - 5 years',
      wholesalePriceRange: q.wholesale_price_range || '₹2,000 - ₹2,999',
      instagram: q.instagram || p.social_handle || '',
      ecommerceWebsite: q.ecommerce_website || p.website || '',
      suppliedProducts: resolvedSuppliedProducts,
      weavingSpecialisation: resolvedWeaving,
      manufacturingLocation: q.manufacturing_location || 'Varanasi',
      otherCityName: q.other_city_name || '',
      singlePieceSupply: q.single_piece_supply || 'Yes',
      repeatSupply: q.repeat_supply || 'Yes',
      hasCatalogue: q.has_catalogue || 'Yes',
      catalogueSource: q.catalogue_source || 'We create our own catalogue',
    });
  }, [buyerProfile, user]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (statusMessage) setStatusMessage(null);
  };

  const handleCheckboxToggle = (field, item) => {
    setFormData((prev) => {
      const current = Array.isArray(prev[field]) ? [...prev[field]] : [];
      const exists = current.includes(item);
      let next;
      if (exists) {
        if (current.length === 1) return prev;
        next = current.filter((x) => x !== item);
      } else {
        next = [...current, item];
      }
      return { ...prev, [field]: next };
    });
    if (statusMessage) setStatusMessage(null);
  };

  const isComplete = Boolean(
    (formData.fullName.trim() || formData.contactPerson.trim()) &&
    (formData.whatsappNumber.length >= 6 || formData.phone.length >= 6) &&
    formData.city.trim() &&
    formData.state.trim() &&
    formData.pincode.trim().length >= 3
  );

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    setStatusMessage(null);

    const cleanFullName = toTitleCase(
      selectedCategory === 'supplier'
        ? (formData.contactPerson || formData.fullName)
        : formData.fullName
    );
    const cleanWhatsapp = String(
      selectedCategory === 'supplier'
        ? (formData.phone || formData.whatsappNumber)
        : formData.whatsappNumber
    ).replace(/\D/g, '').slice(0, 15);
    const cleanPincode = normalizePincodeInput(formData.pincode);

    if (!cleanFullName) {
      setStatusMessage({ type: 'error', text: 'Please enter your name.' });
      return;
    }
    if (cleanWhatsapp.length < 6 || cleanWhatsapp.length > 15) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid phone number.' });
      return;
    }

    if (selectedCategory === 'reseller' && !formData.businessName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your Business / Store Name.' });
      return;
    }

    if (selectedCategory === 'supplier') {
      if (!formData.supplierBusinessName.trim() && !formData.businessName.trim()) {
        setStatusMessage({ type: 'error', text: 'Please enter your Loom / Firm Name.' });
        return;
      }
      if (formData.hasGst === 'Yes' && (!formData.gstin.trim() || formData.gstin.trim().length < 10)) {
        setStatusMessage({ type: 'error', text: 'Please enter a valid GSTIN number.' });
        return;
      }
    }

    if (!formData.city.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your city.' });
      return;
    }
    if (!formData.state.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your state.' });
      return;
    }
    if (cleanPincode.trim().length < 3) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid pincode.' });
      return;
    }

    setSaving(true);

    try {
      const isVendor = selectedCategory === 'supplier';
      let buyerSubtype = 'Customer';
      let qualificationData = null;

      const existingQual = (typeof buyerProfile?.qualification === 'object' && buyerProfile?.qualification)
        ? buyerProfile.qualification
        : (typeof user?.user_metadata?.qualification === 'object' && user?.user_metadata?.qualification ? user.user_metadata.qualification : {});

      if (selectedCategory === 'customer') {
        buyerSubtype = buyerProfile?.buyer_subtype || 'Customer';
        qualificationData = {
          ...existingQual,
          user_type: existingQual.user_type || 'customer',
        };
      } else if (selectedCategory === 'reseller') {
        const matched = BUSINESS_TYPES.find((b) => b.id === formData.businessType);
        buyerSubtype = matched?.subtype || 'Reseller';
        qualificationData = {
          ...existingQual,
          user_type: 'business',
          business_type: formData.businessType,
          business_type_label: matched?.label || formData.businessType,
          business_experience: formData.businessExperience,
          monthly_budget: formData.monthlyBudget,
          sales_channels: formData.salesChannels,
          purchase_intent: formData.purchaseIntent,
        };
      } else if (selectedCategory === 'supplier') {
        buyerSubtype = formData.supplierBusinessType || 'Supplier';
        qualificationData = {
          ...existingQual,
          user_type: 'supplier',
          contact_person: cleanFullName,
          business_name: formData.supplierBusinessName.trim() || formData.businessName.trim(),
          location_city: formData.city.trim(),
          has_gst: formData.hasGst,
          gstin: formData.gstin.trim(),
          business_email: (formData.businessEmail || user?.email || '').trim(),
          phone: cleanWhatsapp,
          instagram: formData.instagram.trim(),
          ecommerce_website: (formData.ecommerceWebsite || formData.website || '').trim(),
          business_experience: formData.supplierExperience,
          wholesale_price_range: formData.wholesalePriceRange,
          business_type: formData.supplierBusinessType,
          supplied_products: formData.suppliedProducts,
          weaving_specialisation: formData.weavingSpecialisation,
          manufacturing_location: formData.manufacturingLocation,
          other_city_name: formData.otherCityName.trim(),
          single_piece_supply: formData.singlePieceSupply,
          repeat_supply: formData.repeatSupply,
          has_catalogue: formData.hasCatalogue,
          catalogue_source: formData.catalogueSource,
        };
      }

      const cleanBusinessName = selectedCategory === 'supplier'
        ? (formData.supplierBusinessName.trim() || formData.businessName.trim())
        : (selectedCategory === 'reseller' ? formData.businessName.trim() : '');

      const cleanWebsite = selectedCategory === 'supplier'
        ? (formData.ecommerceWebsite || formData.website || '').trim()
        : (formData.website || '').trim();

      const cleanSocial = selectedCategory === 'supplier'
        ? formData.instagram.trim()
        : (formData.socialHandle || '').trim();

      const resolvedCategories = selectedCategory === 'supplier'
        ? formData.suppliedProducts
        : formData.interestedCategories;

      qualificationData = {
        ...(qualificationData || {}),
        form_completed: true,
        account_locked: false,
        locked_reason: null,
      };

      const isBusiness = selectedCategory === 'reseller';
      const userType = isVendor ? 'supplier' : (isBusiness ? 'business' : 'customer');
      const buyerType = isVendor ? 'vendor' : (isBusiness ? 'business' : 'customer');
      const role = isVendor ? (buyerProfile?.role === 'admin' ? 'admin' : 'vendor') : (isBusiness ? (buyerProfile?.role === 'admin' ? 'admin' : 'reseller') : (buyerProfile?.role === 'admin' ? 'admin' : 'customer'));

      const updatedBuyerProfile = applyAutoApprovalToBuyerProfile({
        ...(buyerProfile || {}),
        full_name: cleanFullName,
        whatsapp: `${formData.countryCode} ${cleanWhatsapp}`,
        whatsapp_country_code: formData.countryCode,
        whatsapp_number: cleanWhatsapp,
        business_name: cleanBusinessName,
        website: cleanWebsite,
        social_handle: cleanSocial,
        user_type: userType,
        qualification: qualificationData,
        buyer_type: buyerType,
        buyer_subtype: buyerSubtype,
        role: role,
        buying_behavior: formData.buyingBehavior,
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: cleanPincode,
        country: (formData.country || 'India').trim(),
        interested_categories: resolvedCategories,
        account_locked: false,
        locked_reason: null,
        updated_at: new Date().toISOString(),
      });

      if (isSupabaseConfigured && user?.id) {
        const { data: updatedAuth, error: authError } = await supabase.auth.updateUser({
          data: {
            buyer_profile: updatedBuyerProfile,
            user_type: userType,
            buyer_type: buyerType,
            qualification: qualificationData,
            full_name: cleanFullName,
            role: role,
          },
        });

        if (authError) throw authError;

        const profileRow = {
          id: user.id,
          email: user.email || '',
          full_name: cleanFullName,
          whatsapp: `${formData.countryCode} ${cleanWhatsapp}`,
          whatsapp_country_code: formData.countryCode,
          whatsapp_number: cleanWhatsapp,
          business_name: cleanBusinessName,
          website: cleanWebsite,
          social_handle: cleanSocial,
          user_type: userType,
          qualification: qualificationData,
          buyer_type: buyerType,
          buyer_subtype: buyerSubtype,
          role: role,
          buying_behavior: formData.buyingBehavior,
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: cleanPincode,
          country: (formData.country || 'India').trim(),
          interested_categories: resolvedCategories,
          price_group: updatedBuyerProfile.price_group || 'approved',
          approval_status: updatedBuyerProfile.approval_status || 'approved',
          updated_at: new Date().toISOString(),
        };

        let { error: dbError } = await supabase
          .from('profiles')
          .upsert(profileRow, { onConflict: 'id' });

        if (dbError && (
          dbError.message?.includes('qualification') ||
          dbError.message?.includes('user_type') ||
          dbError.message?.includes('website') ||
          dbError.message?.includes('social_handle') ||
          dbError.message?.includes('country') ||
          dbError.code === 'PGRST204'
        )) {
          const { qualification, user_type, website, social_handle, country, ...fallbackRow } = profileRow;
          const retryResult = await supabase
            .from('profiles')
            .upsert(fallbackRow, { onConflict: 'id' });
          dbError = retryResult.error;
        }

        if (dbError) {
          console.warn('Profiles table sync:', dbError.message);
        }

        if (setUser && updatedAuth?.user) {
          setUser(updatedAuth.user);
        }
      }

      if (setBuyerProfile) {
        setBuyerProfile(updatedBuyerProfile);
      }

      if (typeof window !== 'undefined') {
        saveCachedProfile(updatedBuyerProfile);
        const updatedUserObj = {
          ...(user || {}),
          user_metadata: {
            ...(user?.user_metadata || {}),
            buyer_profile: updatedBuyerProfile,
            user_type: selectedCategory === 'reseller' ? 'business' : selectedCategory,
            qualification: qualificationData,
            full_name: cleanFullName,
          },
        };
        saveCachedUser(updatedUserObj);
      }

      setStatusMessage({
        type: 'success',
        text: isLocked
          ? '✓ Profile details saved successfully! Your account is now fully unlocked.'
          : 'Profile details saved successfully.',
      });
    } catch (err) {
      console.error('Error saving profile:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to save changes. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="account-profile-panel">
      {/* 1. Account Role Strip */}
      <div className="account-role-strip">
        <div className="account-role-left">
          <span className="account-role-label">Account Role:</span>
          <span className="account-role-value">
            {selectedCategory === 'customer' && 'Customer'}
            {selectedCategory === 'reseller' && 'Business & Reseller'}
            {selectedCategory === 'supplier' && 'Supplier Partner'}
          </span>
          {isLocked && (
            <span className="account-role-locked-tag">
              <Lock size={11} />
              <span>Action Required</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Quiet Header */}
      <div className="account-profile-header-wrap">
        <div className="account-profile-header-left">
          <h2 className="account-profile-heading">
            {selectedCategory === 'customer' && 'Personal Profile'}
            {selectedCategory === 'reseller' && 'Business & Wholesale Profile'}
            {selectedCategory === 'supplier' && 'Supplier Partner Profile'}
          </h2>
          <p className="account-profile-subheading">
            {selectedCategory === 'customer' &&
              'Contact information, delivery address, and shopping preferences.'}
            {selectedCategory === 'reseller' &&
              'Storefront details, sourcing requirements, and wholesale qualifications.'}
            {selectedCategory === 'supplier' &&
              'Loom information, weaving specialisations, and supply capabilities.'}
          </p>
        </div>

        <div className="account-profile-header-actions">
          {selectedCategory === 'reseller' && (
            <a
              href={sellerWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="account-role-support-btn"
            >
              <WhatsappIcon size={14} />
              <span>Switch to Seller</span>
            </a>
          )}
          {selectedCategory === 'customer' && (
            <div className="account-header-cust-actions">
              <a
                href={businessWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="account-upgrade-btn"
              >
                <WhatsappIcon size={14} />
                <span>Switch to Business</span>
              </a>
              <a
                href={sellerWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="account-artisan-link"
              >
                Apply as Seller →
              </a>
            </div>
          )}
          {selectedCategory === 'supplier' && (
            <a
              href={supportWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="account-role-support-btn"
            >
              <WhatsappIcon size={14} />
              <span>Contact Support</span>
            </a>
          )}
        </div>
      </div>


      {statusMessage && (
        <div className={`account-profile-alert ${statusMessage.type}`} role="alert">
          {statusMessage.type === 'success' ? (
            <Check size={16} className="alert-icon-success" />
          ) : (
            <AlertCircle size={16} className="alert-icon-error" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* =====================================================================
          PATH 1: CUSTOMER VIEW (Minimal, quiet, zero clutter)
          ===================================================================== */}
      {selectedCategory === 'customer' && (
        <form onSubmit={handleSave} className="account-profile-form">
          {/* SECTION: Contact */}
          <div className="account-profile-section">
            <div className="account-profile-section-meta">
              <h3 className="account-profile-section-title">Contact Information</h3>
              <p className="account-profile-section-desc">Personal contact details for order tracking and instant delivery updates via WhatsApp.</p>
            </div>

            <div className="account-profile-section-body">
              <div className="account-profile-grid">
                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="cust-fullname">
                    <span>Full Name</span>
                    <span className="account-label-required">*</span>
                  </label>
                  <input
                    id="cust-fullname"
                    type="text"
                    className="account-form-input"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="cust-email">
                    <span>Email Address</span>
                  </label>
                  <input
                    id="cust-email"
                    type="email"
                    className="account-form-input readonly"
                    value={user?.email || ''}
                    disabled
                    readOnly
                  />
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="cust-whatsapp">
                    <span>WhatsApp Number</span>
                    <span className="account-label-required">*</span>
                  </label>
                  <div className="account-phone-group">
                    <div className="account-country-select-wrap">
                      <select
                        className="account-country-select"
                        value={formData.countryCode}
                        onChange={(e) => handleChange('countryCode', e.target.value)}
                        aria-label="Country Code"
                      >
                        {countryCodes.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="account-select-arrow" />
                    </div>
                    <input
                      id="cust-whatsapp"
                      type="tel"
                      className="account-form-input"
                      value={formData.whatsappNumber}
                      onChange={(e) => handleChange('whatsappNumber', e.target.value.replace(/\D/g, '').slice(0, 15))}
                      placeholder="Phone number"
                      maxLength={15}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: Delivery Destination */}
          <div className="account-profile-section">
            <div className="account-profile-section-meta">
              <h3 className="account-profile-section-title">Delivery Destination</h3>
              <p className="account-profile-section-desc">Primary shipping destination used for delivery estimates and swift door dispatch.</p>
            </div>

            <div className="account-profile-section-body">
              <div className="account-profile-grid">
                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="cust-city">
                    <span>City</span>
                    <span className="account-label-required">*</span>
                  </label>
                  <input
                    id="cust-city"
                    type="text"
                    className="account-form-input"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="e.g. Mumbai"
                    required
                  />
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="cust-state">
                    <span>State</span>
                    <span className="account-label-required">*</span>
                  </label>
                  <input
                    id="cust-state"
                    type="text"
                    className="account-form-input"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="e.g. Maharashtra"
                    required
                  />
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="cust-pincode">
                    <span>Pincode</span>
                    <span className="account-label-required">*</span>
                  </label>
                  <input
                    id="cust-pincode"
                    type="text"
                    className="account-form-input"
                    value={formData.pincode}
                    onChange={(e) => handleChange('pincode', normalizePincodeInput(e.target.value))}
                    placeholder="Pincode"
                    maxLength={12}
                    required
                  />
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="cust-country">
                    <span>Country</span>
                    <span className="account-label-required">*</span>
                  </label>
                  <input
                    id="cust-country"
                    type="text"
                    className="account-form-input"
                    value={formData.country ?? ''}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="Country"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: Preferences */}
          <div className="account-profile-section">
            <div className="account-profile-section-meta">
              <h3 className="account-profile-section-title">Product Preferences</h3>
              <p className="account-profile-section-desc">Categories you love to see in your personalized curation and new arrivals feed.</p>
            </div>
            <div className="account-profile-section-body">
              <div className="account-toggle-pill-row">
                {categoryOptions.map((cat) => {
                  const isSelected = formData.interestedCategories.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      className={`account-toggle-pill ${isSelected ? 'active' : ''}`}
                      onClick={() => handleCheckboxToggle('interestedCategories', cat)}
                    >
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Wholesale Trade */}
          <div className="account-profile-section">
            <div className="account-profile-section-meta">
              <h3 className="account-profile-section-title">Wholesale Trade</h3>
              <p className="account-profile-section-desc">Access factory-direct pricing for boutiques, retail stores, and online resellers.</p>
            </div>
            <div className="account-profile-section-body">
              <div className="account-upgrade-prompt-flat">
                <p className="account-upgrade-prompt-text">
                  Buying for a boutique, store, or reselling online? Connect with our trade desk on WhatsApp to verify your business credentials and unlock business features.
                </p>
                <p className="account-upgrade-prompt-action">
                  <span>Request Business Account via </span>
                  <a
                    href={businessWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="account-upgrade-whatsapp-text-btn"
                  >
                    WhatsApp
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="account-profile-actions">
            <div className="account-profile-actions-meta" />
            <div className="account-profile-actions-body">
              <button type="submit" disabled={saving} className="account-save-profile-btn">
                {saving ? (
                  <>
                    <Loader2 size={15} className="spinner" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* =====================================================================
          PATH 2: BUSINESS & RESELLER VIEW (Wholesale Qualification)
          ===================================================================== */}
      {selectedCategory === 'reseller' && (
        <form onSubmit={handleSave} className="account-profile-form">
          {/* SECTION: Contact */}
          <div className="account-profile-section">
            <div className="account-profile-section-meta">
              <h3 className="account-profile-section-title">Primary Contact</h3>
              <p className="account-profile-section-desc">Authorized point of contact for wholesale order correspondence and shipment alerts.</p>
            </div>

            <div className="account-profile-section-body">
              <div className="account-profile-grid">
                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="biz-fullname">
                    <span>Contact Person Name</span>
                    <span className="account-label-required">*</span>
                  </label>
                  <input
                    id="biz-fullname"
                    type="text"
                    className="account-form-input"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    placeholder="Enter name"
                    required
                  />
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="biz-email">
                    <span>Business Email</span>
                  </label>
                  <input
                    id="biz-email"
                    type="email"
                    className="account-form-input readonly"
                    value={user?.email || ''}
                    disabled
                    readOnly
                  />
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="biz-whatsapp">
                    <span>WhatsApp Number</span>
                    <span className="account-label-required">*</span>
                  </label>
                  <div className="account-phone-group">
                    <div className="account-country-select-wrap">
                      <select
                        className="account-country-select"
                        value={formData.countryCode}
                        onChange={(e) => handleChange('countryCode', e.target.value)}
                        aria-label="Country Code"
                      >
                        {countryCodes.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="account-select-arrow" />
                    </div>
                    <input
                      id="biz-whatsapp"
                      type="tel"
                      className="account-form-input"
                      value={formData.whatsappNumber}
                      onChange={(e) => handleChange('whatsappNumber', e.target.value.replace(/\D/g, '').slice(0, 15))}
                      placeholder="Phone number"
                      maxLength={15}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: Business & Storefront */}
          <div className="account-profile-section">
            <div className="account-profile-section-meta">
              <h3 className="account-profile-section-title">Business &amp; Storefront</h3>
              <p className="account-profile-section-desc">Your registered boutique, retail showroom, or e-commerce trade identity.</p>
            </div>

            <div className="account-profile-section-body">
              <div className="account-profile-grid">
                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="biz-name">
                    <span>Business / Store / Boutique Name</span>
                    <span className="account-label-required">*</span>
                  </label>
                  <input
                    id="biz-name"
                    type="text"
                    className="account-form-input"
                    value={formData.businessName}
                    onChange={(e) => handleChange('businessName', e.target.value)}
                    placeholder="e.g. Royal Sarees Boutique"
                    required
                  />
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="biz-type">
                    <span>Business Model</span>
                    <span className="account-label-required">*</span>
                  </label>
                  <div className="account-select-wrap">
                    <select
                      id="biz-type"
                      className="account-form-select"
                      value={formData.businessType}
                      onChange={(e) => handleChange('businessType', e.target.value)}
                    >
                      {BUSINESS_TYPES.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="account-select-arrow" />
                  </div>
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="biz-website">
                    <span>Store Website</span>
                  </label>
                  <input
                    id="biz-website"
                    type="url"
                    className="account-form-input"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://yourstore.com"
                  />
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="biz-social">
                    <span>Instagram / Social Handle</span>
                  </label>
                  <input
                    id="biz-social"
                    type="text"
                    className="account-form-input"
                    value={formData.socialHandle}
                    onChange={(e) => handleChange('socialHandle', e.target.value)}
                    placeholder="@yourboutique"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: Sourcing & Trade Profile */}
          <div className="account-profile-section">
            <div className="account-profile-section-meta">
              <h3 className="account-profile-section-title">Sourcing Profile</h3>
              <p className="account-profile-section-desc">Production allocation, order frequency, and volume tier requirements.</p>
            </div>

            <div className="account-profile-section-body">
              <div className="account-profile-grid">
                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="biz-exp">
                    <span>Years in Business</span>
                  </label>
                  <div className="account-select-wrap">
                    <select
                      id="biz-exp"
                      className="account-form-select"
                      value={formData.businessExperience}
                      onChange={(e) => handleChange('businessExperience', e.target.value)}
                    >
                      {BUSINESS_EXPERIENCE_OPTIONS.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="account-select-arrow" />
                  </div>
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="biz-budget">
                    <span>Monthly Sourcing Budget</span>
                  </label>
                  <div className="account-select-wrap">
                    <select
                      id="biz-budget"
                      className="account-form-select"
                      value={formData.monthlyBudget}
                      onChange={(e) => handleChange('monthlyBudget', e.target.value)}
                    >
                      {BUSINESS_BUDGET_OPTIONS.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="account-select-arrow" />
                  </div>
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="biz-intent">
                    <span>Order Placement Timeline</span>
                  </label>
                  <div className="account-select-wrap">
                    <select
                      id="biz-intent"
                      className="account-form-select"
                      value={formData.purchaseIntent}
                      onChange={(e) => handleChange('purchaseIntent', e.target.value)}
                    >
                      {BUSINESS_PURCHASE_INTENT_OPTIONS.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="account-select-arrow" />
                  </div>
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="biz-sourcing">
                    <span>Primary Sourcing Requirement</span>
                  </label>
                  <div className="account-select-wrap">
                    <select
                      id="biz-sourcing"
                      className="account-form-select"
                      value={formData.buyingBehavior}
                      onChange={(e) => handleChange('buyingBehavior', e.target.value)}
                    >
                      <option value="instant">Ready Stock &amp; Instant Dispatch</option>
                      <option value="bulk">Bulk Wholesale / Full Sets</option>
                      <option value="custom">Custom Weaving &amp; Production</option>
                    </select>
                    <ChevronDown size={14} className="account-select-arrow" />
                  </div>
                </div>
              </div>

              {/* Sales Channels */}
              <div className="account-form-field">
                <label className="account-form-label">
                  <span>Active Sales Channels</span>
                </label>
                <div className="account-toggle-pill-row">
                  {BUSINESS_SALES_CHANNELS.map((item) => {
                    const isChecked = formData.salesChannels.includes(item.id);
                    return (
                      <button
                        type="button"
                        key={item.id}
                        className={`account-toggle-pill ${isChecked ? 'active' : ''}`}
                        onClick={() => handleCheckboxToggle('salesChannels', item.id)}
                      >
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: Delivery Destination */}
          <div className="account-profile-section">
            <div className="account-profile-section-meta">
              <h3 className="account-profile-section-title">Dispatch Location</h3>
              <p className="account-profile-section-desc">Primary commercial destination for wholesale cargo dispatch and tax invoices.</p>
            </div>

            <div className="account-profile-section-body">
              <div className="account-profile-grid">
                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="biz-city">
                    <span>City</span>
                    <span className="account-label-required">*</span>
                  </label>
                  <input
                    id="biz-city"
                    type="text"
                    className="account-form-input"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="City"
                    required
                  />
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="biz-state">
                    <span>State</span>
                    <span className="account-label-required">*</span>
                  </label>
                  <input
                    id="biz-state"
                    type="text"
                    className="account-form-input"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="State"
                    required
                  />
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="biz-pincode">
                    <span>Pincode</span>
                    <span className="account-label-required">*</span>
                  </label>
                  <input
                    id="biz-pincode"
                    type="text"
                    className="account-form-input"
                    value={formData.pincode}
                    onChange={(e) => handleChange('pincode', normalizePincodeInput(e.target.value))}
                    placeholder="Pincode"
                    maxLength={12}
                    required
                  />
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="biz-country">
                    <span>Country</span>
                    <span className="account-label-required">*</span>
                  </label>
                  <input
                    id="biz-country"
                    type="text"
                    className="account-form-input"
                    value={formData.country ?? ''}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="Country"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: Categories */}
          <div className="account-profile-section">
            <div className="account-profile-section-meta">
              <h3 className="account-profile-section-title">Wholesale Categories</h3>
              <p className="account-profile-section-desc">Product categories you stock or plan to source in bulk directly from Varanasi.</p>
            </div>
            <div className="account-profile-section-body">
              <div className="account-toggle-pill-row">
                {categoryOptions.map((cat) => {
                  const isSelected = formData.interestedCategories.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      className={`account-toggle-pill ${isSelected ? 'active' : ''}`}
                      onClick={() => handleCheckboxToggle('interestedCategories', cat)}
                    >
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="account-profile-actions">
            <div className="account-profile-actions-meta" />
            <div className="account-profile-actions-body">
              <button type="submit" disabled={saving} className="account-save-profile-btn">
                {saving ? (
                  <>
                    <Loader2 size={15} className="spinner" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* =====================================================================
          PATH 3: SUPPLIER VIEW (Loom / Artisan Partner)
          ===================================================================== */}
      {selectedCategory === 'supplier' && (
        <form onSubmit={handleSave} className="account-profile-form">
          {/* SECTION: Firm & Contact */}
          <div className="account-profile-section">
            <div className="account-profile-section-meta">
              <h3 className="account-profile-section-title">Firm &amp; Contact</h3>
              <p className="account-profile-section-desc">Loom management, master weaver, or authorized partner contact information.</p>
            </div>

            <div className="account-profile-section-body">
              <div className="account-profile-grid">
                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="supp-contact">
                    <span>Contact Person Name</span>
                    <span className="account-label-required">*</span>
                  </label>
                  <input
                    id="supp-contact"
                    type="text"
                    className="account-form-input"
                    value={formData.contactPerson}
                    onChange={(e) => handleChange('contactPerson', e.target.value)}
                    placeholder="Contact person"
                    required
                  />
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="supp-firm">
                    <span>Loom / Firm Name</span>
                    <span className="account-label-required">*</span>
                  </label>
                  <input
                    id="supp-firm"
                    type="text"
                    className="account-form-input"
                    value={formData.supplierBusinessName}
                    onChange={(e) => handleChange('supplierBusinessName', e.target.value)}
                    placeholder="e.g. Heritage Silk Mills"
                    required
                  />
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="supp-email">
                    <span>Business Email</span>
                  </label>
                  <input
                    id="supp-email"
                    type="email"
                    className="account-form-input readonly"
                    value={formData.businessEmail || user?.email || ''}
                    onChange={(e) => handleChange('businessEmail', e.target.value)}
                    placeholder="Email address"
                  />
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="supp-phone">
                    <span>Phone Number</span>
                    <span className="account-label-required">*</span>
                  </label>
                  <div className="account-phone-group">
                    <div className="account-country-select-wrap">
                      <select
                        className="account-country-select"
                        value={formData.countryCode}
                        onChange={(e) => handleChange('countryCode', e.target.value)}
                        aria-label="Country Code"
                      >
                        {countryCodes.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="account-select-arrow" />
                    </div>
                    <input
                      id="supp-phone"
                      type="tel"
                      className="account-form-input"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 15))}
                      placeholder="Phone number"
                      maxLength={15}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: Credentials & Scale */}
          <div className="account-profile-section">
            <div className="account-profile-section-meta">
              <h3 className="account-profile-section-title">Credentials &amp; Scale</h3>
              <p className="account-profile-section-desc">Loom capacity, manufacturing background, and GST registration status.</p>
            </div>

            <div className="account-profile-section-body">
              <div className="account-profile-grid">
                <div className="account-form-field">
                  <label className="account-form-label">
                    <span>GST Registered?</span>
                  </label>
                  <div className="account-toggle-pill-row">
                    {['Yes', 'No'].map((val) => (
                      <button
                        type="button"
                        key={val}
                        className={`account-toggle-pill ${formData.hasGst === val ? 'active' : ''}`}
                        onClick={() => handleChange('hasGst', val)}
                      >
                        <span>{val}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {formData.hasGst === 'Yes' && (
                  <div className="account-form-field">
                    <label className="account-form-label" htmlFor="supp-gstin">
                      <span>GSTIN Number</span>
                      <span className="account-label-required">*</span>
                    </label>
                    <input
                      id="supp-gstin"
                      type="text"
                      className="account-form-input"
                      value={formData.gstin}
                      onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                      placeholder="09AAAAA0000A1Z5"
                      maxLength={18}
                    />
                  </div>
                )}

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="supp-type">
                    <span>Supplier Role</span>
                  </label>
                  <div className="account-select-wrap">
                    <select
                      id="supp-type"
                      className="account-form-select"
                      value={formData.supplierBusinessType}
                      onChange={(e) => handleChange('supplierBusinessType', e.target.value)}
                    >
                      {SUPPLIER_BUSINESS_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="account-select-arrow" />
                  </div>
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="supp-exp">
                    <span>Years in Manufacturing</span>
                  </label>
                  <div className="account-select-wrap">
                    <select
                      id="supp-exp"
                      className="account-form-select"
                      value={formData.supplierExperience}
                      onChange={(e) => handleChange('supplierExperience', e.target.value)}
                    >
                      {SUPPLIER_EXPERIENCE_OPTIONS.map((exp) => (
                        <option key={exp} value={exp}>
                          {exp}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="account-select-arrow" />
                  </div>
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="supp-pricerange">
                    <span>Wholesale Price Range</span>
                  </label>
                  <div className="account-select-wrap">
                    <select
                      id="supp-pricerange"
                      className="account-form-select"
                      value={formData.wholesalePriceRange}
                      onChange={(e) => handleChange('wholesalePriceRange', e.target.value)}
                    >
                      {SUPPLIER_PRICE_RANGES.map((range) => (
                        <option key={range} value={range}>
                          {range}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="account-select-arrow" />
                  </div>
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="supp-insta">
                    <span>Instagram / Showcase</span>
                  </label>
                  <input
                    id="supp-insta"
                    type="text"
                    className="account-form-input"
                    value={formData.instagram}
                    onChange={(e) => handleChange('instagram', e.target.value)}
                    placeholder="@loomaccount"
                  />
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="supp-web">
                    <span>Website / Catalog</span>
                  </label>
                  <input
                    id="supp-web"
                    type="url"
                    className="account-form-input"
                    value={formData.ecommerceWebsite}
                    onChange={(e) => handleChange('ecommerceWebsite', e.target.value)}
                    placeholder="https://yourloom.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: Weaving & Capabilities */}
          <div className="account-profile-section">
            <div className="account-profile-section-meta">
              <h3 className="account-profile-section-title">Weaving &amp; Production</h3>
              <p className="account-profile-section-desc">Handloom techniques, product lines, and production hub details.</p>
            </div>

            <div className="account-profile-section-body">
              <div className="account-form-field">
                <label className="account-form-label">
                  <span>Weaving Techniques</span>
                </label>
                <div className="account-toggle-pill-row">
                  {SUPPLIER_WEAVING_TYPES.map((weave) => {
                    const isChecked = formData.weavingSpecialisation.includes(weave);
                    return (
                      <button
                        type="button"
                        key={weave}
                        className={`account-toggle-pill ${isChecked ? 'active' : ''}`}
                        onClick={() => handleCheckboxToggle('weavingSpecialisation', weave)}
                      >
                        <span>{weave}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="account-form-field">
                <label className="account-form-label">
                  <span>Products Supplied</span>
                </label>
                <div className="account-toggle-pill-row">
                  {SUPPLIER_PRODUCTS.map((prod) => {
                    const isChecked = formData.suppliedProducts.includes(prod);
                    return (
                      <button
                        type="button"
                        key={prod}
                        className={`account-toggle-pill ${isChecked ? 'active' : ''}`}
                        onClick={() => handleCheckboxToggle('suppliedProducts', prod)}
                      >
                        <span>{prod}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="account-profile-grid">
                <div className="account-form-field">
                  <label className="account-form-label">
                    <span>Manufacturing Hub</span>
                  </label>
                  <div className="account-toggle-pill-row">
                    {['Varanasi', 'Other City'].map((loc) => (
                      <button
                        type="button"
                        key={loc}
                        className={`account-toggle-pill ${formData.manufacturingLocation === loc ? 'active' : ''}`}
                        onClick={() => handleChange('manufacturingLocation', loc)}
                      >
                        <span>{loc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {formData.manufacturingLocation === 'Other City' && (
                  <div className="account-form-field">
                    <label className="account-form-label" htmlFor="supp-othercity">
                      <span>City Name</span>
                    </label>
                    <input
                      id="supp-othercity"
                      type="text"
                      className="account-form-input"
                      value={formData.otherCityName}
                      onChange={(e) => handleChange('otherCityName', e.target.value)}
                      placeholder="e.g. Surat, Chanderi"
                    />
                  </div>
                )}

                <div className="account-form-field">
                  <label className="account-form-label">
                    <span>Single-Piece Supply?</span>
                  </label>
                  <div className="account-toggle-pill-row">
                    {['Yes', 'No'].map((val) => (
                      <button
                        type="button"
                        key={val}
                        className={`account-toggle-pill ${formData.singlePieceSupply === val ? 'active' : ''}`}
                        onClick={() => handleChange('singlePieceSupply', val)}
                      >
                        <span>{val}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="account-form-field">
                  <label className="account-form-label">
                    <span>Repeat Supply Available?</span>
                  </label>
                  <div className="account-toggle-pill-row">
                    {['Yes', 'No'].map((val) => (
                      <button
                        type="button"
                        key={val}
                        className={`account-toggle-pill ${formData.repeatSupply === val ? 'active' : ''}`}
                        onClick={() => handleChange('repeatSupply', val)}
                      >
                        <span>{val}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: Catalogue */}
          <div className="account-profile-section">
            <div className="account-profile-section-meta">
              <h3 className="account-profile-section-title">Catalogue</h3>
              <p className="account-profile-section-desc">Product catalogue format and supply modes for buyer purchase orders.</p>
            </div>

            <div className="account-profile-section-body">
              <div className="account-profile-grid">
                <div className="account-form-field">
                  <label className="account-form-label">
                    <span>Product Catalogue Available?</span>
                  </label>
                  <div className="account-toggle-pill-row">
                    {['Yes', 'No'].map((val) => (
                      <button
                        type="button"
                        key={val}
                        className={`account-toggle-pill ${formData.hasCatalogue === val ? 'active' : ''}`}
                        onClick={() => handleChange('hasCatalogue', val)}
                      >
                        <span>{val}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="supp-catsource">
                    <span>Catalogue Source</span>
                  </label>
                  <div className="account-select-wrap">
                    <select
                      id="supp-catsource"
                      className="account-form-select"
                      value={formData.catalogueSource}
                      onChange={(e) => handleChange('catalogueSource', e.target.value)}
                    >
                      {SUPPLIER_CATALOGUE_SOURCES.map((source) => (
                        <option key={source} value={source}>
                          {source}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="account-select-arrow" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: Location */}
          <div className="account-profile-section">
            <div className="account-profile-section-meta">
              <h3 className="account-profile-section-title">Loom Facility Location</h3>
              <p className="account-profile-section-desc">Loom or mill dispatch warehouse location for bulk shipping and verification.</p>
            </div>

            <div className="account-profile-section-body">
              <div className="account-profile-grid">
                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="supp-city">
                    <span>City</span>
                    <span className="account-label-required">*</span>
                  </label>
                  <input
                    id="supp-city"
                    type="text"
                    className="account-form-input"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="City"
                    required
                  />
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="supp-state">
                    <span>State</span>
                    <span className="account-label-required">*</span>
                  </label>
                  <input
                    id="supp-state"
                    type="text"
                    className="account-form-input"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="State"
                    required
                  />
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="supp-pincode">
                    <span>Pincode</span>
                    <span className="account-label-required">*</span>
                  </label>
                  <input
                    id="supp-pincode"
                    type="text"
                    className="account-form-input"
                    value={formData.pincode}
                    onChange={(e) => handleChange('pincode', normalizePincodeInput(e.target.value))}
                    placeholder="Pincode"
                    maxLength={12}
                    required
                  />
                </div>

                <div className="account-form-field">
                  <label className="account-form-label" htmlFor="supp-country">
                    <span>Country</span>
                    <span className="account-label-required">*</span>
                  </label>
                  <input
                    id="supp-country"
                    type="text"
                    className="account-form-input"
                    value={formData.country ?? ''}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="Country"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="account-profile-actions">
            <div className="account-profile-actions-meta" />
            <div className="account-profile-actions-body">
              <button type="submit" disabled={saving} className="account-save-profile-btn">
                {saving ? (
                  <>
                    <Loader2 size={15} className="spinner" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
