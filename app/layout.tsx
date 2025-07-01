import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Contact Screenshot App',
  description: 'Easily convert contact info from screenshots to VCF files.',
  keywords: ['contact', 'email signature', 'linkedin', 'vcf', 'contact card'],
  authors: [{ name: 'Contact Screenshot App' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <main className="min-h-screen bg-background text-foreground">
          {children}
        </main>
      </body>
    </html>
  )
} 