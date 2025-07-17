import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WikiGaiaLab - Community Problem Solving',
  description: 'A community-driven platform where users propose problems, vote on solutions, and access AI-powered applications.',
  keywords: ['community', 'problem solving', 'AI', 'voting', 'solutions'],
  authors: [{ name: 'WikiGaiaLab Team' }],
  creator: 'WikiGaiaLab Team',
  openGraph: {
    title: 'WikiGaiaLab - Community Problem Solving',
    description: 'A community-driven platform where users propose problems, vote on solutions, and access AI-powered applications.',
    url: 'https://wikigaialab.com',
    siteName: 'WikiGaiaLab',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'WikiGaiaLab - Community Problem Solving',
      },
    ],
    locale: 'it_IT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WikiGaiaLab - Community Problem Solving',
    description: 'A community-driven platform where users propose problems, vote on solutions, and access AI-powered applications.',
    images: ['/images/og-image.png'],
  },
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen bg-neutral-50">
          {children}
        </div>
      </body>
    </html>
  );
}