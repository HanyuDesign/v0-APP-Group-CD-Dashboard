import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Baloo_2, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
})
const baloo = Baloo_2({
  variable: '--font-baloo',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Wellness Specialist — AI health companion',
  description:
    'A friendly white-label AI Wellness Specialist that gives personalized health & wellness product help — check, recommend, fulfill, follow up, and hand off to a real pharmacist.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${baloo.variable} bg-white`}>
      <body className="font-sans antialiased bg-white">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
