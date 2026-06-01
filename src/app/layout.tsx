import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReportPilot",
  description: "AI 数据清洗与报表生成系统"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
