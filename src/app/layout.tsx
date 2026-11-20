import type { Metadata, Viewport } from "next";
import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import { Geist_Mono, Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/site/theme-provider";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { AmbientBackdrop } from "@/components/site/ambient-backdrop";
import { CinematicIntro } from "@/components/site/cinematic-intro";
import { RouteProgress } from "@/components/site/route-progress";
import { PwaRegister } from "@/components/site/pwa-register";
import { PerfProbe } from "@/components/site/perf-probe";
import { SiteJsonLd } from "@/components/site/json-ld";
import { PlayerProvider, type PlayerTrack } from "@/components/music/player-provider";
import { MiniPlayer } from "@/components/music/mini-player";
import { db } from "@/lib/db";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dailydoseofgospels.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#294875" },
    { media: "(prefers-color-scheme: dark)", color: "#0F192C" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Daily Dose of Gospels — Anonymous Christian Community & AI Counselor",
    template: "%s · Daily Dose of Gospels",
  },
  description:
    "A quiet, fully anonymous Christian community confessing Jesus Christ as Lord and Savior: share testimonies and prayer requests, talk with an AI counselor grounded in Scripture, hear the Verse and Parable of the Day, and listen to original worship instrumentals.",
  keywords: ["Christian community", "anonymous forum", "AI counselor", "verse of the day", "prayer requests", "testimonies"],
  openGraph: {
    title: "Daily Dose of Gospels",
    description:
      "Verse of the Day, a Parable of the Day straight from the Gospels, an anonymous community, and a Christ-centered AI counselor. No names. No accounts. Just grace.",
    url: SITE_URL,
    siteName: "Daily Dose of Gospels",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Dose of Gospels",
    description: "Anonymous Christian community with a Christ-centered AI counselor.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "religion",
  creator: "Daily Dose of Gospels",
  publisher: "Daily Dose of Gospels",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48 64x64 128x128 256x256", type: "image/x-icon" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Daily Gospels",
  },
  applicationName: "Daily Dose of Gospels",
};

const getPlayerTracks = unstable_cache(
  async (): Promise<PlayerTrack[]> => {
    try {
      const rows = await db.track.findMany({
        where: { published: true },
        orderBy: [{ album: "asc" }, { trackOrder: "asc" }, { createdAt: "asc" }],
        take: 100,
      });
      return rows.map((t) => ({
        id: t.id,
        title: t.title,
        audioUrl: t.audioUrl,
        coverUrl: t.coverUrl,
        album: t.album,
        scripture: t.scripture,
        description: t.description,
        lyrics: t.lyrics,
        playCount: t.playCount,
        durationSec: t.durationSec,
      }));
    } catch {
      return [];
    }
  },
  ["player-tracks"],
  { revalidate: 300, tags: ["tracks"] }
);

const FETCH_GUARD_SCRIPT = `(function(){try{var d=Object.getOwnPropertyDescriptor(window,"fetch");if(d&&d.configurable&&d.get&&!d.set){var origGet=d.get,customFetch,hasCustom=false;Object.defineProperty(window,"fetch",{configurable:true,enumerable:d.enumerable,get:function(){return hasCustom?customFetch:origGet.call(window);},set:function(v){customFetch=v;hasCustom=true;}});}}catch(_){}window.addEventListener("error",function(e){var src=(e&&(e.filename||(e.error&&e.error.stack)))||"";var msg=String((e&&e.message)||"");if(typeof src==="string"&&(src.indexOf("chrome-extension://")!==-1||src.indexOf("moz-extension://")!==-1)&&msg.indexOf("Cannot set property fetch")!==-1){e.preventDefault();e.stopImmediatePropagation();}},true);})();`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const tracks = await getPlayerTracks();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: FETCH_GUARD_SCRIPT }} />
      </head>
      <body
        className={`${inter.variable} ${geistMono.variable} ${sourceSerif.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <SiteJsonLd />
          <PwaRegister />
          <PerfProbe />
          <AmbientBackdrop />
          <CinematicIntro />
          <Suspense fallback={null}>
            <RouteProgress />
          </Suspense>
          <PlayerProvider initialTracks={tracks}>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
            <MiniPlayer />
          </PlayerProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
