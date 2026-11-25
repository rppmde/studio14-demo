# Cloudflare deployment preparation

Use Workers Static Assets for a new deployment. Build command: `python3 scripts/build-cloudflare.py`. Publish only `dist/`, not the repository root. No Node framework is needed. The output preserves the existing language directories and relative asset paths. Retain existing .html paths during the preview; choose HTML handling compatible with those paths (none for exact paths, or verify redirects). Do not redirect into a trailing-slash route that changes the relative asset base without testing.

The demo remains noindex (HTML, robots.txt, and X-Robots-Tag). Before production, reconcile canonical/hreflang URLs, redirect map and sitemap with actual domain and routes, remove demo indexing blocks, and test every language and booking flow. The booking form remains a demo. No DNS or live Cloudflare deployment has been performed.

Reference: https://developers.cloudflare.com/workers/static-assets/ ; https://developers.cloudflare.com/workers/static-assets/headers/ ; https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/
