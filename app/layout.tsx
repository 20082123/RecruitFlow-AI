import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecruitFlow AI",
  description: "企业微信招聘数据自动记录与进度看板 Demo"
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
