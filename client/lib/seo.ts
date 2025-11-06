import { useEffect } from 'react';

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterHandle?: string;
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  robots?: string;
  hreflangAlternates?: Array<{ lang: string; href: string }>;
  structuredData?: Record<string, any>;
}

const SEO_KEYWORDS = {
  general: [
    'buy ready made company',
    'buy established company',
    'ready made companies for sale',
    'company for sale online',
    'offshore company formation',
    'company formation for non-residents',
    'buy UK company',
    'buy Swedish company',
    'business setup without travel',
    'open company remotely',
    'ready made LLC',
    'international company for sale',
    'global company formation',
    'buy shelf company',
    'start business in Europe',
    'company with bank account for sale',
    'apostille services',
    'embassy attestation',
    'business financial reports',
    'open international bank account'
  ],
  country: [
    'buy UK company online',
    'UK ready made company',
    'Sweden ready made company',
    'Swedish company for sale',
    'buy US company online',
    'Canada company formation',
    'Germany company for sale',
    'Italy company for sale',
    'Finland company formation',
    'Denmark company formation',
    'Austria ready made company',
    'Switzerland company setup'
  ],
  services: [
    'apostille and legalization',
    'embassy attestation service',
    'financial statements for company',
    'international business support',
    'open business bank account',
    'virtual office service',
    'nominee director service',
    'company management service'
  ]
};

const SEO_KEYWORDS_AR = {
  general: [
    'شراء شركة جاهزة',
    'شركات جاهزة للبيع',
    'تأسيس شركة عن بُعد',
    'تأسيس شركة بدون سفر',
    'شركات جاهزة للتملك',
    'تأسيس شركة لغير المقيمين',
    'تأسيس شركات في أوروبا',
    'شراء شركة في إنجلترا',
    'شراء شركة في السويد',
    'شراء شركة اونلاين',
    'تأسيس شركات عالمية',
    'فتح شركة في الخارج',
    'خدمات رجال الأعمال',
    'شركات جاهزة مع حساب بنكي',
    'تأسيس شركة دولية'
  ],
  country: [
    'شركة جاهزة في إنجلترا',
    'شركة جاهزة في السويد',
    'تأسيس شركة في أمريكا',
    'تأسيس شركة في كندا',
    'تأسيس شركة في ألمانيا',
    'تأسيس شركة في إيطاليا',
    'تأسيس شركة في فنلندا',
    'تأسيس شركة في الدنمارك',
    'تأسيس شركة في النمسا',
    'تأسيس شركة في سويسرا'
  ],
  services: [
    'خدمة الأبوستيل',
    'خدمة تصديق السفارات',
    'إعداد القوائم المالية',
    'فتح حساب بنكي دولي',
    'خدمات المحاسبة للشركات',
    'خدمة المكتب الافتراضي',
    'خدمة المدير المرشح',
    'إدارة الشركات الدولية'
  ]
};

const SEO_KEYWORDS_HI = {
  general: [
    'तैयार कंपनी खरीदें',
    'बेचने के लिए तैयार कंपनियाँ',
    'स्थापित कंपनी खरीदें',
    'ऑनलाइन कंपनी खरीदें',
    'विदेशी कंपनी रजिस्ट्रेशन',
    'गैर-निवासियों के लिए कंपनी स्थापना',
    'ऑनलाइन कंपनी शुरू करें',
    'यूरोप में कंपनी शुरू करें',
    'रेडीमेड कंपनी बिक्री के लिए',
    'कंपनी पंजीकरण बिना यात्रा',
    'ऑफशोर कंपनी फॉर्मेशन',
    'कंपनी के साथ बैंक खाता',
    'अंतर्राष्ट्रीय कंपनी बिक्री के लिए',
    'कंपनी ऑनलाइन खोलें'
  ],
  country: [
    'यूके कंपनी खरीदें',
    'स्वीडिश कंपनी खरीदें',
    'यूके रेडीमेड कंपनी',
    'स्वीडन कंपनी बिक्री क��� लिए',
    'यूएसए कंपनी खरीदें',
    'कनाडा कंपनी रजिस्ट्रेशन',
    'जर्मनी कंपनी फॉर्मेशन',
    'इटली कंपनी खरीदें',
    'फिनलैंड कंपनी स्थापना',
    'डेनमार्क कंपनी फॉर्मेशन',
    'ऑस्ट्रिया कंपनी बिक्री के लिए',
    'स्विट्ज़रलैंड कंपनी रजिस्ट्रेशन'
  ],
  services: [
    'अपोस्टिल सेवा',
    'दूतावास सत्यापन सेवा',
    'वित्तीय रिपोर्ट सेवा',
    'बिज़नेस बैंक खाता खोलें',
    'वर्चुअल ऑफिस सेवा',
    'नोमीनी डायरेक्टर सेवा',
    'कंपनी प्रबंधन सेवा',
    'अंतर्राष्ट्रीय व्यापार सहायता'
  ]
};

