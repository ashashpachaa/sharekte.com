# Sharekte.com - SEO Quick Start Checklist

## ✅ IMMEDIATE ACTION ITEMS (This Week)

### 1. Verify Deployment

```bash
# Check if files are accessible
curl https://shareket.com/robots.txt
curl https://shareket.com/sitemap.xml
curl https://shareket.com/api/schema.json
curl https://shareket.com/api/seo/status
```

### 2. Google Search Console Setup

- [ ] Go to: https://search.google.com/search-console
- [ ] Add property: https://shareket.com
- [ ] Verify ownership (choose your preferred method)
- [ ] Click "Request indexing" for homepage
- [ ] Submit sitemap: https://shareket.com/sitemap.xml

### 3. Bing Webmaster Tools Setup

- [ ] Go to: https://www.bing.com/webmasters
- [ ] Add site: https://shareket.com
- [ ] Verify ownership
- [ ] Submit sitemap: https://shareket.com/sitemap.xml

### 4. Google Analytics Setup

- [ ] Create Google Analytics 4 property
- [ ] Get your Measurement ID (G-XXXXXXXXXX)
- [ ] Add tracking code to `index.html` in `<head>`
- [ ] Verify tracking is working (real-time reports)

**Add this to `index.html` head:**

```html
<!-- Google Analytics -->
<script
  async
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag("js", new Date());
  gtag("config", "G-XXXXXXXXXX");
</script>
```

### 5. Preferred Domain Setup

In Google Search Console:

- [ ] Go to Settings → Domains
- [ ] Choose: `shareket.com` OR `www.shareket.com` (pick one as primary)
- [ ] Set up 301 redirects if needed

### 6. Core Web Vitals Check

- [ ] Go to: https://pagespeed.web.dev/
- [ ] Test: https://shareket.com
- [ ] Test: https://shareket.com/companies
- [ ] Test: https://shareket.com/support
- [ ] Note any issues for optimization

---

## CONTENT OPTIMIZATION (Week 1-2)

### 7. Keyword Implementation

- [ ] Add H1 tags to pages (if not present)
- [ ] Include primary keywords in first paragraph
- [ ] Add 2-3 internal links with keyword anchor text
- [ ] Optimize image alt text with keywords

**Example H1 Tags to Add:**

```html
<!-- Homepage -->
<h1>Buy Ready-Made Companies Online - Global Business Formation</h1>

<!-- Companies Page -->
<h1>Ready-Made Companies for Sale - UK, Sweden, Germany & More</h1>

<!-- Support Page -->
<h1>Apostille Services, Embassy Attestation & Business Support</h1>
```

### 8. Meta Descriptions Review

- [ ] Homepage meta description (155-160 chars)
- [ ] Companies page meta description
- [ ] Support page meta description
- [ ] All should include main keywords

**Current Meta Descriptions:**

- Homepage: "Buy ready-made companies online with bank accounts..."
- Companies: "Browse hundreds of ready-made companies from UK, Sweden..."
- Support: "Apostille, legalization, embassy attestation, financial reports..."

### 9. Internal Linking Strategy

Add strategic links with good anchor text:

- [ ] Homepage → Companies (keyword: "browse ready-made companies")
- [ ] Companies → Support (keyword: "apostille services")
- [ ] Support → Homepage (keyword: "buy ready-made company")
- [ ] Service pages mention each other

### 10. Image Optimization

- [ ] Compress all images (tinypng.com)
- [ ] Add descriptive alt text to all images
- [ ] Use WebP format where possible
- [ ] Add loading="lazy" attribute for non-critical images

---

## LINK BUILDING (Week 2-4)

### 11. Business Directory Submission

Submit to these directories:

- [ ] Google Business Profile (priority!)
- [ ] Yelp
- [ ] Apple Maps
- [ ] LinkedIn Company Page
- [ ] Crunchbase
- [ ] PitchBook

**Critical: Google Business Profile**

- Add business name, address, phone
- Add categories: Business Services, Financial Services
- Add hours of operation
- Upload logo and photos

