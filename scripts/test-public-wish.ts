import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { generatePublicWishAction } from '../src/app/felicitaciones/actions';
import { getWishSeoConfig, getAllWishSlugs, generateWishJsonLd } from '../src/lib/seo/wishes-seo-data';

async function testPublicWishEngine() {
  console.log('🧪 Testing Public Wish Generator & SEO Engine...');

  // 1. Test SEO Slugs & JSON-LD
  console.log('\n--- 1. Testing SEO Slugs & Schema.org ---');
  const slugs = getAllWishSlugs();
  console.log(`Total programmatic SEO slugs: ${slugs.length}`);
  if (slugs.length < 7) {
    throw new Error(`Expected at least 7 slugs, found ${slugs.length}`);
  }

  const sampleSlug = 'amigo-divertido';
  const config = getWishSeoConfig(sampleSlug);
  if (!config) throw new Error(`Slug ${sampleSlug} not found in catalog`);
  console.log(`Config for "${sampleSlug}": H1="${config.h1}", tone="${config.tone}", rel="${config.relationship}"`);

  const jsonLd = generateWishJsonLd(config);
  if (!Array.isArray(jsonLd) || jsonLd.length < 2) {
    throw new Error('Schema.org JSON-LD generation failed');
  }
  console.log('✅ Schema.org WebApplication + FAQPage generated successfully');

  // 2. Test Input Validation & Honeypot
  console.log('\n--- 2. Testing Validation & Honeypot ---');
  const emptyRes = await generatePublicWishAction({
    name: '',
    relationship: 'amigo/a',
    tone: 'divertido',
  });
  if (emptyRes.success) throw new Error('Expected validation error on empty name');
  console.log('✅ Empty name rejected correctly:', emptyRes.error);

  const honeypotRes = await generatePublicWishAction({
    name: 'SpamBot',
    relationship: 'amigo/a',
    tone: 'divertido',
    honeypot: 'http://spam.ru',
  });
  if (!honeypotRes.success) throw new Error('Honeypot should silently return success');
  console.log('✅ Honeypot silently trapped:', honeypotRes.wish);

  // 3. Test Wish Generation (Gemini or Contingency)
  console.log('\n--- 3. Testing AI Generation & Contingency Guarantee ---');
  const startTime = Date.now();
  const wishRes = await generatePublicWishAction({
    name: 'Carlos',
    relationship: 'amigo/a',
    tone: 'divertido',
    notes: 'Le encanta el pádel y siempre llega tarde',
  });
  const elapsedMs = Date.now() - startTime;

  if (!wishRes.success || !wishRes.wish) {
    throw new Error(`Wish generation failed: ${wishRes.error}`);
  }

  console.log(`⏱️ Wish generated in ${elapsedMs}ms:`);
  console.log(`"${wishRes.wish}"`);
  console.log(`Fallback used? ${wishRes.isContingency ? 'Yes (Contingency)' : 'No (AI generated)'}`);

  // 4. Test Multiple Tones
  console.log('\n--- 4. Testing Romántico / Emotivo Tone ---');
  const romanticRes = await generatePublicWishAction({
    name: 'Laura',
    relationship: 'pareja',
    tone: 'emotivo',
  });
  if (!romanticRes.success || !romanticRes.wish) {
    throw new Error('Romantic wish failed');
  }
  console.log(`Romantic result: "${romanticRes.wish}"`);
  console.log('✅ All tones working');

  // 5. Test Rate Limiting (Call until limit hit)
  console.log('\n--- 5. Testing Rate Limiting Defense ---');
  let hitLimit = false;
  for (let i = 0; i < 7; i++) {
    const res = await generatePublicWishAction({
      name: `TestUser${i}`,
      relationship: 'amigo/a',
      tone: 'casual',
    });
    if (!res.success && res.error?.includes('límite')) {
      hitLimit = true;
      console.log(`✅ Rate limit successfully triggered on attempt ${i + 1}: "${res.error}"`);
      break;
    }
  }
  if (!hitLimit) {
    throw new Error('Rate limit was expected to trigger after 6 requests');
  }

  console.log('\n🎉 ALL PUBLIC WISH TESTS PASSED!');
}

testPublicWishEngine()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
