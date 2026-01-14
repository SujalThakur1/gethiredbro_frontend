import type { Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://gethiredbro.com'), // Required for absolute OG image URLs
  title: {
    default: 'Get Hired Bro',
    template: '%s | Get Hired Bro', // child pages will be e.g. "Build CV | Get Hired Bro"
  },
  description:
    'AI-powered platform that creates job-specific CVs and provides personalized interview preparation to help you land your next role faster and more effectively.',

  // SEO
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

  // Open Graph (keeps the clean name)
  openGraph: {
    title: 'Get Hired Bro',
    description:
      'AI-powered platform that creates job-specific CVs and provides personalized interview preparation to help you land your next role faster and more effectively.',
    url: 'https://gethiredbro.com', // your domain
    siteName: 'Get Hired Bro',
    images: [
      {
        url: '/og-image.png', // 1200×630 image with just "Get Hired Bro" + subtle visual
        width: 1200,
        height: 630,
        alt: 'Get Hired Bro',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },

  // Twitter / X
  twitter: {
    card: 'summary_large_image',
    title: 'Get Hired Bro',
    description:
      'AI-powered platform that creates job-specific CVs and provides personalized interview preparation to help you land your next role faster and more effectively.',
    images: ['/og-image.png'],
  },

  // Optional but recommended
  keywords: [
    'CV',
    'CV builder',
    'CV maker',
    'CV creator',
    'resume',
    'resume builder',
    'resume maker',
    'resume creator',
    'AI CV builder',
    'AI resume builder',
    'AI CV maker',
    'AI resume maker',
    'job tailored resume',
    'job specific CV',
    'custom CV',
    'custom resume',
    'professional CV',
    'professional resume',
    'interview preparation',
    'interview prep',
    'job interview',
    'interview questions',
    'interview practice',
    'ATS optimized CV',
    'ATS resume',
    'ATS friendly CV',
    'ATS friendly resume',
    'career advancement',
    'job search',
    'find a job',
    'get hired',
    'land a job',
    'job application',
    'cover letter',
    'CV template',
    'resume template',
    'CV format',
    'resume format',
    'online CV builder',
    'free CV builder',
    'resume help',
    'CV help',
  ],
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico', // Apple touch icon (you can create a 180x180 PNG later)
  },
  
  // Mobile browser theming
  themeColor: '#000000', // Change to your brand color
  
  // Viewport (Next.js handles this, but being explicit)
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },

  // Canonical URL
  alternates: {
    canonical: 'https://gethiredbro.com',
  },

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta name="google-site-verification" content="imRCSgLPYAfjFfqcRAr536-QZlnidmMvZ5DwUZY9Uh0" />
          <meta name="msvalidate.01" content="43BB4B1D9B7F4EB7345434F4D1D2D757" />
          <meta name="yandex-verification" content="08c1b60c0ca7a67c" />
          {/* Structured Data (JSON-LD) - Very important for SEO */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'WebApplication',
                name: 'Get Hired Bro',
                description:
                  'AI-powered platform that creates job-specific CVs and provides personalized interview preparation to help you land your next role faster and more effectively.',
                url: 'https://gethiredbro.com',
                applicationCategory: 'BusinessApplication',
                operatingSystem: 'Web',
                offers: {
                  '@type': 'Offer',
                  price: '0',
                  priceCurrency: 'USD',
                },
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: '5',
                  ratingCount: '1',
                },
                featureList: [
                  'AI CV Builder',
                  'Job-Specific Resume Creation',
                  'ATS-Optimized CVs',
                  'Interview Preparation',
                  'Personalized Career Guidance',
                ],
              }),
            }}
          />
          
          {/* Organization Schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'Get Hired Bro',
                url: 'https://gethiredbro.com',
                logo: 'https://gethiredbro.com/images/Logo.png',
                description:
                  'AI-powered platform that creates job-specific CVs and provides personalized interview preparation.',
                sameAs: [
                  // Add your social media URLs here when you have them
                  // 'https://twitter.com/gethiredbro',
                  // 'https://linkedin.com/company/gethiredbro',
                ],
              }),
            }}
          />
          
          {/* Performance: Preconnect to external domains */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
