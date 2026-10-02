import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { classifyTraffic, extractBrandFromHost } from '../src/utils/universalClassifier.js';
import { resolveBuyerAcquisition } from '../src/utils/acquisitionResolver.js';

describe('Universal Traffic Classifier Tests', () => {
  test('Classifies Claude AI via HTTP Referrer', () => {
    const res = classifyTraffic({
      referrer: 'https://claude.ai/chat/abc-123',
      path: '/dropshipping'
    });

    assert.equal(res.category, 'AI Assistant');
    assert.equal(res.name, 'Claude AI');
    assert.equal(res.type, 'ai');
    assert.equal(res.landing_path, '/dropshipping');
    assert.ok(res.inferred_intent.includes('Claude AI'));
  });

  test('Classifies Google Gemini via HTTP Referrer', () => {
    const res = classifyTraffic({
      referrer: 'https://gemini.google.com/app',
      path: '/custom-weaving'
    });

    assert.equal(res.category, 'AI Assistant');
    assert.equal(res.name, 'Google Gemini');
    assert.equal(res.type, 'ai');
    assert.equal(res.landing_path, '/custom-weaving');
  });

  test('Classifies Claude with stripped referrer but query ref parameter', () => {
    const res = classifyTraffic({
      referrer: '',
      searchParams: '?ref=claude',
      path: '/dropshipping'
    });

    assert.equal(res.category, 'AI Assistant');
    assert.equal(res.name, 'Claude AI');
    assert.equal(res.type, 'ai');
  });

  test('Classifies Gemini with stripped referrer but source parameter', () => {
    const res = classifyTraffic({
      referrer: '',
      searchParams: '?source=gemini',
      path: '/dropshipping'
    });

    assert.equal(res.category, 'AI Assistant');
    assert.equal(res.name, 'Gemini AI');
    assert.equal(res.type, 'ai');
  });

  test('Dynamically classifies unknown future AI tools by .ai TLD without hardcoding', () => {
    const res = classifyTraffic({
      referrer: 'https://app.synthetica-neural.ai/agent',
      path: '/dropshipping'
    });

    assert.equal(res.category, 'AI Assistant');
    assert.equal(res.name, 'Synthetica Neural AI');
    assert.equal(res.type, 'ai');
  });

  test('Classifies Perplexity and DeepSeek AI', () => {
    const perplexity = classifyTraffic({
      referrer: 'https://www.perplexity.ai/search?q=banarasi+saree',
      path: '/resell-sarees-online'
    });
    assert.equal(perplexity.category, 'AI Assistant');
    assert.equal(perplexity.name, 'Perplexity AI');

    const deepseek = classifyTraffic({
      referrer: 'https://chat.deepseek.com/',
      path: '/catalogue'
    });
    assert.equal(deepseek.category, 'AI Assistant');
    assert.equal(deepseek.name, 'DeepSeek AI');
  });

  test('Detects Dark Traffic on deep route with stripped referrer', () => {
    const res = classifyTraffic({
      referrer: '',
      path: '/dropshipping'
    });

    assert.equal(res.category, 'Direct / App Link');
    assert.equal(res.name, 'Dark App Link (Referrer Stripped)');
    assert.equal(res.type, 'direct');
    assert.equal(res.is_dark_traffic, true);
    assert.ok(res.inferred_intent.includes('stripped referrer'));
  });

  test('Distinguishes True Direct Homepage arrival', () => {
    const res = classifyTraffic({
      referrer: '',
      path: '/'
    });

    assert.equal(res.category, 'Direct / App');
    assert.equal(res.name, 'Direct Visit');
    assert.equal(res.type, 'direct');
    assert.equal(res.is_dark_traffic, false);
  });

  test('Detects Instagram In-App Webview even when referrer is stripped', () => {
    const res = classifyTraffic({
      referrer: '',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Instagram 300.0.0',
      path: '/saree/102032'
    });

    assert.equal(res.category, 'Social Media');
    assert.equal(res.name, 'Instagram In-App');
    assert.equal(res.type, 'social');
    assert.equal(res.is_webview, true);
  });

  test('Dynamically resolves arbitrary external websites as Referral Website', () => {
    const res = classifyTraffic({
      referrer: 'https://handloom-textiles-insider.org/article/123',
      path: '/saree/102008'
    });

    assert.equal(res.category, 'Referral Website');
    assert.equal(res.name, 'handloom-textiles-insider.org');
    assert.equal(res.brand, 'Handloom Textiles Insider');
    assert.equal(res.type, 'referral');
  });
});

describe('Acquisition Resolver Tests', () => {
  test('Resolves buyer acquisition directly from profile acquisition object', () => {
    const profile = {
      id: 'test-user-1',
      full_name: 'Test Buyer',
      acquisition: {
        category: 'AI Assistant',
        name: 'ChatGPT',
        type: 'ai',
        landing_path: '/dropshipping'
      }
    };

    const res = resolveBuyerAcquisition(profile, []);
    assert.equal(res.cleanName, 'ChatGPT');
    assert.equal(res.type, 'ai');
    assert.equal(res.icon, '🤖');
    assert.equal(res.badgeClass, 'badge-attr-ai');
    assert.equal(res.landingPath, '/dropshipping');
  });

  test('Correlates profile with site_analytics based on time and proximity', () => {
    const profile = {
      id: 'test-user-2',
      full_name: 'Utkarsh Boss',
      city: 'Rudrapur',
      created_at: '2026-10-02T03:47:25.000Z'
    };

    const analytics = [
      {
        id: 'visit-1',
        referrer: 'https://chatgpt.com/',
        path: '/dropshipping',
        city: 'Haldwani',
        source_name: 'ChatGPT',
        source_category: 'AI Assistant',
        created_at: '2026-10-02T03:46:42.000Z'
      }
    ];

    const res = resolveBuyerAcquisition(profile, analytics);
    assert.equal(res.cleanName, 'ChatGPT');
    assert.equal(res.type, 'ai');
    assert.equal(res.icon, '🤖');
    assert.equal(res.landingPath, '/dropshipping');
    assert.equal(res.matched_via_correlation, true);
  });
});
