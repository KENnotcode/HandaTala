import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HandaTala - Canteen Food Ordering System",
  description: "Order ahead, skip the line, enjoy your meal. Modern canteen food ordering and kitchen queue management system.",
  keywords: ["canteen", "food ordering", "queue management", "POS", "restaurant"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-900">
        {children}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            className: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
            duration: 3000,
          }}
        />
      </body>
    </html>
  );
}