export function useSEO(metadata: SEOMetadata, language: string = 'en') {
  useEffect(() => {
    // Update title
    document.title = metadata.title;

    // Remove and re-add meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      let tag = document.querySelector(
        isProperty
          ? `meta[property="${name}"]`
          : `meta[name="${name}"]`
      ) as HTMLMetaElement;
      
      if (!tag) {
        tag = document.createElement('meta');
        if (isProperty) {
          tag.setAttribute('property', name);
        } else {
          tag.setAttribute('name', name);
        }
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    // Standard meta tags
    updateMetaTag('description', metadata.description);
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    
    if (metadata.keywords) {
      updateMetaTag('keywords', metadata.keywords.join(', '));
    }

    if (metadata.robots) {
      updateMetaTag('robots', metadata.robots);
    }

    if (metadata.author) {
      updateMetaTag('author', metadata.author);
    }

    // OpenGraph tags
    updateMetaTag('og:title', metadata.ogTitle || metadata.title, true);
    updateMetaTag('og:description', metadata.ogDescription || metadata.description, true);
    updateMetaTag('og:url', metadata.canonicalUrl || window.location.href, true);
    updateMetaTag('og:type', 'website', true);
    
    if (metadata.ogImage) {
      updateMetaTag('og:image', metadata.ogImage, true);
    }

    // Twitter tags
    updateMetaTag('twitter:card', metadata.twitterCard || 'summary_large_image');
    if (metadata.twitterHandle) {
      updateMetaTag('twitter:creator', metadata.twitterHandle);
    }

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = metadata.canonicalUrl || window.location.href;

    // hreflang tags for multilingual SEO
    if (metadata.hreflangAlternates && metadata.hreflangAlternates.length > 0) {
      // Remove existing hreflang tags
      document.querySelectorAll('link[rel="alternate"]').forEach(tag => tag.remove());
      
      // Add new hreflang tags
      metadata.hreflangAlternates.forEach(alt => {
        const link = document.createElement('link');
        link.rel = 'alternate';
        link.hrefLang = alt.lang;
        link.href = alt.href;
        document.head.appendChild(link);
      });
    }

    // Structured data (JSON-LD)
    if (metadata.structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(metadata.structuredData);
    }

    // Publish and modified dates
    if (metadata.publishedDate) {
      updateMetaTag('article:published_time', metadata.publishedDate, true);
    }
    if (metadata.modifiedDate) {
      updateMetaTag('article:modified_time', metadata.modifiedDate, true);
    }

    // Ensure language attribute
    document.documentElement.lang = language;

  }, [metadata, language]);
}

