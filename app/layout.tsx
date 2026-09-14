import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import Navbar from '@/components/Navbar'
import { Toaster } from 'sonner'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Surat Cerdas - Administrasi Surat Sekolah',
  description: 'Sistem Administrasi Surat Sekolah Cerdas berbasis Next.js & Gemini AI',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-50 antialiased`}>
        <Navbar />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
