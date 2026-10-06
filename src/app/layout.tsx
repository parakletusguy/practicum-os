import type { Metadata, Viewport } from "next";
import { DemoPersonaBar } from "@/components/layout/DemoPersonaBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "PracticumOS — The Operating System for Practice, Care & Social Welfare",
  description:
    "Enterprise multi-tenant platform for supervised practicum, clinical field education, verified logbooks, and community care services.",
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
        <DemoPersonaBar />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
