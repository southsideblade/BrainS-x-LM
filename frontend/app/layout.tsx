import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { Analytics } from '@vercel/analytics/react'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BrainS(x)LM - AI 세컨드 브레인',
  description: '당신의 사고방식을 학습하는 AI 세컨드 브레인. 생각을 기록하고 연결하며 새로운 통찰을 발견하세요.',
  keywords: ['AI', '노트', '지식관리', '세컨드브레인', 'PKM', '생산성'],
  authors: [{ name: 'BrainS(x)LM Team' }],
  openGraph: {
    title: 'BrainS(x)LM - AI 세컨드 브레인',
    description: '당신의 사고방식을 학습하는 AI 세컨드 브레인',
    type: 'website',
    locale: 'ko_KR',
    url: 'https://brainsxlm.vercel.app',
    siteName: 'BrainS(x)LM',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BrainS(x)LM',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BrainS(x)LM - AI 세컨드 브레인',
    description: '당신의 사고방식을 학습하는 AI 세컨드 브레인',
    images: ['/og-image.png'],
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <Navbar />
          <main className="container mx-auto px-4 py-8 max-w-7xl">
            {children}
          </main>
        </div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  )
}
