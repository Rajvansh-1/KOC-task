import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kingdom of Chess Arena",
  description: "Elite chess matchmaking and tournament platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Providers>
          <div className="w-full bg-[#F37021] text-white text-center py-2 text-sm font-semibold tracking-wide">
            Enjoy Free Weekly Masterclasses with Top Grandmasters
          </div>
          <Navbar />
          <main className="flex-1 relative">
            {children}
          </main>
          <Toaster theme="dark" position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
