import { Metadata } from 'next';

// SEO Configuration and Utilities for Italian Market
// Optimized for WikiGaiaLab landing page

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string[];
  url: string;
  images: {
    url: string;
    width: number;
    height: number;
    alt: string;
  }[];
  structuredData?: Record<string, any>;
  hreflang?: Record<string, string>;
}

// Italian Keywords Research - Optimized for WikiGaiaLab
export const italianKeywords = {
  primary: [
    'community italiana',
    'soluzioni AI',
    'piattaforma collaborativa',
    'voto democratico',
    'problemi quotidiani',
    'innovazione sociale',
    'tecnologia sostenibile',
    'sviluppo software',
    'app AI-powered',
    'comunità digitale'
  ],
  secondary: [
    'proponi problemi',
    'vota soluzioni',
    'accesso premium',
    'democratizzazione tecnologia',
    'bene comune',
    'partecipazione attiva',
    'trasformazione digitale',
    'economia collaborativa',
    'open source',
    'civic tech'
  ],
  longTail: [
    'come proporre problemi community',
    'votare soluzioni digitali Italia',
    'accesso gratuito app premium',
    'community italiana tecnologia',
    'piattaforma voto democratico',
    'soluzioni AI problemi quotidiani',
    'innovazione sociale digitale',
    'partecipazione civica online',
    'sviluppo collaborativo app',
    'tecnologia bene comune'
  ]
};

// Landing Page SEO Configuration
export const landingPageSEO: SEOConfig = {
  title: 'WikiGaiaLab | Piattaforma Community per Soluzioni AI',
  description: 'Unisciti alla community WikiGaiaLab: proponi problemi, vota soluzioni e accedi ad app AI-powered create dalla comunità italiana. Innovazione sociale e tecnologia per il bene comune.',
  keywords: [
    ...italianKeywords.primary,
    ...italianKeywords.secondary,
    'WikiGaiaLab',
    'Ass.Gaia',
    'Ecologicaleaving',
    'GDPR compliant',
    'privacy by design'
  ],
  url: 'https://wikigaialab.com',
  images: [
    {
      url: '/images/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'WikiGaiaLab - Community per Soluzioni AI'
    },
    {
      url: '/images/twitter-image.jpg',
      width: 1200,
      height: 600,
      alt: 'WikiGaiaLab - Proponi, Vota, Accedi'
    }
  ],
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'WikiGaiaLab',
    description: 'Piattaforma community italiana per soluzioni AI democratiche',
    url: 'https://wikigaialab.com',
    applicationCategory: 'SocialNetworkingApplication',
    operatingSystem: 'Web',
    inLanguage: 'it-IT',
    creator: {
      '@type': 'Organization',
      name: 'WikiGaiaLab',
      description: 'Innovazione sociale e tecnologia per il bene comune',
      url: 'https://wikigaialab.com',
      sameAs: [
        'https://www.linkedin.com/company/wikigaialab',
        'https://twitter.com/wikigaialab',
        'https://github.com/wikigaialab'
      ]
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Accesso gratuito alla piattaforma community'
    },
    audience: {
      '@type': 'Audience',
      geographicArea: 'Italy',
      audienceType: 'Italian community members interested in technology and social innovation'
    },
    featureList: [
      'Proponi problemi quotidiani',
      'Vota soluzioni innovative',
      'Accedi ad app AI-powered',
      'Community italiana attiva',
      'Innovazione sociale',
      'Tecnologia sostenibile'
    ]
  },
  hreflang: {
    'it-IT': 'https://wikigaialab.com',
    'en-US': 'https://wikigaialab.com/en',
    'x-default': 'https://wikigaialab.com'
  }
};

// Generate Next.js Metadata
export const generateMetadata = (config: SEOConfig): Metadata => {
  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords.join(', '),
    authors: [{ name: 'WikiGaiaLab' }],
    creator: 'WikiGaiaLab',
    publisher: 'WikiGaiaLab',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: config.title,
      description: config.description,
      url: config.url,
      siteName: 'WikiGaiaLab',
      images: config.images.map(img => ({
        url: img.url,
        width: img.width,
        height: img.height,
        alt: img.alt,
      })),
      locale: 'it_IT',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
      images: config.images.map(img => img.url),
      creator: '@wikigaialab',
      site: '@wikigaialab',
    },
    alternates: {
      canonical: config.url,
      languages: config.hreflang,
    },
    verification: {
      google: 'google-site-verification-code',
      yandex: 'yandex-verification-code',
    },
    other: {
      'msapplication-TileColor': '#2b5797',
      'theme-color': '#ffffff',
    },
  };
};

