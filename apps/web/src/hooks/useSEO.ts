import { useEffect } from 'react';

interface SEOMetadata {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: 'website' | 'article';
  siteName?: string;
  twitterCard?: 'summary' | 'summary_large_image';
}

export function useSEO(metadata: SEOMetadata) {
  useEffect(() => {
    // Update document title
    document.title = `${metadata.title} | WikiGaiaLab`;

    // Helper function to update or create meta tag
    const updateMetaTag = (property: string, content: string, attribute: 'property' | 'name' = 'property') => {
      let meta = document.querySelector(`meta[${attribute}="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Update basic meta tags
    updateMetaTag('description', metadata.description, 'name');
    
    // Update Open Graph meta tags
    updateMetaTag('og:title', metadata.title);
    updateMetaTag('og:description', metadata.description);
    updateMetaTag('og:url', metadata.url);
    updateMetaTag('og:type', metadata.type || 'article');
    updateMetaTag('og:site_name', metadata.siteName || 'WikiGaiaLab');
    updateMetaTag('og:locale', 'it_IT');
    
    if (metadata.image) {
      updateMetaTag('og:image', metadata.image);
      updateMetaTag('og:image:width', '1200');
      updateMetaTag('og:image:height', '630');
      updateMetaTag('og:image:alt', metadata.title);
    }

    // Update Twitter Card meta tags
    updateMetaTag('twitter:card', metadata.twitterCard || 'summary_large_image', 'name');
    updateMetaTag('twitter:title', metadata.title, 'name');
    updateMetaTag('twitter:description', metadata.description, 'name');
    updateMetaTag('twitter:site', '@WikiGaiaLab', 'name');
    
    if (metadata.image) {
      updateMetaTag('twitter:image', metadata.image, 'name');
      updateMetaTag('twitter:image:alt', metadata.title, 'name');
    }

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = metadata.url;

    // Cleanup function to restore default meta tags
    return () => {
      document.title = 'WikiGaiaLab - Risolviamo i problemi del mondo insieme';
    };
  }, [metadata]);
}