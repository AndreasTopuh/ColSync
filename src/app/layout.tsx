import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://colsync.vercel.app'),
  title: "ColSync - Sync Your Personality With Your Career",
  description:
    "ColSync helps you understand your personality, match with real jobs, and build a career that fits who you truly are - powered by AI agents.",
  keywords: ["personality test", "career matching", "AI career", "job search", "CV audit", "ColSync"],
  authors: [{ name: "ColSync" }],
  openGraph: {
    title: "ColSync - Sync Your Personality With Your Career",
    description:
      "AI-powered personality-career matching. Discover work that fits who you are.",
    siteName: "ColSync",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "ColSync Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "ColSync - Sync Your Personality With Your Career",
    description:
      "AI-powered personality-career matching. Discover work that fits who you are.",
    images: ["/logo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}

