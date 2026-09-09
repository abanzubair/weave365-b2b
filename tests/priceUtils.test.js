import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatMoney } from '../src/utils/priceUtils.js';

describe('formatMoney & GST calculation tests', () => {
  it('formats whole amounts without decimal places by default', () => {
    assert.equal(formatMoney(2340), '₹2,340');
    assert.equal(formatMoney(100), '₹100');
  });

  it('formats amounts with 2 decimal places when specified', () => {
    assert.equal(formatMoney(111.43, 2), '₹111.43');
    assert.equal(formatMoney(2228.57, 2), '₹2,228.57');
    assert.equal(formatMoney(111.4, 2), '₹111.40');
    assert.equal(formatMoney(111, 2), '₹111.00');
    assert.equal(formatMoney(0, 2), '₹0.00');
  });

  it('calculates 5% GST and base amount to 2 decimal places without rounding off to integer', () => {
    const netItems = 2340;
    const base = Number((netItems / 1.05).toFixed(2));
    const gst = Number((netItems - base).toFixed(2));

    assert.equal(base, 2228.57);
    assert.equal(gst, 111.43);
    assert.equal(base + gst, 2340);

    assert.equal(formatMoney(base, 2), '₹2,228.57');
    assert.equal(formatMoney(gst, 2), '₹111.43');
    assert.equal(formatMoney(base + gst, 2), '₹2,340.00');
  });
});
