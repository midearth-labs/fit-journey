import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Fitness AI Game - Train Your Fitness Knowledge',
  description:
    'Master fitness, nutrition, and anatomy through fun interactive quizzes. Train your avatar and compete with friends!',
  keywords: ['fitness', 'quiz', 'education', 'nutrition', 'exercise', 'game'],
  authors: [{ name: 'Fitness AI Game' }],
  creator: 'Fitness AI Game',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'Fitness AI Game - Train Your Fitness Knowledge',
    description:
      'Master fitness, nutrition, and anatomy through fun interactive quizzes. Train your avatar and compete with friends!',
    siteName: 'Fitness AI Game',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fitness AI Game - Train Your Fitness Knowledge',
    description:
      'Master fitness, nutrition, and anatomy through fun interactive quizzes. Train your avatar and compete with friends!',
    creator: '@fitnessaigame',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
