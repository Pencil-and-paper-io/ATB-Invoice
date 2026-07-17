import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { QuickLinks } from "@/components/invoice/QuickLinks";
import { DesignSystemPanel } from "@/components/invoice/DesignSystemPanel";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "ATB Invoice — Draft",
  description: "ATB Q3 Invoice draft editor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        {children}
        <QuickLinks />
        <DesignSystemPanel />
      </body>
    </html>
  );
}
