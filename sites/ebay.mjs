export async function searchEbay(context, query) {
  const page = await context.newPage();
  const results = [];

  try {
    // Navigate to search page with filters for Buy It Now and condition
    const searchUrl = `https://www.ebay.co.uk/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_BIN=1&LH_ItemCondition=3000%7C7000&LH_SellerType=1`;
    await page.goto(searchUrl);

    // Wait for random time to avoid rate limiting
    await page.waitForTimeout(500 + Math.random() * 800);

    // Wait for results
    await page.waitForSelector('ul.srp-results', { timeout: 10000 });

    // Extract product information
    const products = await page.$$('li.s-item');

    for (let i = 0; i < Math.min(20, products.length); i++) {
      const product = products[i];

      // Skip the first item as it's usually a template
      if (i === 0) continue;

      const titleEl = await product.$('.s-item__title');
      const priceEl = await product.$('.s-item__price');
      const linkEl = await product.$('a.s-item__link');

      if (!titleEl || !priceEl || !linkEl) continue;

      const title = await titleEl.textContent();
      const priceText = await priceEl.textContent();
      const url = await linkEl.getAttribute('href');

      // Extract price value
      const priceMatch = priceText.match(/£(\d+\.?\d*)/);
      if (!priceMatch) continue;

      results.push({
        site: 'eBay',
        title: title.trim(),
        url: url,
        price: parseFloat(priceMatch[1]),
        currency: 'GBP'
      });
    }
  } catch (error) {
    console.error('Error scraping eBay:', error);
  } finally {
    await page.close();
  }

  return results;
}
