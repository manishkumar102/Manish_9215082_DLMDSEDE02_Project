import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "E-Commerce Clickstream Analytics Pipeline | Data Engineering Portfolio",
  description:
    "End-to-end batch processing data pipeline for analyzing 100M+ e-commerce clickstream events. Built with FastAPI, Apache Spark, dbt, PostgreSQL, and Metabase.",
  keywords: [
    "Data Engineering",
    "E-Commerce Analytics",
    "Apache Spark",
    "dbt",
    "PostgreSQL",
    "Metabase",
    "Clickstream",
    "Data Pipeline",
    "Airflow",
    "MinIO",
  ],
  authors: [{ name: "Data Engineering Portfolio" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "E-Commerce Clickstream Analytics Pipeline",
    description:
      "Complete data engineering pipeline for e-commerce clickstream analytics",
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
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
