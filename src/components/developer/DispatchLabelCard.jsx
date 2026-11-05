import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Check,
  Edit,
  RotateCcw,
  Building2,
  Phone,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from '../icons.jsx';
import { supabase, isSupabaseConfigured } from '../../supabaseClient.js';

/**
 * DispatchLabelCard
 * Allows resellers & developers to configure the "Ship From" (Sender) address
 * printed on courier slips and parcel labels for all API orders.
 */
export function DispatchLabelCard({
  user,
  buyerProfile,
  onProfileUpdate,
  isAdminMode = false,
}) {
  const [addresses, setAddresses] = useState([]);
  const [loadingAddrs, setLoadingAddrs] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form states
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderAddr1, setSenderAddr1] = useState('');
  const [senderAddr2, setSenderAddr2] = useState('');
  const [senderCity, setSenderCity] = useState('');
  const [senderState, setSenderState] = useState('');
  const [senderPincode, setSenderPincode] = useState('');

  // Fetch saved addresses
  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;
    let isMounted = true;

    async function loadUserAddresses() {
      setLoadingAddrs(true);
      try {
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false });
        if (!error && isMounted && data) {
          setAddresses(data);
        }
      } catch (err) {
        console.error('Failed to load user addresses for dispatch card:', err);
      } finally {
        if (isMounted) setLoadingAddrs(false);
      }
    }

    loadUserAddresses();
    return () => { isMounted = false; };
  }, [user?.id]);

  // Resolve current active dispatch address
  const customDispatch = buyerProfile?.qualification?.dispatch_address || null;
  const defaultSavedAddr = addresses.find(a => a.is_default) || addresses[0] || null;

  const activeName = customDispatch?.full_name || customDispatch?.name || defaultSavedAddr?.full_name || buyerProfile?.business_name || buyerProfile?.full_name || 'Not Set';
  const activePhone = customDispatch?.phone_number || customDispatch?.phone || defaultSavedAddr?.phone_number || buyerProfile?.whatsapp || '';
  const activeAddr1 = customDispatch?.address_line1 || defaultSavedAddr?.address_line1 || '';
  const activeAddr2 = customDispatch?.address_line2 || defaultSavedAddr?.address_line2 || '';
  const activeCity = customDispatch?.city || defaultSavedAddr?.city || buyerProfile?.city || '';
  const activeState = customDispatch?.state || defaultSavedAddr?.state || buyerProfile?.state || '';
  const activePincode = customDispatch?.pincode || defaultSavedAddr?.pincode || buyerProfile?.pincode || '';

  const hasCompleteAddress = Boolean(activeAddr1 && activeCity && activePincode);

  // Initialize form when editing starts
  const startEditing = () => {
    setSenderName(activeName !== 'Not Set' ? activeName : '');
    setSenderPhone(activePhone || '');
    setSenderAddr1(activeAddr1 || '');
    setSenderAddr2(activeAddr2 || '');
    setSenderCity(activeCity || '');
    setSenderState(activeState || '');
    setSenderPincode(activePincode || '');
    setIsEditing(true);
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  // Populate from a saved address chip
  const selectSavedAddress = (addr) => {
    setSenderName(addr.full_name || buyerProfile?.business_name || '');
    setSenderPhone(addr.phone_number || buyerProfile?.whatsapp || '');
    setSenderAddr1(addr.address_line1 || '');
    setSenderAddr2(addr.address_line2 || '');
    setSenderCity(addr.city || '');
    setSenderState(addr.state || '');
    setSenderPincode(addr.pincode || '');
  };

  // Save custom dispatch address
  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.id || !isSupabaseConfigured) return;

    if (!senderName.trim() || !senderAddr1.trim() || !senderCity.trim() || !senderPincode.trim()) {
      setErrorMsg('Please fill in Sender Name, Address Line 1, City, and PIN code.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const updatedDispatchAddr = {
      full_name: senderName.trim(),
      phone_number: senderPhone.trim(),
      address_line1: senderAddr1.trim(),
      address_line2: senderAddr2.trim() || null,
      city: senderCity.trim(),
      state: senderState.trim(),
      pincode: senderPincode.trim(),
      country: 'India',
      is_custom: true,
      updated_at: new Date().toISOString(),
    };

    const newQualification = {
      ...(buyerProfile?.qualification || {}),
      dispatch_address: updatedDispatchAddr,
    };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ qualification: newQualification })
        .eq('id', user.id);

      if (error) throw error;

      if (onProfileUpdate) {
        onProfileUpdate({
          ...buyerProfile,
          qualification: newQualification,
        });
      }

      setSuccessMsg('Dispatch label address saved! All future API orders will print this Ship From address.');
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      console.error('Failed to save dispatch address:', err);
      setErrorMsg(err.message || 'Failed to save dispatch address.');
    } finally {
      setSaving(false);
    }
  };

  // Reset to default account address
  const handleResetToDefault = async () => {
    if (!user?.id || !isSupabaseConfigured) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const newQualification = { ...(buyerProfile?.qualification || {}) };
    delete newQualification.dispatch_address;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ qualification: newQualification })
        .eq('id', user.id);

      if (error) throw error;

      if (onProfileUpdate) {
        onProfileUpdate({
          ...buyerProfile,
          qualification: newQualification,
        });
      }

      setSuccessMsg('Reset to default account address.');
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to reset dispatch address:', err);
      setErrorMsg(err.message || 'Failed to reset.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dev-card dev-dispatch-card">
      <div className="dev-card-head">
        <div className="dev-card-title">
          <MapPin size={16} />
          <h3>Dispatch Label Address (Ship From)</h3>
          <span className="dev-tier-tag">Printed on Courier Slip</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {customDispatch ? (
            <span className="dev-quiet-status-tag active" title="Custom label address configured">
              <span className="dev-quiet-dot" /> Custom Label Active
            </span>
          ) : (
            <span className="dev-quiet-status-tag" style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
              Using Primary Account Address
            </span>
          )}
        </div>
      </div>

      <div className="dev-dispatch-body">
        <p className="dev-dispatch-lead">
          This address is printed as the <strong>Ship From (Sender)</strong> address on courier shipping labels and customer parcel slips for wholesale orders placed through your Developer API.
        </p>

        {successMsg && (
          <div className="dev-dispatch-alert success">
            <CheckCircle2 size={15} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="dev-dispatch-alert error">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {!isEditing ? (
          <div className="dev-dispatch-view-panel">
            <div className="dev-dispatch-preview-box">
              <div className="dev-dispatch-preview-header">
                <span className="dev-dispatch-preview-tag">LABEL SHIP FROM PREVIEW</span>
                <span className="dev-dispatch-status-badge">
                  {customDispatch ? 'Customized for API' : 'Synced from Profile'}
                </span>
              </div>
              <strong className="dev-dispatch-name">{activeName}</strong>
              {activePhone && (
                <div className="dev-dispatch-line">
                  <Phone size={13} /> <span>{activePhone}</span>
                </div>
              )}
              {activeAddr1 ? (
                <div className="dev-dispatch-line address">
                  <span>{activeAddr1}{activeAddr2 ? `, ${activeAddr2}` : ''}</span>
                </div>
              ) : (
                <div className="dev-dispatch-line empty">
                  <span>No street address configured</span>
                </div>
              )}
              {(activeCity || activePincode) && (
                <div className="dev-dispatch-line city-pin">
                  <span>{[activeCity, activeState].filter(Boolean).join(', ')}{activePincode ? ` - PIN: ${activePincode}` : ''}</span>
                </div>
              )}
            </div>

            <div className="dev-dispatch-actions">
              <button
                type="button"
                onClick={startEditing}
                className="dev-dispatch-btn primary"
              >
                <Edit size={14} />
                <span>{customDispatch ? 'Change Dispatch Address' : 'Customize Label Address'}</span>
              </button>

              {customDispatch && (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  disabled={saving}
                  className="dev-dispatch-btn secondary"
                  title="Revert back to primary account address"
                >
                  <RotateCcw size={14} />
                  <span>Reset to Account Default</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="dev-dispatch-form">
            {/* Quick Pick from Saved Addresses */}
            {addresses.length > 0 && (
              <div className="dev-dispatch-quick-pick">
                <span className="dev-dispatch-quick-label">
                  <Sparkles size={13} /> Select from your saved profile addresses:
                </span>
                <div className="dev-dispatch-chips-row">
                  {addresses.map(addr => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => selectSavedAddress(addr)}
                      className="dev-dispatch-chip-btn"
                      title={`${addr.address_line1}, ${addr.city}`}
                    >
                      <strong>{addr.full_name || 'Address'}</strong>
                      <span>({addr.city}{addr.is_default ? ' · Default' : ''})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="dev-dispatch-fields-grid">
              <div className="dev-dispatch-field">
                <label>Sender / Store Name <span className="req">*</span></label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Meher Sarees / Boutique Name"
                  required
                />
              </div>

              <div className="dev-dispatch-field">
                <label>Contact Phone <span className="req">*</span></label>
                <input
                  type="tel"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div className="dev-dispatch-field full">
                <label>Address Line 1 <span className="req">*</span></label>
                <input
                  type="text"
                  value={senderAddr1}
                  onChange={(e) => setSenderAddr1(e.target.value)}
                  placeholder="Street address, shop / floor number"
                  required
                />
              </div>

              <div className="dev-dispatch-field full">
                <label>Address Line 2 (Optional)</label>
                <input
                  type="text"
                  value={senderAddr2}
                  onChange={(e) => setSenderAddr2(e.target.value)}
                  placeholder="Landmark, suite, complex"
                />
              </div>

              <div className="dev-dispatch-field">
                <label>City <span className="req">*</span></label>
                <input
                  type="text"
                  value={senderCity}
                  onChange={(e) => setSenderCity(e.target.value)}
                  placeholder="e.g. Varanasi"
                  required
                />
              </div>

              <div className="dev-dispatch-field">
                <label>State</label>
                <input
                  type="text"
                  value={senderState}
                  onChange={(e) => setSenderState(e.target.value)}
                  placeholder="e.g. Uttar Pradesh"
                />
              </div>

              <div className="dev-dispatch-field">
                <label>PIN Code <span className="req">*</span></label>
                <input
                  type="text"
                  value={senderPincode}
                  onChange={(e) => setSenderPincode(e.target.value)}
                  placeholder="e.g. 221001"
                  required
                />
              </div>
            </div>

            <div className="dev-dispatch-form-actions">
              <button
                type="submit"
                disabled={saving}
                className="dev-dispatch-btn primary"
              >
                <Check size={14} />
                <span>{saving ? 'Saving Address...' : 'Save Label Address'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="dev-dispatch-btn secondary"
              >
                <span>Cancel</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

