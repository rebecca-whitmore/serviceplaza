import type { Metadata } from "next";
import "./globals.css";
import { CookieConsent } from "./cookie-consent";

export const metadata: Metadata = {
  title: "Service Plaza",
  description:
    "A UK-wide directory for independent, trust-led service businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body>{children}<CookieConsent /></body>
    </html>
  );
}
