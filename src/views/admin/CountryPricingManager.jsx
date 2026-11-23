/**
 * @file CountryPricingManager.jsx
 * @description Admin Panel Management for Country Pricing, Dynamic Exchange Rates,
 * Markups, and Live Price Simulation.
 * Styled with Impeccable 'distill' & 'quieter' principles.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Globe,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calculator,
  Lock,
  X,
  Loader2,
} from '../../components/icons.jsx';
import { useCountryCurrency, PRESET_ADDITIONAL_COUNTRIES } from '../../store/useCountryCurrency.js';
import { ALL_EXISTING_COUNTRIES } from '../../constants/allCountries.js';
import { getLocalizedPrice } from '../../services/pricingService.js';
import { supabase } from '../../supabaseClient.js';
import '../../styles/countryPricingAdmin.css';
import AdminLoadingScreen from './AdminLoadingScreen.jsx';

// Serializes country configuration into a deterministic string for dirty checking
function serializeCountriesForDiff(list) {
  if (!Array.isArray(list)) return '';
  return JSON.stringify(
    list.map((c) => ({
      code: String(c.code || '').toUpperCase(),
      name: String(c.name || '').trim(),
      currency: String(c.currency || 'INR').toUpperCase(),
      currencySymbol: String(c.currencySymbol || c.currency || ''),
      markupPercent: Number(c.markupPercent) || 0,
      shippingFee: Number(c.shippingRate ?? c.shippingFee ?? 0),
      shippingRate: Number(c.shippingRate ?? c.shippingFee ?? 0),
      shippingUnit: (c.shippingUnit || 'kg').toLowerCase() === 'g' ? 'g' : 'kg',
      enabled: c.enabled !== false,
      flag: c.flag || '🌐',
    }))
  );
}

export default function CountryPricingManager({ adminData, loading = false }) {
  const {
    countries: storeCountries,
    exchangeRates: storeRates,
    exchangeRateMeta: storeMeta,
    setCountries,
    setExchangeRates,
  } = useCountryCurrency();

  const [countries, setLocalCountries] = useState(storeCountries);
  const [exchangeRates, setLocalRates] = useState(storeRates);
  const [exchangeMeta, setLocalMeta] = useState(storeMeta);

  const [isRefreshingRates, setIsRefreshingRates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

  // Auto-save state and lifecycle refs
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saved' | 'unsaved' | 'saving' | 'error'
  const [lastSavedTime, setLastSavedTime] = useState(null);

  const isInitializedRef = useRef(false);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const lastSavedHashRef = useRef('');
  const debounceTimerRef = useRef(null);
  const latestCountriesRef = useRef(countries);

  // Keep latestCountriesRef in sync
  latestCountriesRef.current = countries;

  // Add Country Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [selectedPresetCode, setSelectedPresetCode] = useState('');
  const [customMarkup, setCustomMarkup] = useState('10');
  const [customShippingFee, setCustomShippingFee] = useState('0');
  const [customShippingUnit, setCustomShippingUnit] = useState('kg');
  const [customFields, setCustomFields] = useState({
    code: '',
    name: '',
    currency: '',
    currencySymbol: '',
    flag: '🌐',
  });

  // Price Preview Simulator State
  const [previewBasePrice, setPreviewBasePrice] = useState(1000);
  const [previewCountryCode, setPreviewCountryCode] = useState('US');

  // Fresh load from Supabase on mount
  useEffect(() => {
    async function loadFreshFromDb() {
      try {
        const res = await fetch('/api/country-pricing');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.countries) && data.countries.length > 0) {
            setLocalCountries(data.countries);
            setCountries(data.countries);
            latestCountriesRef.current = data.countries;
            lastSavedHashRef.current = serializeCountriesForDiff(data.countries);
          }
          if (data.exchangeRates) {
            setLocalRates(data.exchangeRates);
            setLocalMeta(data.exchangeRateMeta);
            setExchangeRates(data.exchangeRates, data.exchangeRateMeta);
          }
        }
      } catch (err) {
        console.warn('[CountryPricingManager] Fresh load error:', err);
      } finally {
        setTimeout(() => {
          isInitializedRef.current = true;
          setAutoSaveStatus('saved');
        }, 300);
      }
    }
    loadFreshFromDb();
  }, [setCountries, setExchangeRates]);

  useEffect(() => {
    if (!isInitializedRef.current && storeCountries?.length > 0) {
      setLocalCountries(storeCountries);
      latestCountriesRef.current = storeCountries;
      lastSavedHashRef.current = serializeCountriesForDiff(storeCountries);
    }
  }, [storeCountries]);

  useEffect(() => {
    setLocalRates(storeRates);
    setLocalMeta(storeMeta);
  }, [storeRates, storeMeta]);

  // Debounced auto-save listener on countries changes
  useEffect(() => {
    if (!isInitializedRef.current) return;

    const currentHash = serializeCountriesForDiff(countries);
    if (currentHash === lastSavedHashRef.current) {
      setAutoSaveStatus('saved');
      return;
    }

    setAutoSaveStatus('unsaved');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 850ms debounce window prevents overwhelming the database while user is actively typing or editing
    debounceTimerRef.current = setTimeout(() => {
      executeSave(latestCountriesRef.current, true);
    }, 850);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [countries]);

  // Warn if leaving tab with pending unsaved edits
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (autoSaveStatus === 'unsaved' || autoSaveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [autoSaveStatus]);

  // Handle markup input change
  const handleMarkupChange = (code, val) => {
    setLocalCountries((prev) =>
      prev.map((c) => {
        if (c.code === code) {
          const num = parseFloat(val);
          return { ...c, markupPercent: isNaN(num) ? 0 : num };
        }
        return c;
      })
    );
  };

  // Handle shipping / delivery charge input change
  const handleShippingChange = (code, val) => {
    setLocalCountries((prev) =>
      prev.map((c) => {
        if (c.code === code) {
          const num = parseFloat(val);
          const safeNum = isNaN(num) ? 0 : Math.max(0, num);
          return { ...c, shippingFee: safeNum, shippingRate: safeNum };
        }
        return c;
      })
    );
  };

  // Handle shipping weight unit change (kg vs g)
  const handleShippingUnitChange = (code, unit) => {
    setLocalCountries((prev) =>
      prev.map((c) => {
        if (c.code === code) {
          return { ...c, shippingUnit: unit === 'g' ? 'g' : 'kg' };
        }
        return c;
      })
    );
  };

  // Toggle country enabled
  const handleToggleEnabled = (code) => {
    setLocalCountries((prev) =>
      prev.map((c) => {
        if (c.code === code) {
          if (c.isBase) return c; // Cannot disable base country
          return { ...c, enabled: !c.enabled };
        }
        return c;
      })
    );
  };

  // Remove custom country
  const handleRemoveCountry = (code) => {
    setLocalCountries((prev) => prev.filter((c) => c.code !== code || c.isBase));
  };

  // Add country (from presets or custom fields)
  const handleAddCountry = () => {
    let newCountry = null;
    const numMarkup = parseFloat(customMarkup);
    const validMarkup = isNaN(numMarkup) ? 10 : numMarkup;
    const numShipping = parseFloat(customShippingFee);
    const validShipping = isNaN(numShipping) ? 0 : Math.max(0, numShipping);
    const validUnit = customShippingUnit === 'g' ? 'g' : 'kg';

    if (isCustomMode) {
      const code = (customFields.code || '').trim().toUpperCase();
      const name = (customFields.name || '').trim();
      const currency = (customFields.currency || '').trim().toUpperCase();
      const currencySymbol = (customFields.currencySymbol || customFields.currency || '').trim();
      const flag = (customFields.flag || '🌐').trim();

      if (!code || !name || !currency) {
        setSaveStatus({ type: 'error', message: 'Please fill in Country Name, Code (2 letters), and Currency.' });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 4000);
        return;
      }

      if (countries.some((c) => c.code.toUpperCase() === code)) {
        setSaveStatus({ type: 'error', message: `Country code ${code} is already configured.` });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 4000);
        return;
      }

      newCountry = {
        code,
        name,
        currency,
        currencySymbol: currencySymbol || currency,
        flag: flag || '🌐',
        markupPercent: validMarkup,
        shippingFee: validShipping,
        shippingRate: validShipping,
        shippingUnit: validUnit,
        enabled: true,
        isBase: false,
      };
    } else {
      if (!selectedPresetCode) return;
      const preset = ALL_EXISTING_COUNTRIES.find((c) => c.code === selectedPresetCode) ||
        PRESET_ADDITIONAL_COUNTRIES.find((c) => c.code === selectedPresetCode);
      if (!preset) return;

      if (countries.some((c) => c.code === preset.code)) {
        setSaveStatus({ type: 'error', message: `${preset.name} is already configured.` });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 4000);
        return;
      }

      newCountry = {
        ...preset,
        markupPercent: validMarkup,
        shippingFee: validShipping,
        shippingRate: validShipping,
        shippingUnit: validUnit,
        enabled: true,
        isBase: false,
      };
    }

    setLocalCountries((prev) => [...prev, newCountry]);
    setSelectedPresetCode('');
    setCustomFields({ code: '', name: '', currency: '', currencySymbol: '', flag: '🌐' });
    setCustomShippingFee('0');
    setCustomShippingUnit('kg');
    setIsCustomMode(false);
    setShowAddModal(false);
    setSaveStatus({ type: 'success', message: `Added ${newCountry.name}. Auto-saving changes...` });
    setTimeout(() => setSaveStatus({ type: '', message: '' }), 4000);
  };

  // Refresh Exchange Rates from server API
  const handleRefreshRates = async () => {
    setIsRefreshingRates(true);
    setSaveStatus({ type: '', message: '' });

    try {
      const session = (await supabase?.auth.getSession())?.data?.session;
      const token = session?.access_token;

      const res = await fetch('/api/admin/country-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'refresh_exchange_rates' }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to refresh rates.');
      }

      setLocalRates(data.exchangeRates);
      setLocalMeta(data.exchangeRateMeta);
      setExchangeRates(data.exchangeRates, data.exchangeRateMeta);
      setSaveStatus({ type: 'success', message: 'Exchange rates refreshed successfully.' });
    } catch (err) {
      console.error('Refresh rates error:', err);
      setSaveStatus({ type: 'error', message: err.message || 'Failed to refresh rates.' });
    } finally {
      setIsRefreshingRates(false);
      setTimeout(() => setSaveStatus({ type: '', message: '' }), 4000);
    }
  };

  // Save country configurations to database (Direct Supabase + API sync)
  const executeSave = async (countriesToSave = latestCountriesRef.current, isAuto = false) => {
    if (!countriesToSave || !countriesToSave.length) return;

    const currentHash = serializeCountriesForDiff(countriesToSave);
    if (currentHash === lastSavedHashRef.current) {
      setAutoSaveStatus('saved');
      return;
    }

    if (isSavingRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    isSavingRef.current = true;
    setAutoSaveStatus('saving');
    if (!isAuto) {
      setIsSaving(true);
      setSaveStatus({ type: '', message: '' });
    }

    try {
      let clientDbSaved = false;

      // 1. Direct write from client to Supabase country_pricing_configs
      if (supabase) {
        try {
          const rowsToUpsert = countriesToSave.map((c, index) => ({
            code: c.code.toUpperCase(),
            name: c.name,
            currency: c.currency.toUpperCase(),
            currency_symbol: c.currencySymbol || c.currency,
            markup_percent: Number(c.markupPercent) || 0,
            flag: c.flag || '🌐',
            enabled: c.enabled !== false,
            is_base: Boolean(c.isBase),
            sort_order: index + 1,
            updated_at: new Date().toISOString(),
          }));

          const { error: dbError } = await supabase
            .from('country_pricing_configs')
            .upsert(rowsToUpsert, { onConflict: 'code' });

          if (!dbError) {
            clientDbSaved = true;
            // Clean up removed countries
            const currentCodes = countriesToSave.map((c) => c.code.toUpperCase());
            const { data: existingRows } = await supabase
              .from('country_pricing_configs')
              .select('code, is_base');

            if (Array.isArray(existingRows)) {
              const toDelete = existingRows
                .filter((r) => !r.is_base && !currentCodes.includes(r.code))
                .map((r) => r.code);

              if (toDelete.length > 0) {
                await supabase
                  .from('country_pricing_configs')
                  .delete()
                  .in('code', toDelete);
              }
            }
          }
        } catch (dbErr) {
          console.warn('Client-side Supabase note:', dbErr);
        }
      }

      // 2. Also call the Edge API endpoint with session token (preserves shippingRate, shippingUnit, shippingFee)
      const session = (await supabase?.auth.getSession())?.data?.session;
      const token = session?.access_token;

      const res = await fetch('/api/admin/country-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'save_country_pricing',
          countries: countriesToSave,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (!clientDbSaved) {
          throw new Error(data.error || 'Failed to save country pricing in Supabase.');
        }
      }

      lastSavedHashRef.current = serializeCountriesForDiff(countriesToSave);
      setCountries(countriesToSave);
      setAutoSaveStatus('saved');
      setLastSavedTime(new Date());

      if (!isAuto) {
        setSaveStatus({ type: 'success', message: 'Country pricing configuration saved successfully in Supabase.' });
        setTimeout(() => setSaveStatus({ type: '', message: '' }), 4000);
      }
    } catch (err) {
      console.error('Save error:', err);
      setAutoSaveStatus('error');
      setSaveStatus({ type: 'error', message: err.message || 'Failed to save changes.' });
      setTimeout(() => setSaveStatus({ type: '', message: '' }), 5000);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);

      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        executeSave(latestCountriesRef.current, true);
      }
    }
  };

  // Immediate manual save trigger
  const handleManualSave = async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    await executeSave(latestCountriesRef.current, false);
  };

  // Calculated preview simulation
  const previewCalculation = useMemo(() => {
    const targetCountry = countries.find((c) => c.code === previewCountryCode) || countries[0];
    return getLocalizedPrice(previewBasePrice, targetCountry, exchangeRates);
  }, [previewBasePrice, previewCountryCode, countries, exchangeRates]);

  const availablePresets = useMemo(() => {
    const existingCodes = new Set(countries.map((c) => c.code?.toUpperCase()));
    return ALL_EXISTING_COUNTRIES.filter((c) => !c.isBase && !existingCodes.has(c.code?.toUpperCase()));
  }, [countries]);

  // Clean provider display
  const providerDisplay = useMemo(() => {
    const raw = exchangeMeta?.provider || '';
    if (raw.includes('exchangerate-api')) return 'ExchangeRate-API';
    return raw || 'Live Provider';
  }, [exchangeMeta?.provider]);

  // Formatted last updated
  const formattedLastUpdated = useMemo(() => {
    if (!exchangeMeta?.lastUpdated) return 'Just now';
    try {
      const d = new Date(exchangeMeta.lastUpdated);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  }, [exchangeMeta?.lastUpdated]);

  if (loading) {
    return (
      <AdminLoadingScreen
        title="Loading Country Pricing..."
        subtitle="Fetching international currency rules and regional markups…"
      />
    );
  }

  return (
    <div className="cpa-container">
      {/* 1. Header */}
      <header className="cpa-header">
        <div className="cpa-header-info">
          <h1 className="cpa-title">
            <Globe size={20} className="cpa-title-icon" /> Country Pricing &amp; Currency
          </h1>
          <p className="cpa-subtitle">
            Configure international currencies, dynamic exchange rates, and country-specific markups.
          </p>
        </div>

        <div className="cpa-header-actions">
          {/* Accessible Auto-save Status Indicator */}
          <div
            className={`cpa-autosave-indicator cpa-autosave-${autoSaveStatus}`}
            role="status"
            aria-live="polite"
            title={
              autoSaveStatus === 'saving'
                ? 'Saving changes to database...'
                : autoSaveStatus === 'unsaved'
                ? 'Unsaved changes (will auto-save in a moment)'
                : autoSaveStatus === 'error'
                ? 'Auto-save failed — click Save Changes to retry'
                : 'All changes are automatically saved'
            }
          >
            {autoSaveStatus === 'saving' && (
              <>
                <Loader2 size={13} className="cpa-spin" />
                <span>Saving...</span>
              </>
            )}
            {autoSaveStatus === 'unsaved' && (
              <>
                <span className="cpa-autosave-dot" />
                <span>Unsaved changes</span>
              </>
            )}
            {autoSaveStatus === 'saved' && (
              <>
                <CheckCircle2 size={13} className="cpa-autosave-check" />
                <span>{lastSavedTime ? 'Saved' : 'Auto-save active'}</span>
              </>
            )}
            {autoSaveStatus === 'error' && (
              <>
                <AlertCircle size={13} className="cpa-autosave-alert" />
                <span>Save failed</span>
              </>
            )}
          </div>

          <button
            type="button"
            className="cpa-btn cpa-btn-secondary"
            onClick={handleRefreshRates}
            disabled={isRefreshingRates}
          >
            <RefreshCw size={14} className={isRefreshingRates ? 'cpa-spin' : ''} />
            <span>{isRefreshingRates ? 'Refreshing...' : 'Refresh Rates'}</span>
          </button>

          <button
            type="button"
            className={`cpa-btn ${autoSaveStatus === 'unsaved' || autoSaveStatus === 'error' ? 'cpa-btn-primary' : 'cpa-btn-secondary'}`}
            onClick={handleManualSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="cpa-spin" />
                <span>Saving...</span>
              </>
            ) : autoSaveStatus === 'saved' ? (
              <>
                <Check size={14} />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Status Notice */}
      {saveStatus.message && (
        <div className={`cpa-notice ${saveStatus.type === 'error' ? 'cpa-notice-error' : 'cpa-notice-success'}`}>
          {saveStatus.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* 2. Top Two-Column Grid: Exchange Rates & Price Simulator */}
      <div className="cpa-top-grid">
        {/* Exchange Rates Card */}
        <section className="cpa-card">
          <div className="cpa-card-header">
            <h2 className="cpa-card-title">
              <TrendingUp size={16} className="cpa-card-title-icon" /> Live Exchange Rates
            </h2>
            <span className="cpa-badge-subtle">
              {exchangeMeta?.cacheStatus || 'Active'}
            </span>
          </div>

          <div className="cpa-card-meta-inline">
            <span className="cpa-meta-item">
              <span>Provider:</span> <strong className="cpa-meta-strong">{providerDisplay}</strong>
            </span>
            <span className="cpa-meta-sep">·</span>
            <span className="cpa-meta-item">
              <span>Base Currency:</span> <strong className="cpa-meta-strong">INR (₹)</strong>
            </span>
            <span className="cpa-meta-sep">·</span>
            <span className="cpa-meta-item">
              <span>Updated:</span> <span className="cpa-meta-strong">{formattedLastUpdated}</span>
            </span>
            <span className="cpa-meta-sep">·</span>
            <span className="cpa-meta-item">
              <span>TTL:</span> <span className="cpa-meta-strong">6 Hours</span>
            </span>
          </div>

          <div className="cpa-rates-grid">
            {['USD', 'EUR', 'GBP', 'AED', 'SAR', 'QAR'].map((curr) => {
              const rate = exchangeRates?.[curr];
              const reversedRate = typeof rate === 'number' && rate > 0 ? 1 / rate : null;
              return (
                <div key={curr} className="cpa-rate-chip">
                  <span className="cpa-rate-chip-pair">{curr} → INR</span>
                  <span className="cpa-rate-chip-val">
                    {typeof reversedRate === 'number' ? `₹${reversedRate.toFixed(2)}` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Price Simulator Card */}
        <section className="cpa-card">
          <div className="cpa-card-header">
            <h2 className="cpa-card-title">
              <Calculator size={16} className="cpa-card-title-icon" /> Price Simulator
            </h2>
            <span style={{ fontSize: 'var(--admin-font-size-12, 0.75rem)', color: 'var(--admin-text-dim, #94a3b8)' }}>Preview calculation</span>
          </div>

          <div className="cpa-sim-inputs">
            <div className="cpa-field-group">
              <label htmlFor="cpa-base-price" className="cpa-label">Base Price (INR ₹)</label>
              <input
                id="cpa-base-price"
                type="number"
                className="cpa-input"
                value={previewBasePrice}
                onChange={(e) => setPreviewBasePrice(Math.max(0, Number(e.target.value) || 0))}
                min="0"
                step="100"
              />
            </div>

            <div className="cpa-field-group">
              <label htmlFor="cpa-preview-country" className="cpa-label">Target Country</label>
              <select
                id="cpa-preview-country"
                className="cpa-input cpa-select"
                value={previewCountryCode}
                onChange={(e) => setPreviewCountryCode(e.target.value)}
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clean Breakdown without nested card */}
          <div className="cpa-sim-breakdown">
            <div className="cpa-sim-row">
              <span>Base Product Price</span>
              <span className="cpa-sim-val">₹{previewBasePrice.toLocaleString('en-IN')}</span>
            </div>

            <div className="cpa-sim-row">
              <span>
                Country Markup ({previewCalculation.markupPercent > 0 ? `+${previewCalculation.markupPercent}%` : `${previewCalculation.markupPercent}%`})
              </span>
              <span className="cpa-sim-val">₹{previewCalculation.markedUpBasePrice.toLocaleString('en-IN')}</span>
            </div>

            <div className="cpa-sim-row">
              <span>
                Exchange Rate {previewCalculation.currency === 'INR' ? '(1 INR)' : `(1 ${previewCalculation.currency})`}
              </span>
              <span className="cpa-sim-val">
                {previewCalculation.currency === 'INR' 
                  ? '₹1.00' 
                  : (typeof previewCalculation.exchangeRate === 'number' && previewCalculation.exchangeRate > 0
                      ? `₹${(1 / previewCalculation.exchangeRate).toFixed(2)}`
                      : '—'
                    )
                }
              </span>
            </div>

            <div className="cpa-sim-row">
              <span>Standard Delivery / Shipping Fee</span>
              <span className="cpa-sim-val">
                {(() => {
                  const targetCountry = countries.find((c) => c.code === previewCountryCode) || countries[0];
                  const fee = Number(targetCountry?.shippingRate ?? targetCountry?.shippingFee ?? 0);
                  const unit = targetCountry?.shippingUnit || 'kg';
                  if (fee === 0) return 'FREE';
                  if (previewCalculation.currency === 'INR') return `₹${fee.toLocaleString('en-IN')} / ${unit}`;
                  if (typeof previewCalculation.exchangeRate === 'number' && previewCalculation.exchangeRate > 0) {
                    const loc = (fee * previewCalculation.exchangeRate).toFixed(2);
                    return `₹${fee.toLocaleString('en-IN')} / ${unit} (≈ ${previewCalculation.currencySymbol || previewCalculation.currency} ${loc} / ${unit})`;
                  }
                  return `₹${fee.toLocaleString('en-IN')} / ${unit}`;
                })()}
              </span>
            </div>

            <div className="cpa-sim-total">
              <span className="cpa-sim-total-label">Estimated Local Price</span>
              <span className="cpa-sim-total-val">{previewCalculation.formatted}</span>
            </div>
          </div>

          <p className="cpa-sim-footnote">
            Base product prices in the database remain unchanged.
          </p>
        </section>
      </div>

      {/* 3. Country Markup & Currency Table Card */}
      <section className="cpa-table-card">
        <div className="cpa-table-card-header">
          <div className="cpa-table-card-info">
            <h2 className="cpa-table-title">Country Configurations</h2>
            <p className="cpa-table-subtitle">
              Set country-specific markups and toggle localized storefront availability.
            </p>
          </div>

          {availablePresets.length > 0 && (
            <button
              type="button"
              className="cpa-btn cpa-btn-secondary"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={14} />
              <span>Add Country</span>
            </button>
          )}
        </div>

        <div className="cpa-table-wrap">
          <table className="cpa-table">
            <thead>
              <tr>
                <th>Country</th>
                <th>Currency</th>
                <th>Price Markup</th>
                <th>Delivery / Shipping</th>
                <th>Exchange Rate</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {countries.map((country) => {
                const currentRate = exchangeRates?.[country.currency] || (country.currency === 'INR' ? 1 : null);

                return (
                  <tr key={country.code}>
                    {/* Country Cell */}
                    <td>
                      <div className="cpa-country-cell">
                        <span className="cpa-flag" role="img" aria-label={country.name}>
                          {country.flag}
                        </span>
                        <div className="cpa-country-names">
                          <span className="cpa-country-name">{country.name}</span>
                          <span className="cpa-country-code">{country.code}</span>
                        </div>
                      </div>
                    </td>

                    {/* Currency Cell */}
                    <td>
                      <div className="cpa-curr-wrap">
                        <span className="cpa-curr-name">{country.currency} ({country.currencySymbol})</span>
                        {country.isBase && (
                          <span className="cpa-base-badge">
                            <Lock size={10} /> Base
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Markup Percentage Suffix Input */}
                    <td>
                      <div className="cpa-markup-input-wrap">
                        <input
                          type="number"
                          className="cpa-markup-input"
                          value={country.markupPercent}
                          onChange={(e) => handleMarkupChange(country.code, e.target.value)}
                          step="1"
                          disabled={country.isBase}
                          aria-label={`Markup for ${country.name}`}
                        />
                        <span className="cpa-markup-suffix">%</span>
                      </div>
                    </td>

                    {/* Delivery / Shipping Fee */}
                    <td>
                      <div className="cpa-shipping-cell-wrap">
                        <div className="cpa-shipping-controls-row">
                          <div className="cpa-shipping-input-wrap">
                            <span className="cpa-shipping-prefix">₹</span>
                            <input
                              type="number"
                              className="cpa-shipping-input"
                              value={country.shippingRate ?? country.shippingFee ?? (country.isBase ? 0 : '')}
                              onChange={(e) => handleShippingChange(country.code, e.target.value)}
                              placeholder={country.isBase ? '0 (Free)' : 'e.g. 1500'}
                              min="0"
                              step={country.shippingUnit === 'g' ? '0.1' : '50'}
                              aria-label={`Delivery rate for ${country.name}`}
                            />
                          </div>
                          <select
                            className="cpa-shipping-unit-select"
                            value={country.shippingUnit || 'kg'}
                            onChange={(e) => handleShippingUnitChange(country.code, e.target.value)}
                            aria-label={`Shipping unit for ${country.name}`}
                          >
                            <option value="kg">/ kg</option>
                            <option value="g">/ g</option>
                          </select>
                        </div>
                        <span className="cpa-shipping-converted">
                          {(() => {
                            const fee = Number(country.shippingRate ?? country.shippingFee ?? 0);
                            const unit = country.shippingUnit || 'kg';
                            if (fee === 0) return 'Free Delivery';
                            if (country.currency === 'INR') return `₹${fee} / ${unit}`;
                            const rate = exchangeRates?.[country.currency];
                            if (typeof rate === 'number' && rate > 0) {
                              const converted = (fee * rate).toFixed(2);
                              return `≈ ${country.currencySymbol || country.currency} ${converted} / ${unit}`;
                            }
                            return `₹${fee} / ${unit}`;
                          })()}
                        </span>
                      </div>
                    </td>

                    {/* Exchange Rate */}
                    <td>
                      <div className="cpa-fx-rate-cell">
                        {country.currency === 'INR' ? (
                          <span className="cpa-fx-rate-val">Base (₹1.00)</span>
                        ) : (
                          <>
                            <span className="cpa-fx-rate-base">1 {country.currency} = </span>
                            <span className="cpa-fx-rate-val">
                              {typeof currentRate === 'number' && currentRate > 0 
                                ? `₹${(1 / currentRate).toFixed(2)}` 
                                : '—'}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Switch Toggle (Replaces ugly HTML checkbox) */}
                    <td>
                      <div className="cpa-switch-wrap">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={country.enabled}
                          className={`cpa-switch ${country.enabled ? 'active' : ''}`}
                          onClick={() => handleToggleEnabled(country.code)}
                          disabled={country.isBase}
                          title={
                            country.isBase
                              ? 'Base country is permanently active'
                              : (country.enabled ? 'Click to disable' : 'Click to enable')
                          }
                        >
                          <span className="cpa-switch-thumb" />
                        </button>
                        <span className={`cpa-switch-label ${country.enabled ? 'active' : ''}`}>
                          {country.enabled ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      {!country.isBase && (
                        <button
                          type="button"
                          className="cpa-icon-btn"
                          onClick={() => handleRemoveCountry(country.code)}
                          title={`Remove ${country.name}`}
                          aria-label={`Remove ${country.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Add Supported Country Modal */}
      {showAddModal && (
        <div className="cpa-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="cpa-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cpa-modal-header">
              <h3 className="cpa-modal-title">Add Supported Country</h3>
              <button
                type="button"
                className="cpa-modal-close"
                onClick={() => setShowAddModal(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="cpa-modal-body">
              {/* Toggle Mode: Preset vs Custom */}
              <div style={{ display: 'flex', gap: 'var(--admin-space-2, 8px)', borderBottom: '1px solid var(--admin-border, #e2e8f0)', paddingBottom: 'var(--admin-space-2, 10px)' }}>
                <button
                  type="button"
                  className={`cpa-btn ${!isCustomMode ? 'cpa-btn-primary' : 'cpa-btn-secondary'}`}
                  style={{ fontSize: 'var(--admin-font-size-12, 0.75rem)', padding: 'var(--admin-space-1, 4px) var(--admin-space-2, 10px)' }}
                  onClick={() => setIsCustomMode(false)}
                >
                  Quick Presets
                </button>
                <button
                  type="button"
                  className={`cpa-btn ${isCustomMode ? 'cpa-btn-primary' : 'cpa-btn-secondary'}`}
                  style={{ fontSize: 'var(--admin-font-size-12, 0.75rem)', padding: 'var(--admin-space-1, 4px) var(--admin-space-2, 10px)' }}
                  onClick={() => setIsCustomMode(true)}
                >
                  Custom Country
                </button>
              </div>

              {!isCustomMode ? (
                <div className="cpa-field-group">
                  <label htmlFor="cpa-select-country" className="cpa-label">Select Country</label>
                  <select
                    id="cpa-select-country"
                    className="cpa-input cpa-select"
                    value={selectedPresetCode}
                    onChange={(e) => setSelectedPresetCode(e.target.value)}
                  >
                    <option value="">Choose a country...</option>
                    {availablePresets.map((preset) => (
                      <option key={preset.code} value={preset.code}>
                        {preset.flag} {preset.name} ({preset.currency} {preset.currencySymbol})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 'var(--admin-space-2, 8px)' }}>
                    <div className="cpa-field-group">
                      <label className="cpa-label">Country Name</label>
                      <input
                        type="text"
                        className="cpa-input"
                        placeholder="e.g. Germany"
                        value={customFields.name}
                        onChange={(e) => setCustomFields({ ...customFields, name: e.target.value })}
                      />
                    </div>
                    <div className="cpa-field-group">
                      <label className="cpa-label">Code (ISO)</label>
                      <input
                        type="text"
                        className="cpa-input"
                        placeholder="DE"
                        maxLength="3"
                        style={{ textTransform: 'uppercase' }}
                        value={customFields.code}
                        onChange={(e) => setCustomFields({ ...customFields, code: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 60px', gap: 'var(--admin-space-2, 8px)' }}>
                    <div className="cpa-field-group">
                      <label className="cpa-label">Currency Code</label>
                      <input
                        type="text"
                        className="cpa-input"
                        placeholder="EUR"
                        maxLength="4"
                        style={{ textTransform: 'uppercase' }}
                        value={customFields.currency}
                        onChange={(e) => setCustomFields({ ...customFields, currency: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="cpa-field-group">
                      <label className="cpa-label">Symbol</label>
                      <input
                        type="text"
                        className="cpa-input"
                        placeholder="€"
                        value={customFields.currencySymbol}
                        onChange={(e) => setCustomFields({ ...customFields, currencySymbol: e.target.value })}
                      />
                    </div>
                    <div className="cpa-field-group">
                      <label className="cpa-label">Flag</label>
                      <input
                        type="text"
                        className="cpa-input"
                        placeholder="🇩🇪"
                        value={customFields.flag}
                        onChange={(e) => setCustomFields({ ...customFields, flag: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="cpa-field-group">
                <label htmlFor="cpa-markup-percentage" className="cpa-label">Markup Percentage (%)</label>
                <div className="cpa-markup-input-wrap" style={{ width: '100%' }}>
                  <input
                    id="cpa-markup-percentage"
                    type="number"
                    className="cpa-markup-input"
                    value={customMarkup}
                    onChange={(e) => setCustomMarkup(e.target.value)}
                    placeholder="10"
                    style={{ textAlign: 'left', paddingRight: 'var(--admin-space-8, 2rem)' }}
                  />
                  <span className="cpa-markup-suffix">%</span>
                </div>
                <span style={{ fontSize: 'var(--admin-font-size-12, 0.75rem)', color: 'var(--admin-text-dim, #94a3b8)' }}>
                  Applied to the base INR product price before currency conversion.
                </span>
              </div>

              <div className="cpa-field-group">
                <label htmlFor="cpa-shipping-charge" className="cpa-label">Delivery / Shipping Charge (Rate & Unit)</label>
                <div className="cpa-shipping-controls-row" style={{ width: '100%', gap: '8px' }}>
                  <div className="cpa-shipping-input-wrap" style={{ flex: 1 }}>
                    <span className="cpa-shipping-prefix">₹</span>
                    <input
                      id="cpa-shipping-charge"
                      type="number"
                      className="cpa-shipping-input"
                      value={customShippingFee}
                      onChange={(e) => setCustomShippingFee(e.target.value)}
                      placeholder="0 for Free Delivery, or e.g. 1500"
                      min="0"
                      step={customShippingUnit === 'g' ? '0.1' : '50'}
                      style={{ textAlign: 'left', paddingLeft: '1.75rem' }}
                    />
                  </div>
                  <select
                    className="cpa-shipping-unit-select"
                    value={customShippingUnit}
                    onChange={(e) => setCustomShippingUnit(e.target.value)}
                    style={{ height: '38px', padding: '0.45rem 1.75rem 0.45rem 0.75rem' }}
                    aria-label="Shipping weight unit"
                  >
                    <option value="kg">per kilogram (/ kg)</option>
                    <option value="g">per gram (/ g)</option>
                  </select>
                </div>
                <span style={{ fontSize: 'var(--admin-font-size-12, 0.75rem)', color: 'var(--admin-text-dim, #94a3b8)' }}>
                  Delivery rate per unit weight. Select unit (kg or g) and enter price in INR. Enter 0 for Free Shipping.
                </span>
              </div>
            </div>

            <div className="cpa-modal-footer">
              <button
                type="button"
                className="cpa-btn cpa-btn-secondary"
                onClick={() => {
                  setShowAddModal(false);
                  setIsCustomMode(false);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cpa-btn cpa-btn-primary"
                disabled={!isCustomMode ? !selectedPresetCode : (!customFields.code || !customFields.name || !customFields.currency)}
                onClick={handleAddCountry}
              >
                Add Country
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

