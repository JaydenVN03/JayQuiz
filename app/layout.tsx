import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "JayQuiz — Học nhẹ nhàng, nhớ lâu hơn",
    template: "%s | JayQuiz",
  },
  description:
    "Ôn tập theo cách của bạn với các bộ đề trắc nghiệm JayQuiz. Học một chút mỗi ngày, tiến bộ thật nhiều.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <div className="site-main">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
