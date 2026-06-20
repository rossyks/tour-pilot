import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TourPilot',
  description: 'Tour management for bands',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full">
        {children}
      </body>
    </html>
  )
}
