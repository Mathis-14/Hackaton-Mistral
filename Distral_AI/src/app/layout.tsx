import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Distral AI",
  description: "A fresh Next.js application scaffold for Distral AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
