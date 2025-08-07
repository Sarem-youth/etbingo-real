import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";
import { ClientProviders } from "@/components/providers/client-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ethio Bingo - Premier Online Bingo Platform",
  description: "Experience the best online bingo gaming in Ethiopia with Ethio Bingo. Play exciting bingo games, win amazing prizes, and enjoy a seamless gaming experience.",
  keywords: ["Ethio Bingo", "Online Bingo", "Ethiopia", "Gaming", "Bingo Games", "ETB"],
  authors: [{ name: "Ethio Bingo Team" }],
  openGraph: {
    title: "Ethio Bingo - Premier Online Bingo Platform",
    description: "Experience the best online bingo gaming in Ethiopia",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <ClientProviders>
            {children}
            <Toaster />
          </ClientProviders>
        </AuthProvider>
      </body>
    </html>
  );
}