### 12. Local SEO for Dubai/UAE

- [ ] Add to UAE business directories
- [ ] Create content about UAE market
- [ ] Get listed in local supplier directories
- [ ] Request reviews on Google Business Profile

### 13. Content Marketing

- [ ] Create blog post: "How to Buy a Ready-Made Company" (500+ words)
- [ ] Create: "UK vs Swedish Companies - Comparison"
- [ ] Create: "Apostille Services Explained"
- [ ] Share on social media after publishing

---

## TECHNICAL SEO (Week 2-3)

### 14. Mobile Friendliness Verification

- [ ] Test on mobile: https://search.google.com/test/mobile-friendly
- [ ] Check all pages work on mobile
- [ ] Verify touch elements are properly sized
- [ ] Test on different screen sizes (375px, 768px, 1024px)

### 15. Fix Any Crawl Errors

In Google Search Console:

- [ ] Check "Coverage" report
- [ ] Fix any 404 errors
- [ ] Check for "Excluded" pages
- [ ] Resolve any "Error" pages

### 16. SSL/HTTPS Verification

- [ ] Confirm all pages use HTTPS (not HTTP)
- [ ] Check for mixed content warnings
- [ ] Verify SSL certificate is valid
- [ ] Test: https://www.ssllabs.com/ssltest/

### 17. Site Speed Optimization

Priority improvements:

- [ ] Minify CSS and JavaScript
- [ ] Enable gzip compression
- [ ] Use CDN for static assets
- [ ] Implement browser caching
- [ ] Optimize server response time

Run Lighthouse audit:

```bash
# In Chrome DevTools: F12 → Lighthouse → Analyze page load
# Target: 90+ score
```

---

## TRACKING & MONITORING (Week 1 Ongoing)

### 18. Set Up Dashboard

Create a monitoring dashboard with:

- [ ] Google Search Console data (impressions, clicks, CTR)
- [ ] Google Analytics (sessions, users, bounce rate)
- [ ] Keyword rankings (if using paid tools)
- [ ] Organic traffic growth

### 19. Create Keyword Tracking Sheet

Track these metrics weekly:

```
Keyword | Ranking | Position | Impressions | Clicks | CTR
"buy ready made company" | ? | ? | ? | ? | ?
"companies for sale online" | ? | ? | ? | ? | ?
"apostille services" | ? | ? | ? | ? | ?
```

### 20. Monthly SEO Reporting

Create a monthly report tracking:

- Organic traffic (Google Analytics)
- Keyword rankings (Search Console)
- New pages indexed
- Backlinks acquired
- Issues resolved

---

## KEYWORDS TO RANK FOR

### Priority Keywords (High Volume, Medium Difficulty)

1. buy ready made company
2. ready made companies for sale
3. company for sale online
4. offshore company formation
5. buy UK company

### Secondary Keywords (Medium Volume)

1. buy Swedish company
2. apostille services
3. company formation for non-residents
4. open company remotely
5. business setup without travel

### Long-tail Keywords (Low Volume, Easy)

1. "how to buy a ready made company"
2. "best countries to buy companies"
3. "apostille service UAE"
4. "company formation UK online"
5. "Swedish company registration"

---

## MONTHLY TASKS

Every month:

- [ ] Review Google Search Console data
- [ ] Check keyword rankings
- [ ] Review Google Analytics metrics
- [ ] Publish 1-2 new blog posts
- [ ] Build 2-3 backlinks
- [ ] Fix any technical issues
- [ ] Update content if needed
- [ ] Check Core Web Vitals

---

## QUARTERLY GOALS

Q1 2025:

- [ ] Get 1,000+ organic impressions/month
- [ ] Achieve #1 ranking for 1-2 primary keywords
- [ ] 50+ organic sessions/month
- [ ] Fix all Core Web Vitals issues

Q2 2025:

- [ ] Get 5,000+ organic impressions/month
- [ ] #1-3 ranking for 5+ keywords
- [ ] 200+ organic sessions/month
- [ ] 25+ backlinks from quality domains

Q3 2025:

