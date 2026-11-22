# Studio 14: Cloudflare staging build

Builds the existing EN/RU/HY static HTML into canonical routes for Cloudflare Workers Static Assets.
English: /tattoo/ ; Russian: /ru/tattoo/ ; Armenian: /hy/tattoo/ .
All shared images, scripts and styles use absolute /assets/, /js/, /css/ URLs.

## Safe review

Run Node.js 20+ and use: npm run build
With Cloudflare CLI installed and authenticated: cf deploy ./dist
Default output is NOINDEX and should be used only for preview/review, not the live business domain.

## Production prerequisites

1. Connect and verify the live domain and DNS.
2. Replace the DEMO booking form with a verified server-side service that accepts attachments and sends reliable email.
3. Validate canonical URLs, schema, hreflang, SEO copy, privacy and image licensing.
4. After approval build with: SITE_PRODUCTION=1 npm run build . This creates production robots.txt and sitemap.xml.
5. Test all languages and mobile routes on the actual Cloudflare preview before switching real traffic.

Generated dist/ must not be committed. No Cloudflare deployment was done by these files.

Docs: https://developers.cloudflare.com/cf/projects/
Docs: https://developers.cloudflare.com/workers/static-assets/
