import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  fallback: ["Inter Fallback", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Abic",
  description: "Abic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
        style={{ fontFamily: "Inter, Inter Fallback, system-ui, sans-serif" }}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
