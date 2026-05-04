import type { Metadata } from 'next';
import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'SmartHostel Management',
  description: 'Modern hostel management system for students and admins',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
                <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5586933340157941"
     crossorigin="anonymous"></script>
      </head>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>

      </body>
    </html>
  );
}
