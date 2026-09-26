import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  SEED_REVIEWS,
  getReviewStats,
  generateReviewsJsonLd,
  fetchServiceReviews,
} from '../src/data/reviewsData.js';
import { siteUrl } from '../src/config.js';

describe('Wholesale Buyer Reviews & SEO Schema System', () => {

  test('Requirement 1: SEED_REVIEWS integrity and backward compatibility', () => {
    assert(Array.isArray(SEED_REVIEWS), 'SEED_REVIEWS must be an array');
    assert(SEED_REVIEWS.length >= 4, 'Must have all authentic verified wholesale reviews');

    // Ensure the original 4 seed reviews are preserved
    const expectedOriginalIds = ['seed-1', 'seed-2', 'seed-3', 'seed-4'];
    expectedOriginalIds.forEach((id) => {
      const found = SEED_REVIEWS.find((r) => r.id === id);
      assert(found, `Original seed review ${id} must exist in reviews data`);
      assert(found.reviewer_name, `${id} must have reviewer_name`);
      assert(found.business_name, `${id} must have business_name`);
      assert(found.comment && found.comment.length > 20, `${id} must have detailed comment`);
      assert.strictEqual(found.rating, 5, `${id} must have 5-star rating`);
    });

    // Check all reviews for required fields and B2B context
    SEED_REVIEWS.forEach((rev, idx) => {
      assert(rev.id, `Review at index ${idx} must have an id`);
      assert(rev.reviewer_name, `Review at index ${idx} must have a reviewer_name`);
      assert(rev.business_name, `Review at index ${idx} must have a business_name`);
      assert(rev.rating >= 1 && rev.rating <= 5, `Review ${rev.id} rating must be between 1 and 5`);
      assert(rev.title && rev.title.trim().length > 0, `Review ${rev.id} must have a title`);
      assert(rev.comment && rev.comment.trim().length >= 20, `Review ${rev.id} comment must be substantive`);
      assert(rev.created_at, `Review ${rev.id} must have a created_at date`);
      assert.strictEqual(rev.verified, true, `Review ${rev.id} must have verified: true`);
    });
  });

  test('Requirement 2: Geographic & persona diversity for trust and LLM grounding', () => {
    // Reviews should cover key saree retail centers in India (Hyderabad, Bangalore, Surat, Delhi)
    const cities = SEED_REVIEWS.map((r) => r.city).filter(Boolean);
    const uniqueCities = new Set(cities);
    assert(uniqueCities.size >= 4, 'Reviews should cover diverse retail hubs across India');

    // Reviews should mention authentic B2B keywords that LLMs can cite
    const combinedText = SEED_REVIEWS.map((r) => `${r.title} ${r.comment}`).join(' ').toLowerCase();
    assert(combinedText.includes('katan silk') || combinedText.includes('silk'), 'Must mention silk authenticity');
    assert(combinedText.includes('varanasi') || combinedText.includes('weavers'), 'Must mention Varanasi weavers');
    assert(combinedText.includes('wholesale'), 'Must mention wholesale');
    assert(combinedText.includes('pricing') || combinedText.includes('margins') || combinedText.includes('price'), 'Must mention pricing');
    assert(combinedText.includes('packaging') || combinedText.includes('transit'), 'Must mention safe transit / packaging');
  });

  test('Requirement 3: getReviewStats calculations and fallbacks', () => {
    const stats = getReviewStats(SEED_REVIEWS);
    assert.strictEqual(typeof stats.avgRating, 'string');
    assert.strictEqual(stats.avgRating, '5.0', 'Average rating aligns with real verified buyer ratings');
    assert.strictEqual(stats.verifiedCount, SEED_REVIEWS.length);
    assert.strictEqual(stats.totalCommunityCount, SEED_REVIEWS.length, 'Community count reflects actual verified reviews');
    assert(stats.directWeaverGuarantee.includes('100% Varanasi Handloom'));

    // Safe fallback on empty input
    const emptyStats = getReviewStats([]);
    assert.strictEqual(emptyStats.verifiedCount, SEED_REVIEWS.length, 'Falls back to SEED_REVIEWS on empty array');
    assert.strictEqual(emptyStats.avgRating, '5.0', 'Falls back safely to 5.0');
  });

  test('Requirement 4: generateReviewsJsonLd generates valid Schema.org structure with dual Store and Product rich snippet support', () => {
    const jsonLd = generateReviewsJsonLd(SEED_REVIEWS, 'https://weave365.com');

    // Root context and graph
    assert.strictEqual(jsonLd['@context'], 'https://schema.org');
    assert(Array.isArray(jsonLd['@graph']), 'Must return a valid @graph of entities');

    // 1. Store entity
    const storeNode = jsonLd['@graph'].find((n) => n['@type'] === 'Store');
    assert(storeNode, 'Graph must contain Store entity');
    assert.strictEqual(storeNode['@id'], 'https://weave365.com/#store');
    assert.strictEqual(storeNode.name, 'Weave 365 Wholesale');
    assert(storeNode.aggregateRating, 'Store must include aggregateRating');
    assert.strictEqual(storeNode.aggregateRating['@type'], 'AggregateRating');
    assert.strictEqual(storeNode.aggregateRating.ratingValue, '5.0');
    assert.strictEqual(storeNode.aggregateRating.bestRating, '5');
    assert.strictEqual(storeNode.aggregateRating.worstRating, '1');
    assert.strictEqual(Number(storeNode.aggregateRating.reviewCount), SEED_REVIEWS.length);

    // 2. Product entity for Google Search rich snippet star ratings
    const productNode = jsonLd['@graph'].find((n) => n['@type'] === 'Product');
    assert(productNode, 'Graph must contain Product entity to satisfy Google review snippet guidelines');
    assert.strictEqual(productNode['@id'], 'https://weave365.com/#wholesale-saree-collection');
    assert(productNode.name.includes('Sarees'), 'Product entity must identify wholesale sarees collection');
    assert(productNode.brand && productNode.brand.name === 'Weave 365', 'Must include Brand');
    assert(productNode.offers && productNode.offers['@type'] === 'AggregateOffer', 'Must include AggregateOffer');
    assert.strictEqual(productNode.aggregateRating.ratingValue, '5.0');
    assert.strictEqual(Number(productNode.aggregateRating.reviewCount), SEED_REVIEWS.length);
    assert(Array.isArray(productNode.review), 'Product entity must include review array');
    assert(productNode.review.length > 0, 'Review array must not be empty');

    // Check review item structure
    const firstReview = productNode.review[0];
    assert.strictEqual(firstReview['@type'], 'Review');
    assert.strictEqual(firstReview.author['@type'], 'Person');
    assert(firstReview.author.name, 'Review author must have name');
    assert(firstReview.reviewBody, 'Review must have reviewBody');
    assert(firstReview.reviewRating, 'Review must have reviewRating');
    assert.strictEqual(firstReview.reviewRating['@type'], 'Rating');
    assert.strictEqual(firstReview.reviewRating.bestRating, '5');
    assert.strictEqual(firstReview.publisher['@type'], 'Organization');
    assert.strictEqual(firstReview.itemReviewed['@type'], 'Product');
  });

  test('Requirement 5: fetchServiceReviews safe fallback without throwing', async () => {
    const reviews = await fetchServiceReviews();
    assert(Array.isArray(reviews), 'fetchServiceReviews must return an array');
    assert(reviews.length >= SEED_REVIEWS.length, 'Must return at least all seed reviews');
  });

  test('Requirement 6: Review normalization handles dynamic and missing fields gracefully', async () => {
    const stats = getReviewStats(SEED_REVIEWS);
    assert.strictEqual(stats.satisfactionRate, '100%');
    assert.strictEqual(stats.totalCommunityCount, SEED_REVIEWS.length);

    // When reviews contain dynamic ratings, avgRating reflects calculation safely
    const customReviews = [
      { rating: 5, reviewer_name: 'Test 1' },
      { rating: 5, reviewer_name: 'Test 2' },
    ];
    const customStats = getReviewStats(customReviews);
    assert.strictEqual(typeof customStats.avgRating, 'string');
    assert.strictEqual(customStats.verifiedCount, 2);
  });

  test('Requirement 7: Homepage reviews slider fulfills distilled styling requirements', () => {
    const sliderCode = fs.readFileSync(path.resolve('src/components/HomeReviewsSlider.jsx'), 'utf-8');
    const cssCode = fs.readFileSync(path.resolve('src/styles/reviews.css'), 'utf-8');

    // 1. "VERIFIED" badge and ShieldCheck icon must be removed from cards
    assert(!sliderCode.includes('ShieldCheck'), 'ShieldCheck icon must not be imported or used in HomeReviewsSlider');
    assert(!sliderCode.includes('home-review-verified-tag'), 'home-review-verified-tag class must be removed');
    assert(!sliderCode.includes('VERIFIED'), 'VERIFIED text must be removed from review cards');

    // 2. Subtitle shortened by 2 or 3 words
    assert(!sliderCode.includes('Direct feedback from boutique curators and apparel retailers'), 'Original long subtitle should be shortened');
    assert(
      sliderCode.includes('Feedback from boutique curators and retailers sourcing from our Varanasi looms.') ||
      sliderCode.includes('Feedback from boutiques and retailers sourcing from our Varanasi looms.'),
      'Subtitle must be shortened by 2 or 3 words'
    );

    // 3. Marquee animation speed reduced further (duration between 110s and 125s)
    const durationMatch = cssCode.match(/homeReviewsMarqueeScroll\s+(\d+)s/);
    assert(durationMatch, 'homeReviewsMarqueeScroll animation duration must be defined');
    const durationSec = parseInt(durationMatch[1], 10);
    assert(durationSec >= 110 && durationSec <= 125, `Animation duration should be between 110s and 125s (found ${durationSec}s)`);

    // 4. Hover pause enabled for marquee track, while cards remain completely flat (no hover popup/lift/highlight)
    assert(cssCode.includes('.home-reviews-marquee-wrap:hover .home-reviews-marquee-track'), 'Marquee track must pause when wrap or cards are hovered');
    assert(cssCode.includes('animation-play-state: paused'), 'animation-play-state: paused must be applied on hover');
    assert(!cssCode.includes('.home-review-card-distill:hover'), 'No card hover elevation/shadow/popup rule should exist');
    assert(!sliderCode.includes('isPaused'), 'React isPaused state should not exist (handled purely via CSS)');
    assert(!sliderCode.includes('is-paused'), 'is-paused class should not exist in HomeReviewsSlider');
    assert(!cssCode.includes('.home-reviews-marquee-track.is-paused'), 'No is-paused CSS rule should exist');
  });
});
