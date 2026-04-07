import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from './providers';

export const metadata: Metadata = {
  title: 'CardiacCare Billing — Post Cardiac & Lung Surgery Telehealth',
  description: 'Telehealth billing platform for post cardiac and lung surgery patients',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
