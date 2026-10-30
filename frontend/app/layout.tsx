import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import Providers from "@/src/providers/queryProviders";
import { ToastProvider } from "@/components/toast/ToastProvider";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

import "./globals.scss";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "LaunchAfrica — Discover. Build. Launch.",
    template: "%s | LaunchAfrica",
  },
  description:
    "Discover African projects, connect with builders, and launch your next idea.",
};

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
      <body className="min-h-screen">
        <ToastProvider>
          <Providers>
            <Header />
            <main>{children}</main>
            <Sidebar />
          </Providers>
        </ToastProvider>
      </body>
    </html>
  );
}
