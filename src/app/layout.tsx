import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tour Pilot',
  description: 'Gestión de giras para bandas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Tour Pilot" />
        <meta name="theme-color" content="#1a1a1a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{__html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js')
            })
          }
        `}} />
      </head>
      <body className="min-h-full">
        {children}
      </body>
    </html>
  )
}
