import type { Metadata, Viewport } from "next";
import { DemoPersonaBar } from "@/components/layout/DemoPersonaBar";
import { isDemoMode } from "@/lib/runtime-mode";
import "./globals.css";

export const metadata: Metadata = {
  title: "PracticumOS | Practicum coordination workspace",
  description:
    "A preview workspace for coordinating student placements, fieldwork review, supervision, and assessment.",
  keywords: [
    "practicum management software",
    "field education workspace",
    "clinical placement management platform",
    "social work field education software",
    "cswe epas field tracking software",
    "dual supervision practicum platform",
    "fieldwork review",
    "community care gateway",
  ],
  authors: [{ name: "PracticumOS" }],
  openGraph: {
    title: "PracticumOS — Practicum coordination workspace",
    description:
      "Coordinate placements, fieldwork review, supervision, and assessment from a shared workspace.",
    url: "https://practicum-os.vercel.app",
    siteName: "PracticumOS",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PracticumOS — Practicum coordination workspace",
    description:
      "A preview workspace for field education and practicum coordination.",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased font-sans selection:bg-brand-500 selection:text-white flex flex-col">
        {isDemoMode() && <DemoPersonaBar />}
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
