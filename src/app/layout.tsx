import type { Metadata } from "next";
import "../styles/globals.css";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: {
    template: "Tradiciones y Sabores | %s",
    default: "Tradiciones y Sabores"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased ${inter.className}`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
