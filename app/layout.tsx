import type { Metadata, Viewport } from 'next'
import { Fredoka, Quicksand } from 'next/font/google'
import './globals.css'

// Fredoka: rodona i amb caràcter, llegible en MAJÚSCULES; Quicksand: cos net i modern
const display = Fredoka({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-display',
  display: 'swap',
})
const body = Quicksand({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '🎨 Pintem junts!',
  description: 'Pinta quadres d\'artistes famosos en un viatge pel món i el temps',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pintem!',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  openGraph: {
    title: '🎨 Pintem junts!',
    description: 'Pinta quadres d\'artistes famosos en un viatge pel món i el temps',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F25C3D',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ca" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  )
}
