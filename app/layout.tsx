import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  metadataBase: new URL("https://concordia.tacitus.me"),
  title: "CONCORDIA by TACITUS — AI-Powered Conflict Resolution",
  description:
    "Real-time AI mediation platform combining 30+ conflict resolution frameworks with live audio conversation, psychological profiling, and structured negotiation support.",
  keywords: [
    "AI mediation",
    "conflict resolution",
    "negotiation support",
    "TACITUS",
    "CONCORDIA",
    "dispute resolution",
    "psychological profiling",
    "live audio mediation",
    "AI arbitration",
    "peace negotiation",
    "conflict frameworks",
    "mediation platform",
  ],
  authors: [{ name: "Giulio Catanzariti", url: "https://tacitus.me" }],
  openGraph: {
    type: "website",
    title: "CONCORDIA by TACITUS — AI-Powered Conflict Resolution",
    description:
      "Real-time AI mediation platform combining 30+ conflict resolution frameworks with live audio conversation, psychological profiling, and structured negotiation support.",
    siteName: "CONCORDIA by TACITUS",
  },
  twitter: {
    card: "summary_large_image",
    title: "CONCORDIA by TACITUS — AI-Powered Conflict Resolution",
    description:
      "Real-time AI mediation platform combining 30+ conflict resolution frameworks with live audio conversation, psychological profiling, and structured negotiation support.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
