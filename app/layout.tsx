import type { Metadata } from "next";
import "./globals.css";
import LiveStream from "./live-stream";

export const metadata: Metadata = {
  title: "Media Spill Network | The Next Sound Starts Here",
  description: "Media Spill Network discovers and develops emerging artists through cinematic media, live production, and creative collaboration.",
  openGraph: {
    title: "Media Spill Network | The Next Sound Starts Here",
    description: "Discovering the artists, stories, and moments about to move culture.",
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<LiveStream /></body></html>;
}
