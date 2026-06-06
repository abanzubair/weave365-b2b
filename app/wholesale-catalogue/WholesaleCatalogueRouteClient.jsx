'use client';

import { useEffect, useState } from 'react';

import { Catalog } from '../../src/CatalogPage.jsx';

const emptyConfigOptions = {
  categories: [],
  fabrics: [],
  weaves: [],
  priceRanges: [],
};

export default function WholesaleCatalogueRouteClient() {
  const [configOptions, setConfigOptions] = useState(emptyConfigOptions);

  useEffect(() => {
    let isActive = true;

    async function loadConfigOptions() {
      try {
        const { fetchConfigOptions } = await import('../../src/productData.js');
        const nextConfigOptions = await fetchConfigOptions();
        if (isActive) {
          setConfigOptions({
            ...emptyConfigOptions,
            ...(nextConfigOptions || {}),
          });
        }
      } catch (err) {
        console.error('Unable to load catalogue config:', err);
      }
    }

    void loadConfigOptions();
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <Catalog
      title="Wholesale Catalogue"
      categories={configOptions.categories}
      fabrics={configOptions.fabrics}
      weaves={configOptions.weaves}
      priceRanges={configOptions.priceRanges}
    />
  );
}
