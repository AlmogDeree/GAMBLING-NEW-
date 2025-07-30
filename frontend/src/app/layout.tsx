import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bet on Number - Gaming Platform",
  description: "Multi-number betting game with VIP rewards and referral system",
  keywords: "betting, gaming, numbers, VIP, rewards",
  viewport: "width=device-width, initial-scale=0.8, maximum-scale=1.0, user-scalable=yes"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=0.8, maximum-scale=1.0, user-scalable=yes" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap" 
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          fontFamily: '"Heebo", "Geist Sans", Arial, sans-serif',
          zoom: '0.8',
          minHeight: '100vh'
        }}
      >
        {children}
      </body>
    </html>
  );
}