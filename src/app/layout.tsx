import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KARDS - Crypto Debit Cards",
  description: "KARDS - Your crypto debit card platform",
  icons: {
    icon: "https://pbs.twimg.com/profile_images/1971138911138152448/skxW4GqN_400x400.jpg",
    apple: "https://pbs.twimg.com/profile_images/1971138911138152448/skxW4GqN_400x400.jpg",
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
        <link rel="icon" href="https://pbs.twimg.com/profile_images/1971138911138152448/skxW4GqN_400x400.jpg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
