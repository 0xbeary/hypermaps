import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { HypergraphAppProvider } from '@graphprotocol/hypergraph-react';
import { mapping } from './mapping';
import { Providers } from './providers';
import { AuthWrapper } from './auth-wrapper';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hypergraph AI Map",
  description: "AI-powered hypergraph mapping application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <HypergraphAppProvider mapping={mapping}>
            <AuthWrapper>
              {children}
            </AuthWrapper>
          </HypergraphAppProvider>
        </Providers>
      </body>
    </html>
  );
}
