import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://grindordie.vercel.app'),
  title: {
    default: 'Grind or Die — Deviens la meilleure version de toi-même',
    template: '%s · Grind or Die',
  },
  description: 'Grind or Die : l\'app de discipline entre amis. Track tes habitudes, gagne des points, défie tes potes et grimpe au classement. Sport, lecture, sommeil, nutrition — chaque jour compte.',
  keywords: ['grind or die', 'app discipline', 'habitudes', 'productivité', 'classement amis', 'lock in', 'développement personnel', 'streak', 'motivation'],
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/icon', type: 'image/png' }],
    apple: [{ url: '/apple-icon', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Grind or Die',
  },
  openGraph: {
    title: 'Grind or Die — Deviens la meilleure version de toi-même',
    description: 'Track tes habitudes, gagne des points, défie tes amis. Chaque jour compte.',
    url: 'https://grindordie.vercel.app',
    siteName: 'Grind or Die',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grind or Die',
    description: 'Track tes habitudes, gagne des points, défie tes amis.',
  },
  robots: { index: true, follow: true },
  verification: {
    google: 'HaBAlGCHZp57g1fYHD7xKSe_KPzEYDzcdlu5Ca1f2cU',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#7c3aed',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Grind or Die" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full bg-gray-950 text-gray-100 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
