import type { Metadata } from "next";
import "./globals.css";

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
        <link rel="icon" type="image/jpeg" href="https://pbs.twimg.com/profile_images/1971138911138152448/skxW4GqN_400x400.jpg" />
        <link rel="shortcut icon" type="image/jpeg" href="https://pbs.twimg.com/profile_images/1971138911138152448/skxW4GqN_400x400.jpg" />
        <link rel="apple-touch-icon" href="https://pbs.twimg.com/profile_images/1971138911138152448/skxW4GqN_400x400.jpg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
