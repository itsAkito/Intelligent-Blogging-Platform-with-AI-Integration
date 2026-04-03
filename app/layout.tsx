import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata = {
  metadataBase: new URL('https://aiblog.dev'),
  title: {
    default: "AiBlog - AI-Powered Blogging & Career Platform",
    template: "%s | AiBlog",
  },
  description: "A premium digital ecosystem where generative intelligence meets professional journalism. Discover AI-curated insights, advance your career, and connect with a thriving community.",
  keywords: ["AI blog", "career platform", "AI writing", "professional journalism", "tech blog", "career development"],
  authors: [{ name: "AiBlog Editorial" }],
  creator: "AiBlog",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aiblog.dev",
    siteName: "AiBlog",
    title: "AiBlog - AI-Powered Blogging & Career Platform",
    description: "A premium digital ecosystem where generative intelligence meets professional journalism.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "AiBlog" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AiBlog - AI-Powered Blogging & Career Platform",
    description: "A premium digital ecosystem where generative intelligence meets professional journalism.",
    images: ["/og-image.png"],
    creator: "@aiblog",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: "https://aiblog.dev" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }} afterSignOutUrl="/">
      <html lang="en" data-scroll-behavior="smooth" className={`dark scroll-smooth ${inter.variable} ${manrope.variable}`}>
        <body className="font-body selection:bg-primary/30 overflow-x-hidden">
          <AuthProvider>
            <AppProvider>
              {children}
            </AppProvider>
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}