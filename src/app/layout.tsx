import type { Metadata, Viewport } from 'next';
import { Klee_One, Shippori_Mincho_B1, Zen_Kaku_Gothic_New } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const display = Shippori_Mincho_B1({ weight: ['500', '700', '800'], subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Zen_Kaku_Gothic_New({ weight: ['400', '500', '700'], subsets: ['latin'], variable: '--font-body', display: 'swap' });
const note = Klee_One({ weight: ['400', '600'], subsets: ['latin'], variable: '--font-note', display: 'swap' });

export const metadata: Metadata = {
  title: 'Animu: find the episode you left off at',
  description: 'Describe a scene you half remember and Animu names the episode, with no spoilers past it.',
};

export const viewport: Viewport = { themeColor: '#F6EFE0' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${note.variable}`}>
      <body>{children}</body>
    </html>
  );
}
