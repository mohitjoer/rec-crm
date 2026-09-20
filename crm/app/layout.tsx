import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Recovra | Collections that run themselves',
  description: 'Recovra coordinates your debtors, voice agents, payment plans, and compliance from delinquency to resolution.',
  icons: {
    icon: '/icon_logo.png',
    shortcut: '/icon_logo.png',
    apple: '/icon_logo.png',
  },
};

const THEME_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('recovra-theme');
    if (stored === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-[#f8f9fa] text-zinc-900 dark:bg-[#09090b] dark:text-zinc-100 transition-colors duration-200 antialiased">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
        />
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
