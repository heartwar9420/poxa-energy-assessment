import React from 'react';
import Providers from './providers';
import './globals.css';

export const metadata = {
  title: '儲能資產管理與電網數據即時監控中心',
  description: '電網數據實時監控系統',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
