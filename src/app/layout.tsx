import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PropFlow',
  description: 'Prop Firm Trading Manager',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
