import type { Metadata } from "next";
import "./globals.css";
import AnimatedBackground from "../components/AnimatedBackground";

export const metadata: Metadata = {
  title: "KARDS - Crypto Debit Cards",
  description: "KARDS - Your crypto debit card platform",
  icons: {
    icon: [
      { url: "https://pbs.twimg.com/profile_images/1971138911138152448/skxW4GqN_400x400.jpg", sizes: "any" },
    ],
    apple: [
      { url: "https://pbs.twimg.com/profile_images/1971138911138152448/skxW4GqN_400x400.jpg", sizes: "180x180" },
    ],
    shortcut: "https://pbs.twimg.com/profile_images/1971138911138152448/skxW4GqN_400x400.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          type="image/jpeg"
          href="https://pbs.twimg.com/profile_images/1971138911138152448/skxW4GqN_400x400.jpg"
        />
        <link
          rel="shortcut icon"
          type="image/jpeg"
          href="https://pbs.twimg.com/profile_images/1971138911138152448/skxW4GqN_400x400.jpg"
        />
        <link
          rel="apple-touch-icon"
          href="https://pbs.twimg.com/profile_images/1971138911138152448/skxW4GqN_400x400.jpg"
        />
      </head>
      <body>
        <AnimatedBackground />
        <div className="relative z-10 min-h-screen">{children}</div>
      </body>
    </html>
  );
}