export function getPageSEOMetadata(
  page: string,
  language: string = 'en',
  additionalData?: Record<string, any>
): SEOMetadata {
  const baseUrl = 'https://shareket.com';
  
  const pageMetadata: Record<string, SEOMetadata> = {
    home: {
      title: language === 'ar' 
        ? 'شراء شركة جاهزة - تأسيس شركة عن بعد | Sharekte'
        : language === 'hi'
        ? 'तैयार कंपनी खरीदें - ऑनलाइन कंपनी स्थापना | Sharekte'
        : 'Buy Ready Made Companies Online | Sharekte - Global Company Formation',
      description: language === 'ar'
        ? 'اشترِ شركات جاهزة للبيع مع حسابات بنكية. تأسيس شركات عن بعد بدون السفر. خدمات أبوستيل وتصديق السفارات.'
        : language === 'hi'
        ? 'तैयार कंपनी खरीदें और ऑनलाइन कंपनी स्थापना करें। विदेशी कंपनी रजिस्ट्रेशन और अंतर्राष्ट्रीय व्यापार सहायता।'
        : 'Buy ready-made companies online with bank accounts. Start your international business remotely. Apostille, legalization & embassy attestation services.',
      keywords: language === 'ar' ? SEO_KEYWORDS_AR.general : language === 'hi' ? SEO_KEYWORDS_HI.general : SEO_KEYWORDS.general,
      canonicalUrl: `${baseUrl}/`,
      ogTitle: language === 'ar' ? 'شراء شركة جاهزة' : language === 'hi' ? 'तैयार कंपनी खरीदें' : 'Buy Ready Made Companies',
      ogDescription: language === 'ar' ? 'تأسيس شركة جاهزة للبيع مع حساب بنكي دولي' : language === 'hi' ? 'तैयार कंपनी खरीदें और बिजनेस शुरू करें' : 'Global ready-made companies for instant business setup',
      twitterCard: 'summary_large_image',
      robots: 'index, follow',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Sharekte',
        url: baseUrl,
        logo: `${baseUrl}/logo.png`,
        description: language === 'ar' ? 'منصة شراء الشركات الجاهزة' : language === 'hi' ? 'तैयार कंपनी खरीद मंच' : 'Ready-made company marketplace',
        sameAs: [
          'https://www.facebook.com/sharekte',
          'https://twitter.com/sharekte',
          'https://www.linkedin.com/company/sharekte'
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+971505051790',
          contactType: 'Customer Service'
        }
      }
    },
    companies: {
      title: language === 'ar'
        ? 'شراء شركات جاهزة - دليل الشركات الجاهزة للبيع | Sharekte'
        : language === 'hi'
        ? 'कंपनी खरीदें - तैयार कंपनियों की सूची | Sharekte'
        : 'Buy Ready-Made Companies - Company Directory | Sharekte',
      description: language === 'ar'
        ? 'تصفح واشتر من مئات الشركات الجاهزة مع حسابات بنكية. شركات UK, Sweden, Germany, Italy وغيرها.'
        : language === 'hi'
        ? 'सैकड़ों तैयार कंपनियों को ब्राउज करें और खरीदें। UK, स्वीडन, जर्मनी कंपनियां।'
        : 'Browse hundreds of ready-made companies from UK, Sweden, Germany, Italy and more.',
      keywords: language === 'ar' ? [...SEO_KEYWORDS_AR.general, ...SEO_KEYWORDS_AR.country] : language === 'hi' ? [...SEO_KEYWORDS_HI.general, ...SEO_KEYWORDS_HI.country] : [...SEO_KEYWORDS.general, ...SEO_KEYWORDS.country],
      canonicalUrl: `${baseUrl}/companies`,
      ogTitle: language === 'ar' ? 'دليل الشركات الجاهزة' : language === 'hi' ? 'तैयार कंपनी निर्देशिका' : 'Ready-Made Companies Directory',
      twitterCard: 'summary_large_image',
      robots: 'index, follow',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: language === 'ar' ? 'دليل الشركات الجاهزة' : language === 'hi' ? 'कंपनी निर्देशिका' : 'Companies Directory',
        url: `${baseUrl}/companies`,
        description: language === 'ar' ? 'مجموعة من الشركات الجاهزة للبيع' : language === 'hi' ? 'तैयार कंपनियों का संग्रह' : 'Collection of ready-made companies'
      }
    },
    checkout: {
      title: language === 'ar'
        ? 'إكمال عملية الشراء - شراء شركة جاهزة | Sharekte'
        : language === 'hi'
        ? 'चेकआउट - कंपनी खरीदें | Sharekte'
        : 'Checkout - Buy Your Ready-Made Company | Sharekte',
      description: language === 'ar'
        ? 'أكمل عملية الشراء بسهولة وأمان. دفع آمن وسهل لشراء شركتك الجاهزة.'
        : language === 'hi'
        ? 'अपनी तैयार कंपनी खरीदने के लिए सुरक्षित चेकआउट।'
        : 'Secure checkout for your ready-made company purchase.',
      canonicalUrl: `${baseUrl}/checkout`,
      robots: 'noindex, follow',
    },
    support: {
      title: language === 'ar'
        ? 'الدعم والمساعدة - خدمات الأبوستيل والتصديق | Sharekte'
        : language === 'hi'
        ? 'सहायता - अपोस्टिल और सत्यापन सेवाएं | Sharekte'
        : 'Support & Services - Apostille & Attestation | Sharekte',
      description: language === 'ar'
        ? 'خدمات الأبوستيل والتصديق والقوائم المالية والدعم القانوني الكامل.'
        : language === 'hi'
        ? 'अपोस्टिल, सत्यापन, वित्तीय रिपोर्ट और पूर्ण कानूनी सहायता।'
        : 'Apostille, legalization, embassy attestation, financial reports and more.',
      keywords: language === 'ar' ? SEO_KEYWORDS_AR.services : language === 'hi' ? SEO_KEYWORDS_HI.services : SEO_KEYWORDS.services,
      canonicalUrl: `${baseUrl}/support`,
      robots: 'index, follow',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: []
      }
    }
  };

  const defaultMetadata = pageMetadata[page] || pageMetadata.home;
  
  // Add multilingual hreflang tags
  const hreflangAlternates = [
    { lang: 'en', href: `${baseUrl}${page === 'home' ? '/' : '/' + page}` },
    { lang: 'ar', href: `${baseUrl}/ar${page === 'home' ? '/' : '/' + page}` },
    { lang: 'hi', href: `${baseUrl}/hi${page === 'home' ? '/' : '/' + page}` }
  ];

  return {
    ...defaultMetadata,
    hreflangAlternates,
    ...additionalData
  };
}

export { SEO_KEYWORDS, SEO_KEYWORDS_AR, SEO_KEYWORDS_HI };
