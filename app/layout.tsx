import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CONCORDIA — AI Mediation Platform",
  description:
    "AI-powered live mediation by the TACITUS Institute for Conflict Resolution",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
