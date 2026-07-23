import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../i18n";
import "@/utils/apiConfig";


import UnifiedLayout from "@/components/layout/UnifiedLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "BSG Portal",
  description: "Bharat Scout & Guide Examination Portal",
};

import { LanguageProvider } from "@/contexts/LanguageContext";
import LanguagePopup from "@/components/ui/LanguagePopup";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen transition-colors duration-300`}>
        <LanguageProvider>
          <UnifiedLayout>
            {children}
            <LanguagePopup />
            <Toaster 
              position="top-center" 
              containerStyle={{ top: '50%', transform: 'translateY(-50%)' }}
              toastOptions={{ 
                duration: 4000, 
                style: { background: '#ffffff', color: '#333333', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: '12px', fontWeight: 'bold' } 
              }} 
            />
          </UnifiedLayout>
        </LanguageProvider>
      </body>
    </html>
  );
}
