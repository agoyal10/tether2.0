import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import SplashRemover from "@/components/SplashRemover";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Tether",
  description: "Emotional check-ins for couples",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#C7B8EA",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(t==='dark'||(t===null&&d)){document.documentElement.classList.add('dark');document.documentElement.style.background='#030712';}else{document.documentElement.classList.remove('dark');document.documentElement.style.background='#f5f3ff';}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Tether" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen font-sans antialiased transition-colors duration-300 bg-gradient-to-br from-lavender-light via-white to-blush-light dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 dark:text-gray-100">
        <div id="tether-splash" aria-hidden="true">
          <span className="splash-emoji">💞</span>
          <p className="splash-text">how are you feeling?</p>
          <div className="splash-dots">
            <span /><span /><span />
          </div>
        </div>
        <SplashRemover />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: "1rem",
              background: "#fff",
              color: "#374151",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              fontSize: "0.875rem",
            },
          }}
        />
      </body>
    </html>
  );
}
