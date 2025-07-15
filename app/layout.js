import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AI-Recruiter | AI-Powered Voice Interviews",
  description: "Let candidates interview 24/7 with our AI voice agent that asks role-specific questions and evaluates answers with LLMs.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          /* Hide Next.js development mode elements */
          #__next-build-watcher, 
          #__next-error-overlay,
          #__nextjs-toast-errors-parent {
            display: none !important;
          }
        `}</style>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
