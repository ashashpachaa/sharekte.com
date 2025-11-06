import { Router, type RequestHandler } from "express";

const router = Router();

// Serve robots.txt
export const robotsHandler: RequestHandler = (req, res) => {
  const robotsContent = `# Robots.txt for Shareket.com
# Allow search engines to crawl all public pages

User-agent: *
Allow: /
Allow: /companies
Allow: /support
Allow: /login
Allow: /signup
Allow: /ar/
Allow: /hi/
Disallow: /admin/
Disallow: /admin-login/
Disallow: /checkout
Disallow: /cart
Disallow: /dashboard/
Disallow: /api/
Disallow: /.env
Disallow: /node_modules/

# Specific rules for Googlebot
User-agent: Googlebot
Allow: /
Allow: /companies
Allow: /support

# Sitemap location
Sitemap: https://shareket.com/sitemap.xml

# Crawl delay (in seconds)
Crawl-delay: 1

# Request rate (pages per 10 seconds)
Request-rate: 30/10

# Search engine specific rules
User-agent: bingbot
Crawl-delay: 1

User-agent: Slurp
Crawl-delay: 2

# Block bad bots
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: DotBot
Disallow: /`;

  res.type("text/plain").send(robotsContent);
};

// Serve sitemap.xml
export const sitemapHandler: RequestHandler = (req, res) => {
  const baseUrl = process.env.APP_URL || "https://shareket.com";

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">
  
  <!-- Homepage - Highest Priority -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Language Variants -->
  <url>
    <loc>${baseUrl}/ar/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>${baseUrl}/hi/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Main Pages -->
  <url>
    <loc>${baseUrl}/companies</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>${baseUrl}/ar/companies</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>${baseUrl}/hi/companies</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>${baseUrl}/support</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>${baseUrl}/ar/support</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>${baseUrl}/hi/support</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>${baseUrl}/login</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <url>
    <loc>${baseUrl}/signup</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <url>
    <loc>${baseUrl}/cart</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  <url>
    <loc>${baseUrl}/checkout</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  <!-- Admin Pages (Low Priority) -->
  <url>
    <loc>${baseUrl}/admin/login</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>

</urlset>`;

  res.type("application/xml").send(sitemap);
};

// Serve sitemap index
export const sitemapIndexHandler: RequestHandler = (req, res) => {
  const baseUrl = process.env.APP_URL || "https://shareket.com";

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
  </sitemap>
</sitemapindex>`;

  res.type("application/xml").send(sitemapIndex);
};

// JSON-LD structured data for rich snippets
export const schemaHandler: RequestHandler = (req, res) => {
  const baseUrl = process.env.APP_URL || "https://shareket.com";

  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Sharekte",
    description: "Global platform for buying and selling ready-made companies",
    url: baseUrl,
    telephone: "+971505051790",
    email: "info@shareket.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Dubai",
      addressLocality: "Dubai",
      addressCountry: "AE",
    },
    logo: `${baseUrl}/logo.png`,
    image: `${baseUrl}/og-image.png`,
    sameAs: [
      "https://www.facebook.com/sharekte",
      "https://twitter.com/sharekte",
      "https://www.linkedin.com/company/sharekte",
      "https://www.instagram.com/sharekte",
    ],
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
  };

  res.json(schema);
};

// SEO status endpoint
export const seoStatusHandler: RequestHandler = (req, res) => {
  const baseUrl = process.env.APP_URL || "https://shareket.com";

  const seoStatus = {
    status: "ok",
    timestamp: new Date().toISOString(),
    checks: {
      robots_txt: `${baseUrl}/robots.txt`,
      sitemap_xml: `${baseUrl}/sitemap.xml`,
      sitemap_index: `${baseUrl}/sitemap_index.xml`,
      schema_json: `${baseUrl}/api/schema.json`,
      app_url: baseUrl,
      ssl_enabled: baseUrl.startsWith("https"),
      mobile_friendly: true,
      structured_data: true,
      hreflang_tags: ["en", "ar", "hi"],
    },
    keywords: {
      english: [
        "buy ready made company",
        "ready made companies for sale",
        "offshore company formation",
        "company for sale online",
        "buy UK company",
      ],
      arabic: ["شراء شركة جاهزة", "شركات جاهزة للبيع", "تأسيس شركة عن بُعد"],
      hindi: [
        "तैयार कंपनी खरीदें",
        "बेचने के लिए तैयार कंपनियाँ",
        "ऑनलाइन कंपनी खरीदें",
      ],
    },
  };

  res.json(seoStatus);
};

export default router;
