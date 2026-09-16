import type { Metadata } from "next";
import {
  Spectral,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
  IBM_Plex_Sans_Arabic,
  Noto_Naskh_Arabic,
} from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import "@/styles/settly/style.css";
import "@/styles/settly/master-nav-footer.css";
import "@/styles/settly/settly-assistant-widget.css";
import { Toaster } from "@/components/ui/Toaster";

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-spectral",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-arabic",
  display: "swap",
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["500", "700"],
  variable: "--font-noto-naskh-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Settly — Intelligent Real Estate for Egypt",
  description:
    "AI-powered real estate intelligence platform for the Egyptian property market. Verified square-metre pricing, developer track records, and regulated offer reservations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${spectral.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} ${ibmPlexSansArabic.variable} ${notoNaskhArabic.variable}`}
    >
      <body className="bg-canvas text-ink min-h-screen antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
