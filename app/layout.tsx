import type { Metadata } from 'next';
import './globals.css';
import Provider from './provider';
import { Toaster } from '@/components/ui/sonner';
export const metadata: Metadata = {
  title: 'Fragments UI',
  description: 'Fragments UI testing web app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Provider>{children}</Provider>
        <Toaster />
      </body>
    </html>
  );
}
