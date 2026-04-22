import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { SessionProvider } from '@/components/providers/SessionProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TP Logistics',
  description: 'Plataforma de logística internacional — TP Logistics',
  manifest: '/manifest.json',
  themeColor: '#FACC15',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TP Logistics',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" type="image/png" href="/images/icon-to-logo.png" />
        <link rel="shortcut icon" href="/images/icon-to-logo.png" />
        <link rel="apple-touch-icon" href="/images/icon-to-logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')` }} />
        <SessionProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}