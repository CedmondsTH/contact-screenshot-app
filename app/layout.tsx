import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Contact Screenshot App',
  description: 'Convert email signatures and LinkedIn profiles to contact cards',
  keywords: ['contact', 'email signature', 'linkedin', 'vcf', 'contact card'],
  authors: [{ name: 'Contact Screenshot App' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
} 