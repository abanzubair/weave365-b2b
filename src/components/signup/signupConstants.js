/**
 * @file signupConstants.js
 * @description Constants, options, and validation rules for Weave 365 signup & qualification flow.
 */

export const COUNTRY_DIAL_CODES = [
  // Primary & Top Diaspora / Export Markets
  { value: '+91', label: 'India (+91)' },
  { value: '+1', label: 'USA (+1)' },
  { value: '+44', label: 'UK (+44)' },
  { value: '+971', label: 'UAE (+971)' },
  { value: '+1', label: 'Canada (+1)' },
  { value: '+61', label: 'Australia (+61)' },
  { value: '+65', label: 'Singapore (+65)' },
  { value: '+60', label: 'Malaysia (+60)' },
  { value: '+974', label: 'Qatar (+974)' },
  { value: '+966', label: 'Saudi Arabia (+966)' },
  { value: '+965', label: 'Kuwait (+965)' },
  { value: '+968', label: 'Oman (+968)' },
  { value: '+973', label: 'Bahrain (+973)' },
  { value: '+64', label: 'New Zealand (+64)' },
  { value: '+27', label: 'South Africa (+27)' },
  { value: '+230', label: 'Mauritius (+230)' },
  { value: '+679', label: 'Fiji (+679)' },
  { value: '+1868', label: 'Trinidad & Tobago (+1868)' },
  { value: '+592', label: 'Guyana (+592)' },
  { value: '+597', label: 'Suriname (+597)' },

  // South Asia & Neighboring
  { value: '+977', label: 'Nepal (+977)' },
  { value: '+94', label: 'Sri Lanka (+94)' },
  { value: '+880', label: 'Bangladesh (+880)' },
  { value: '+92', label: 'Pakistan (+92)' },
  { value: '+975', label: 'Bhutan (+975)' },
  { value: '+960', label: 'Maldives (+960)' },

  // Europe
  { value: '+49', label: 'Germany (+49)' },
  { value: '+33', label: 'France (+33)' },
  { value: '+31', label: 'Netherlands (+31)' },
  { value: '+41', label: 'Switzerland (+41)' },
  { value: '+39', label: 'Italy (+39)' },
  { value: '+34', label: 'Spain (+34)' },
  { value: '+353', label: 'Ireland (+353)' },
  { value: '+46', label: 'Sweden (+46)' },
  { value: '+47', label: 'Norway (+47)' },
  { value: '+45', label: 'Denmark (+45)' },
  { value: '+32', label: 'Belgium (+32)' },
  { value: '+43', label: 'Austria (+43)' },
  { value: '+351', label: 'Portugal (+351)' },
  { value: '+30', label: 'Greece (+30)' },
  { value: '+48', label: 'Poland (+48)' },
  { value: '+420', label: 'Czech Republic (+420)' },
  { value: '+358', label: 'Finland (+358)' },
  { value: '+36', label: 'Hungary (+36)' },
  { value: '+40', label: 'Romania (+40)' },
  { value: '+352', label: 'Luxembourg (+352)' },

  // Asia & Pacific
  { value: '+852', label: 'Hong Kong (+852)' },
  { value: '+81', label: 'Japan (+81)' },
  { value: '+82', label: 'South Korea (+82)' },
  { value: '+886', label: 'Taiwan (+886)' },
  { value: '+66', label: 'Thailand (+66)' },
  { value: '+62', label: 'Indonesia (+62)' },
  { value: '+63', label: 'Philippines (+63)' },
  { value: '+84', label: 'Vietnam (+84)' },

  // Middle East & Africa
  { value: '+90', label: 'Turkey (+90)' },
  { value: '+20', label: 'Egypt (+20)' },
  { value: '+254', label: 'Kenya (+254)' },
  { value: '+234', label: 'Nigeria (+234)' },
  { value: '+233', label: 'Ghana (+233)' },
  { value: '+255', label: 'Tanzania (+255)' },
  { value: '+256', label: 'Uganda (+256)' },
  { value: '+212', label: 'Morocco (+212)' },
  { value: '+972', label: 'Israel (+972)' },
  { value: '+962', label: 'Jordan (+962)' },
  { value: '+961', label: 'Lebanon (+961)' },

  // Americas & Caribbean
  { value: '+52', label: 'Mexico (+52)' },
  { value: '+55', label: 'Brazil (+55)' },
  { value: '+54', label: 'Argentina (+54)' },
  { value: '+56', label: 'Chile (+56)' },
  { value: '+57', label: 'Colombia (+57)' },
  { value: '+51', label: 'Peru (+51)' },
  { value: '+1876', label: 'Jamaica (+1876)' },
  { value: '+1246', label: 'Barbados (+1246)' },
  { value: '+1242', label: 'Bahamas (+1242)' },
  { value: '+506', label: 'Costa Rica (+506)' },
  { value: '+507', label: 'Panama (+507)' },
];

export const countryCodes = COUNTRY_DIAL_CODES;

