import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
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
        {/* Apple splash screens — shown during iOS PWA launch before HTTP request completes */}
        <link rel="apple-touch-startup-image" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" href="/api/splash?w=1290&h=2796" />
        <link rel="apple-touch-startup-image" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" href="/api/splash?w=1179&h=2556" />
        <link rel="apple-touch-startup-image" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" href="/api/splash?w=1170&h=2532" />
        <link rel="apple-touch-startup-image" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" href="/api/splash?w=1284&h=2778" />
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" href="/api/splash?w=1125&h=2436" />
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" href="/api/splash?w=750&h=1334" />
      </head>
      <body className="min-h-screen font-sans antialiased transition-colors duration-300 bg-gradient-to-br from-lavender-light via-white to-blush-light dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 dark:text-gray-100">
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
