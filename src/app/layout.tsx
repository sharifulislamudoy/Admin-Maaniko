import type { Metadata } from "next";
import { Baloo_Da_2, Hind_Siliguri, Poppins } from "next/font/google";
import type { ReactNode } from "react";

import AppProviders from "@/components/AppProviders";

import "./globals.css";

const balooDa2 = Baloo_Da_2({
  variable: "--font-baloo-da-2",
  subsets: ["bengali", "latin"],
  weight: ["600", "700"],
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Maaniko অ্যাডমিন পোর্টাল",
    template: "%s | Maaniko অ্যাডমিন",
  },
  description: "নিরাপদে Maaniko-এর পণ্য, অর্ডার ও অ্যাডমিন পরিচালনা করুন।",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${balooDa2.variable} ${hindSiliguri.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