export const USER_TYPES = [
  {
    id: 'business',
    title: 'Business',
    description: 'I buy products for my business',
    badge: 'Wholesale & Bulk Buying',
  },
  {
    id: 'customer',
    title: 'Customer',
    description: 'I’m buying for personal use',
    badge: 'Personal Shopping',
  },
  {
    id: 'supplier',
    title: 'Supplier',
    description: 'I want to supply products to Weave 365',
    badge: 'Artisan & Manufacturer',
  },
];

export const BUSINESS_TYPES = [
  { id: 'wholesaler', label: 'Wholesaler', subtype: 'Wholesaler' },
  { id: 'exporter', label: 'Exporter', subtype: 'Exporter' },
  { id: 'importer', label: 'Importer', subtype: 'Importer' },
  { id: 'retail_store', label: 'Retail Store', subtype: 'Retail Store' },
  { id: 'boutique', label: 'Boutique', subtype: 'Boutique' },
  { id: 'designer', label: 'Designer', subtype: 'Designer' },
  { id: 'online_store', label: 'Online Store / eCommerce Website', subtype: 'Online Store' },
  { id: 'reseller', label: 'Reseller (Selling on Instagram / WhatsApp / Facebook)', subtype: 'Reseller' },
];

export const BUSINESS_EXPERIENCE_OPTIONS = [
  { id: 'not_started', label: "I haven't started yet" },
  { id: 'under_6_months', label: 'Less than 6 months' },
  { id: '6_to_12_months', label: '6 - 12 months' },
  { id: '1_to_3_years', label: '1 - 3 years' },
  { id: '3_plus_years', label: '3 + years' },
];

export const BUSINESS_BUDGET_OPTIONS = [
  { id: 'under_25k', label: 'Under ₹25,000' },
  { id: '25k_to_50k', label: '₹25,000 - ₹50,000' },
  { id: '50k_to_1lakh', label: '₹50,000 - ₹1 lakh' },
  { id: '1_to_5lakh', label: '₹1 - 5 lakh' },
  { id: '5lakh_plus', label: '₹5 lakh +' },
];

export const BUSINESS_SALES_CHANNELS = [
  { id: 'physical_store', label: 'Physical Store' },
  { id: 'popup_store', label: 'Pop-up Store' },
  { id: 'social_media', label: 'Instagram / WhatsApp / Facebook' },
  { id: 'own_website', label: 'Own Website / eCommerce Store' },
  { id: 'marketplace', label: 'Marketplace (Amazon, Flipkart, Meesho, etc.)' },
  { id: 'multiple_channels', label: 'Multiple Channels' },
  { id: 'not_started', label: "I haven't started selling yet" },
];

export const BUSINESS_PURCHASE_INTENT_OPTIONS = [
  { id: 'immediately', label: 'Immediately' },
  { id: 'within_7_days', label: 'Within 7 days' },
  { id: 'within_30_days', label: 'Within 30 days' },
  { id: 'more_than_30_days', label: 'More than 30 days' },
  { id: 'just_exploring', label: 'Just exploring' },
];

export const SUPPLIER_EXPERIENCE_OPTIONS = [
  'Less than 1 year',
  '1 - 3 years',
  '3 - 5 years',
  '5 - 10 years',
  '10 + years',
];

export const SUPPLIER_PRICE_RANGES = [
  '₹300 - ₹999',
  '₹1,000 - ₹1,999',
  '₹2,000 - ₹2,999',
  '₹3,000 - ₹4,999',
  '₹5,000 - ₹9,999',
  '₹10,000 +',
];

export const SUPPLIER_BUSINESS_TYPES = [
  'Cluster',
  'Weaver',
  'Distributor',
  'Wholesaler',
  'Retailer',
];

export const SUPPLIER_PRODUCTS = [
  'Sarees',
  'Suits',
  'Dupattas',
  'Lehengas',
  'Fabrics',
  'Home Furnishing',
];

export const SUPPLIER_WEAVING_TYPES = [
  'Powerloom',
  'Handloom',
];

export const SUPPLIER_CATALOGUE_SOURCES = [
  'We create our own catalogue',
  'We use catalogues available in the market',
  'We use both',
];

export const INITIAL_BUSINESS_FORM = {
  business_type: '',
  business_experience: '',
  monthly_budget: '',
  sales_channels: [],
  purchase_intent: '',
  website: '',
  social_handle: '',
};

export const INITIAL_SUPPLIER_FORM = {
  contact_person: '',
  business_name: '',
  location_city: '',
  has_gst: '', // 'Yes' | 'No'
  gstin: '',
  business_email: '',
  phone_country_code: '+91',
  phone: '',
  instagram: '',
  ecommerce_website: '',
  business_experience: '',
  wholesale_price_range: '',
  business_type: '',
  supplied_products: [],
  weaving_specialisation: [],
  manufacturing_location: '', // 'Varanasi' | 'Other City'
  other_city_name: '',
  single_piece_supply: '', // 'Yes' | 'No'
  repeat_supply: '', // 'Yes' | 'No'
  has_catalogue: '', // 'Yes' | 'No'
  catalogue_source: '',
};

