import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { QueryProvider } from "@/components/QueryProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClerkErrorBoundary } from "@/components/ClerkProviderWrapper";

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
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }} afterSignOutUrl="/">
      <html lang="en" data-scroll-behavior="smooth" className={`dark scroll-smooth ${inter.variable} ${manrope.variable}`}>
        <head>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;600&family=Lora:wght@400;600;700&family=Crimson+Pro:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;700&family=Fira+Code:wght@400;600&family=Montserrat:wght@400;600;700&family=Source+Serif+4:wght@400;600;700&family=Merriweather:wght@400;700&family=Nunito+Sans:wght@400;600;700&family=IBM+Plex+Serif:wght@400;600;700&family=Outfit:wght@400;600;700&family=Poppins:wght@400;600;700&family=Orbitron:wght@400;600;700&family=Rajdhani:wght@400;600;700&family=Barlow:wght@400;600;700&family=Libre+Baskerville:wght@400;700&display=swap" />
        </head>
        <body className="font-body selection:bg-primary/30 overflow-x-hidden">
          <ClerkErrorBoundary>
            <AuthProvider>
              <ThemeProvider>
                <QueryProvider>
                  <AppProvider>
                    <ErrorBoundary>
                      {children}
                    </ErrorBoundary>
                  </AppProvider>
                </QueryProvider>
              </ThemeProvider>
            </AuthProvider>
          </ClerkErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}