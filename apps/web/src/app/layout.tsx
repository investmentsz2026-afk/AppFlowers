import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '../components/QueryProvider';
import { AuthGuard } from '../components/AuthGuard';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ApkExcel - Campo Santo y Florería',
  description: 'Sistema administrativo y de control de pagos moderno para la gestión de clientes, sectores y vencimientos.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('apkexcel_theme');
                  if (saved === 'dark' || (!saved && true)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        <QueryProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </QueryProvider>
      </body>
    </html>
  );
}
