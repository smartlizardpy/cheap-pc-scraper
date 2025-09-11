import { chromium } from 'playwright';
import levenshtein from 'fast-levenshtein';
import { readFileSync, writeFileSync } from 'fs';
import { searchCex } from './sites/cex.mjs';
import { searchEbay } from './sites/ebay.mjs';

const BOT_CONTACT_URL = 'https://github.com/YOUR_USERNAME/YOUR_REPO/issues';
const SCORE_THRESHOLD = 0.62;

// Normalize text for comparison
const norm = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Calculate match score between target and candidate title
const scoreMatch = (target, title) => {
  const normTarget = norm(target);
  const normTitle = norm(title);
  const distance = levenshtein.get(normTarget, normTitle);
  const maxLength = Math.max(normTarget.length, normTitle.length);
  return 1 - (distance / maxLength);
};

async function main() {
  // Parse CLI args and env vars
  const args = process.argv.slice(2);
  const isDry = args.includes('--dry');
  const cliSku = args.find(a => a.startsWith('--sku=')).split('=')[1];
  const cliQuery = args.find(a => a.startsWith('--query=')).split('=')[1];
  const envSku = process.env.SKU;
  const envQuery = process.env.QUERY;

  // Load queries from config
  const queries = JSON.parse(readFileSync('./config/queries.json', 'utf-8'));
  const targetQueries = [];

  // Filter queries based on input parameters
  if (cliSku || envSku) {
    const sku = cliSku || envSku;
    const query = queries.find(q => q.sku === sku);
    if (query) targetQueries.push(query);
  } else if (cliQuery || envQuery) {
    targetQueries.push({ sku: 'custom', query: cliQuery || envQuery, category: 'CUSTOM' });
  } else {
    targetQueries.push(...queries);
  }

  if (targetQueries.length === 0) {
    console.log('No queries to process');
    process.exit(0);
  }

  // Launch browser
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: `OzanPriceBot/1.0 (+${BOT_CONTACT_URL})`
  });

  const results = [];

  // Process each query
  for (const { sku, query, category } of targetQueries) {
    console.log(`Processing: ${query} (${sku})`);

    // Gather results from all sites
    const [cexResults, ebayResults] = await Promise.all([
      searchCex(context, query),
      searchEbay(context, query)
    ]);

    // Combine and score results
    const allResults = [...cexResults, ...ebayResults]
      .map(item => ({
        ...item,
        score: scoreMatch(query, item.title)
      }))
      .filter(item => item.score >= SCORE_THRESHOLD && item.price > 0)
      .sort((a, b) => a.price - b.price);

    if (allResults.length === 0) {
      console.log(`No valid results found for: ${query}`);
      continue;
    }

    // Structure the results
    results.push({
      sku,
      query,
      category,
      best: allResults[0],
      alternatives: allResults.slice(1, 6)
    });
  }

  await browser.close();

  // Generate output
  const output = {
    generatedAt: new Date().toISOString(),
    items: results
  };

  if (!isDry) {
    writeFileSync('./data/prices.json', JSON.stringify(output, null, 2));
    console.log('Updated data/prices.json');
  } else {
    console.log('Dry run results:', JSON.stringify(output, null, 2));
  }
}

main().catch(console.error);