/**
 * Validates the 5 questions for Business Qualification.
 * @param {typeof INITIAL_BUSINESS_FORM} form
 * @returns {{ isValid: boolean, error?: string, field?: string }}
 */
export function validateBusinessQualification(form) {
  if (!form?.business_type) {
    return {
      isValid: false,
      error: 'Please select what best describes your business.',
      field: 'business_type',
    };
  }
  if (!form?.business_experience) {
    return {
      isValid: false,
      error: 'Please select how long you have been in business.',
      field: 'business_experience',
    };
  }
  if (!form?.monthly_budget) {
    return {
      isValid: false,
      error: 'Please select your approximate monthly sourcing budget.',
      field: 'monthly_budget',
    };
  }
  if (!Array.isArray(form?.sales_channels) || form.sales_channels.length === 0) {
    return {
      isValid: false,
      error: 'Please select at least one sales channel where you sell.',
      field: 'sales_channels',
    };
  }
  if (!form?.purchase_intent) {
    return {
      isValid: false,
      error: 'Please select when you expect to place your first order.',
      field: 'purchase_intent',
    };
  }
  return { isValid: true };
}

/**
 * Validates the complete Supplier Onboarding Form.
 * @param {typeof INITIAL_SUPPLIER_FORM} form
 * @returns {{ isValid: boolean, error?: string, field?: string }}
 */
export function validateSupplierQualification(form) {
  // Business Information
  if (!form?.contact_person?.trim()) {
    return { isValid: false, error: 'Please enter Contact Person Name.', field: 'contact_person' };
  }
  if (!form?.business_name?.trim()) {
    return { isValid: false, error: 'Please enter Business Name.', field: 'business_name' };
  }
  if (!form?.location_city?.trim()) {
    return { isValid: false, error: 'Please enter Location / City.', field: 'location_city' };
  }
  if (!form?.has_gst) {
    return { isValid: false, error: 'Please select whether you have GST registration.', field: 'has_gst' };
  }
  if (form.has_gst === 'Yes') {
    const cleanGstin = String(form.gstin || '').trim();
    if (!cleanGstin) {
      return { isValid: false, error: 'Please enter your GSTIN number.', field: 'gstin' };
    }
    if (cleanGstin.length < 10) {
      return { isValid: false, error: 'Please enter a valid GSTIN number.', field: 'gstin' };
    }
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!form?.business_email?.trim() || !emailPattern.test(form.business_email.trim())) {
    return { isValid: false, error: 'Please enter a valid Business Email address.', field: 'business_email' };
  }

  const cleanPhone = String(form?.phone || '').replace(/\D/g, '').slice(0, 15);
  if (cleanPhone.length < 6 || cleanPhone.length > 15) {
    return { isValid: false, error: 'Please enter a valid Mobile / WhatsApp Number.', field: 'phone' };
  }

  if (!form?.instagram?.trim()) {
    return { isValid: false, error: 'Please enter your Instagram Account URL or handle.', field: 'instagram' };
  }

  if (!form?.business_experience) {
    return { isValid: false, error: 'Please select how long you have been in business.', field: 'business_experience' };
  }

  if (!form?.wholesale_price_range) {
    return { isValid: false, error: 'Please select your approximate wholesale price range.', field: 'wholesale_price_range' };
  }

  // Your Business
  if (!form?.business_type) {
    return { isValid: false, error: 'Please select what best describes your business.', field: 'business_type' };
  }

  if (!Array.isArray(form?.supplied_products) || form.supplied_products.length === 0) {
    return { isValid: false, error: 'Please select at least one product you supply.', field: 'supplied_products' };
  }

  if (!Array.isArray(form?.weaving_specialisation) || form.weaving_specialisation.length === 0) {
    return { isValid: false, error: 'Please select at least one weaving specialisation.', field: 'weaving_specialisation' };
  }

  if (!form?.manufacturing_location) {
    return { isValid: false, error: 'Please select where you manufacture / source your products.', field: 'manufacturing_location' };
  }

  if (form.manufacturing_location === 'Other City' && !form?.other_city_name?.trim()) {
    return { isValid: false, error: 'Please specify your manufacturing city.', field: 'other_city_name' };
  }

  // Supply Capability
  if (!form?.single_piece_supply) {
    return { isValid: false, error: 'Please select whether you offer single-piece supply.', field: 'single_piece_supply' };
  }

  if (!form?.repeat_supply) {
    return { isValid: false, error: 'Please select whether you can provide consistent repeat supply.', field: 'repeat_supply' };
  }

  // Product & Catalogue
  if (!form?.has_catalogue) {
    return { isValid: false, error: 'Please select whether you have a product catalogue for your website.', field: 'has_catalogue' };
  }

  if (!form?.catalogue_source) {
    return { isValid: false, error: 'Please select how you source or create your catalogue.', field: 'catalogue_source' };
  }

  return { isValid: true };
}