// Structured Data for FAQ Section
export const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Come funziona WikiGaiaLab?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'WikiGaiaLab è una piattaforma community dove puoi proporre problemi quotidiani, votare le soluzioni più interessanti e accedere gratuitamente alle app AI-powered sviluppate dalla comunità.'
      }
    },
    {
      '@type': 'Question',
      name: 'È gratuito utilizzare WikiGaiaLab?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sì, la partecipazione alla community è completamente gratuita. Chi vota un problema ottiene accesso gratuito alle funzionalità premium delle app sviluppate.'
      }
    },
    {
      '@type': 'Question',
      name: 'Che tipo di problemi posso proporre?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Puoi proporre qualsiasi problema quotidiano che potrebbe essere risolto con una semplice applicazione digitale: produttività, comunicazione, casa, lavoro, tempo libero.'
      }
    },
    {
      '@type': 'Question',
      name: 'Come vengono sviluppate le app?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Una volta che un problema raggiunge 100 voti, iniziamo lo sviluppo utilizzando tecnologie AI-powered e metodologie collaborative per creare soluzioni innovative.'
      }
    },
    {
      '@type': 'Question',
      name: 'Chi sono i partner di WikiGaiaLab?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'WikiGaiaLab è un progetto di collaborazione tra Ass.Gaia e Ecologicaleaving, focalizzato su innovazione sociale e tecnologia per il bene comune.'
      }
    }
  ]
};

// Structured Data for Organization
export const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'WikiGaiaLab',
  description: 'Piattaforma community italiana per soluzioni AI democratiche',
  url: 'https://wikigaialab.com',
  logo: 'https://wikigaialab.com/images/logo.png',
  sameAs: [
    'https://www.linkedin.com/company/wikigaialab',
    'https://twitter.com/wikigaialab',
    'https://github.com/wikigaialab'
  ],
  founder: {
    '@type': 'Organization',
    name: 'Ass.Gaia'
  },
  areaServed: {
    '@type': 'Country',
    name: 'Italy'
  },
  knowsAbout: [
    'Innovazione sociale',
    'Tecnologia sostenibile',
    'Community building',
    'Sviluppo software',
    'Intelligenza artificiale',
    'Democrazia digitale'
  ]
};

// Breadcrumb Structured Data
export const breadcrumbStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://wikigaialab.com'
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Problemi',
      item: 'https://wikigaialab.com/problemi'
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'App Sviluppate',
      item: 'https://wikigaialab.com/app'
    }
  ]
};

// Generate JSON-LD Script
export const generateJsonLdScript = (data: Record<string, any>): string => {
  return JSON.stringify(data, null, 2);
};

// SEO Utilities
export const seoUtils = {
  // Generate title with proper length
  generateTitle: (base: string, suffix: string = 'WikiGaiaLab'): string => {
    const title = `${base} | ${suffix}`;
    return title.length <= 60 ? title : base.substring(0, 60 - suffix.length - 3) + '...';
  },

  // Generate description with proper length
  generateDescription: (text: string): string => {
    return text.length <= 160 ? text : text.substring(0, 157) + '...';
  },

  // Generate keywords string
  generateKeywords: (keywords: string[]): string => {
    return keywords.join(', ');
  },

  // Validate SEO requirements
  validateSEO: (config: SEOConfig): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!config.title || config.title.length > 60) {
      errors.push('Title must be between 1 and 60 characters');
    }

    if (!config.description || config.description.length > 160) {
      errors.push('Description must be between 1 and 160 characters');
    }

    if (!config.keywords || config.keywords.length === 0) {
      errors.push('Keywords are required');
    }

    if (!config.url || !config.url.startsWith('https://')) {
      errors.push('Valid HTTPS URL is required');
    }

    if (!config.images || config.images.length === 0) {
      errors.push('At least one image is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

// Export default SEO configuration
export default {
  landingPageSEO,
  generateMetadata,
  faqStructuredData,
  organizationStructuredData,
  breadcrumbStructuredData,
  generateJsonLdScript,
  seoUtils,
  italianKeywords
};