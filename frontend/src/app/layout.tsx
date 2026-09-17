import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import "@/styles/settly/style.css";
import "@/styles/settly/master-nav-footer.css";
import "@/styles/settly/settly-assistant-widget.css";
import { Toaster } from "@/components/ui/Toaster";
import { fontVariables } from "@/fonts";

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
    <html lang="en" dir="ltr" className={fontVariables}>
      <body className="bg-canvas text-ink min-h-screen antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