- [ ] 10,000+ organic impressions/month
- [ ] #1-10 ranking for 20+ keywords
- [ ] 500+ organic sessions/month
- [ ] 50+ quality backlinks

---

## TOOLS YOU'LL NEED

### Free Tools

1. **Google Search Console** - Search performance
   URL: https://search.google.com/search-console

2. **Google Analytics 4** - Website traffic
   URL: https://analytics.google.com

3. **Google PageSpeed Insights** - Performance
   URL: https://pagespeed.web.dev

4. **Google Rich Results Test** - Structured data
   URL: https://search.google.com/test/rich-results

5. **Mobile-Friendly Test** - Mobile optimization
   URL: https://search.google.com/test/mobile-friendly

### Recommended Paid Tools (Optional)

1. **Semrush** - Comprehensive SEO ($99+/month)
2. **Ahrefs** - Backlink analysis ($99+/month)
3. **Moz Pro** - Keyword research ($99+/month)

---

## QUICK REFERENCE LINKS

### SEO File Locations

- Meta Tags: `/index.html`
- Robots.txt: `https://shareket.com/robots.txt`
- Sitemap: `https://shareket.com/sitemap.xml`
- Manifest: `https://shareket.com/manifest.json`
- Schema: `https://shareket.com/api/schema.json`
- SEO Utilities: `/client/lib/seo.ts`
- SEO Routes: `/server/routes/seo.ts`

### Important Google Tools

- Search Console: https://search.google.com/search-console/
- Analytics: https://analytics.google.com/
- Business Profile: https://business.google.com/
- Merchant Center: https://merchants.google.com/

### Bing & Others

- Bing Webmaster: https://www.bing.com/webmasters/
- Yandex Webmaster: https://webmaster.yandex.com/

---

## SUCCESS METRICS

Track these KPIs monthly:

| Metric               | Current | Target (3mo) | Target (6mo) |
| -------------------- | ------- | ------------ | ------------ |
| Monthly Impressions  | 0       | 5,000        | 20,000       |
| Monthly Clicks       | 0       | 500          | 2,000        |
| Avg CTR              | 0%      | 8-10%        | 10-12%       |
| Avg Position         | N/A     | 20           | 10           |
| Organic Sessions     | 0       | 500          | 2,000        |
| Bounce Rate          | N/A     | <60%         | <50%         |
| Avg Session Duration | N/A     | >2min        | >3min        |
| Pages/Session        | N/A     | >2           | >3           |

---

## TROUBLESHOOTING

### "Website not indexed"

- [ ] Submit URL directly in Search Console
- [ ] Check robots.txt allows the page
- [ ] Verify page is accessible (no 404)
- [ ] Wait 7-14 days for re-crawl

### "Low click-through rate"

- [ ] Review meta descriptions (too long/short?)
- [ ] Add relevant keywords to title
- [ ] Add power words: "Guide", "Best", "Top", "Free"
- [ ] Add emojis if appropriate

### "High bounce rate"

- [ ] Improve page loading speed
- [ ] Better align content with search intent
- [ ] Add more internal links
- [ ] Improve visual design
- [ ] Better mobile experience

### "Low rankings"

- [ ] Wait 3-6 months (new site)
- [ ] Build more backlinks
- [ ] Improve page quality/depth
- [ ] Better keyword targeting
- [ ] Improve on-page SEO

---

## FINAL CHECKLIST

Before launching SEO campaign:

- [ ] All meta tags implemented
- [ ] Robots.txt accessible
- [ ] Sitemap submitted
- [ ] Google Search Console verified
- [ ] Analytics tracking installed
- [ ] Mobile friendly verified
- [ ] SSL/HTTPS working
- [ ] Core Web Vitals acceptable
- [ ] Images optimized
- [ ] Internal links in place
- [ ] Keywords in H1, H2 tags
- [ ] Business directories updated

**Ready to Launch! 🚀**

---

**Questions?** Refer to `SEO_COMPREHENSIVE_GUIDE.md` for detailed information.

**Last Updated:** January 2025
