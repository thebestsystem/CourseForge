import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { QueryProvider } from '@/components/providers/query-provider'
import { AuthProvider } from '@/components/providers/auth-provider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'CourseForge - AI-Powered Course Creation',
  description: 'Create professional courses with specialized AI agents. Build, design, and publish engaging educational content with advanced AI assistance.',
  keywords: 'course creation, AI, education, e-learning, course builder, artificial intelligence',
  authors: [{ name: 'CourseForge Team' }],
  creator: 'CourseForge',
  publisher: 'CourseForge',
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://courseforge.ai',
    title: 'CourseForge - AI-Powered Course Creation',
    description: 'Create professional courses with specialized AI agents',
    siteName: 'CourseForge',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CourseForge - AI-Powered Course Creation Platform'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CourseForge - AI-Powered Course Creation',
    description: 'Create professional courses with specialized AI agents',
    creator: '@courseforge',
    images: ['/images/twitter-image.png']
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png'
  },
  manifest: '/site.webmanifest'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <div className="min-h-screen bg-background">
                {children}
              </div>
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  className: 'bg-background border-border text-foreground',
                }}
              />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}