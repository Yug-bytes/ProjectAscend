import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Project Ascend",
  description:
    "Plan your work, focus deeply, and understand how you actually work.",
  icons: {
    icon: "/icons/rocket.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#05070C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" className={inter.variable}>
      <body className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] antialiased">
        {children}
      </body>
    </html>
  );
}
