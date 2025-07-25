import './globals.css'
import '../styles/laboratory-animations.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '../contexts/AuthContextNextAuth';
import { MonitoringProvider } from '../components/monitoring/MonitoringProvider';
import ErrorBoundary from '../components/ErrorBoundary';
import PerformanceDashboard from '../components/performance/PerformanceDashboard';
import { AuthDebug } from '../components/debug/AuthDebug';
import SessionProvider from '../components/providers/SessionProvider';
import { generateMetadata, landingPageSEO, organizationStructuredData, generateJsonLdScript } from '../lib/seo';
import { config } from '../lib/env';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
});

// Enhanced SEO metadata for Italian market
export const metadata: Metadata = generateMetadata(landingPageSEO);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="scroll-smooth">
      <head>
        {/* Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: generateJsonLdScript(organizationStructuredData),
          }}
        />
        
        {/* Google Analytics */}
        {config.NEXT_PUBLIC_GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX' && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${config.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${config.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
                `,
              }}
            />
          </>
        )}
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        
        {/* DNS Prefetch for performance */}
        <link rel="dns-prefetch" href="https://accounts.google.com" />
        <link rel="dns-prefetch" href="https://apis.google.com" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileColor" content="#2b5797" />
        
        {/* Viewport for mobile optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ErrorBoundary>
          <MonitoringProvider>
            <SessionProvider>
              <AuthProvider>
                {children}
                {process.env.NODE_ENV === 'development' && <PerformanceDashboard />}
                <AuthDebug />
              </AuthProvider>
            </SessionProvider>
          </MonitoringProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}