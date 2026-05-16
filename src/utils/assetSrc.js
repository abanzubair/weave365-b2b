export function assetSrc(asset) {
  return typeof asset === 'string' ? asset : asset?.src || '';
}
