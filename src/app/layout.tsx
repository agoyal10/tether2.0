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
        {/* Apple splash screens — iOS shows these during PWA launch before any HTTP request */}
        {/* iPhone 16 Pro Max */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/splash-1320x2868.png" />
        {/* iPhone 16 Pro */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/splash-1206x2622.png" />
        {/* iPhone 16 Plus / 15 Plus / 14 Pro Max / 15 Pro Max */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/splash-1290x2796.png" />
        {/* iPhone 16 / 15 / 14 Pro / 15 Pro */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/splash-1179x2556.png" />
        {/* iPhone 14 Plus / 13 Pro Max */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/splash-1284x2778.png" />
        {/* iPhone 14 / 13 / 12 / 16e */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/splash-1170x2532.png" />
        {/* iPhone 13 mini / 12 mini / X / XS / 11 Pro */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/splash-1125x2436.png" />
        {/* iPhone XS Max / 11 Pro Max */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/splash-1242x2688.png" />
        {/* iPhone XR / 11 */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" href="/splash/splash-828x1792.png" />
        {/* iPhone SE / 8 */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" href="/splash/splash-750x1334.png" />
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
