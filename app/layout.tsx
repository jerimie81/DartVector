import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'DartVector - Professional Darts Scoring & Match Engine',
  description: 'Precision darts scoring, broadcast-style chalkboard mode, 25-level DartBot, and all-time career analytics.',
  openGraph: {
    title: 'DartVector - Professional Darts Scoring & Match Engine',
    description: 'Precision darts scoring, broadcast-style chalkboard mode, 25-level DartBot, and all-time career analytics.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DartVector - Professional Darts Scoring & Match Engine',
    description: 'Precision darts scoring, broadcast-style chalkboard mode, 25-level DartBot, and all-time career analytics.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
