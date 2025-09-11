export async function searchCex(context, query) {
  const page = await context.newPage();
  const results = [];

  try {
    // Navigate to search page
    await page.goto(`https://uk.webuy.com/search?stext=${encodeURIComponent(query)}`);
    
    // Wait for random time to avoid rate limiting
    await page.waitForTimeout(500 + Math.random() * 800);

    // Wait for results
    await page.waitForSelector('.product-list', { timeout: 10000 });

    // Extract product information
    const products = await page.$$('.product-list .product-item');
    
    for (let i = 0; i < Math.min(20, products.length); i++) {
      const product = products[i];
      
      const titleEl = await product.$('.product-title');
      const priceEl = await product.$('.price');
      const linkEl = await product.$('a.product-title');

      if (!titleEl || !priceEl || !linkEl) continue;

      const title = await titleEl.textContent();
      const priceText = await priceEl.textContent();
      const url = await linkEl.getAttribute('href');

      // Extract price value
      const priceMatch = priceText.match(/£(\d+\.?\d*)/);
      if (!priceMatch) continue;

      results.push({
        site: 'CEX',
        title: title.trim(),
        url: `https://uk.webuy.com${url}`,
        price: parseFloat(priceMatch[1]),
        currency: 'GBP'
      });
    }
  } catch (error) {
    console.error('Error scraping CEX:', error);
  } finally {
    await page.close();
  }

  return results;
}
