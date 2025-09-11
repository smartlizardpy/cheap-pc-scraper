# PC Part Finder with Auto-Price Updates

A single-file HTML PC part picker that auto-updates prices from CEX and eBay UK via GitHub Actions and Playwright.

## Setup

1. Fork this repository
2. Enable GitHub Pages:
   - Go to repository Settings > Pages
   - Set source to `main` branch
   - Note your Pages URL: `https://<username>.github.io/<repo-name>`
3. Update configuration:
   - In `scraper.mjs`: Set `BOT_CONTACT_URL` to your repo's issues URL
   - In `index.html`: Set `PAGES_BASE_URL` to your GitHub Pages URL

## Local Development

```bash
# Install dependencies
npm i
npx playwright install chromium --with-deps

# Run scraper locally
npm run scrape

# Test scraper (dry run)
npm run test
```

## Manual Price Updates

Two options:

1. GitHub UI: Actions tab > "PC Parts Price Scraper" > Run workflow

2. API trigger (replace values in angle brackets):
```bash
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer <your-github-pat>" \
  https://api.github.com/repos/<owner>/<repo>/dispatches \
  -d '{"event_type":"scrape_now","client_payload":{"sku":"rx6600-8g","query":"Radeon RX 6600 8GB"}}'
```

Note: Your Personal Access Token needs `repo` scope.

## Responsible Scraping Notes

This scraper follows responsible practices:

- Respects robots.txt and site ToS
- Uses clear bot identification via user-agent
- Implements random delays between requests (500-1300ms)
- Limits results to ~20 items per site
- Runs maximum every 6 hours via GitHub Actions
- Provides contact URL in user-agent string

## Adding New Parts

Edit `config/queries.json` to add new parts to track. Format:

```json
{
  "sku": "unique-id",
  "query": "Search Query",
  "category": "CPU|GPU|RAM|etc"
}
```
