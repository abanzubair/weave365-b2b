export const csvUrl =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRX1gaMx_CdSX-ozTHYarKfGNtsAsBTsvqvLoexBjR5FxEYiWVY3JlZKK6AD4g-KigjwOLOk5JvXDQ-/pub?gid=0&single=true&output=csv';

export const heroCsvUrl =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRX1gaMx_CdSX-ozTHYarKfGNtsAsBTsvqvLoexBjR5FxEYiWVY3JlZKK6AD4g-KigjwOLOk5JvXDQ-/pub?gid=1785758034&single=true&output=csv';


export const categoryCodes = {
  1: 'Saree',
  2: 'Suit',
  3: 'Dupatta',
  4: 'Lehenga',
  5: 'Fabric',
  6: 'Accessories',
};

export const serviceablePincodes = [
  '221001',
  '302001',
  '400001',
  '500001',
  '560001',
  '700001',
];

export const storeConfig = {
  name: import.meta.env.VITE_STORE_NAME || 'Weave365',
  subtitle: import.meta.env.VITE_STORE_SUBTITLE || 'WHOLESALE',
  email: import.meta.env.VITE_STORE_EMAIL || 'weave365@gmail.com',
  phone: import.meta.env.VITE_STORE_PHONE || '+918948489484',
  whatsapp: import.meta.env.VITE_STORE_WHATSAPP || '918948489484',
  minimumOrderValue: Number(import.meta.env.VITE_MIN_ORDER_VALUE || 10000),
};
