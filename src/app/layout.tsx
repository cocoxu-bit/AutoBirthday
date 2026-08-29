import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "AutoBirthday — Felicitaciones automáticas por WhatsApp",
  description:
    "Automatiza el envío de felicitaciones de cumpleaños personalizadas por WhatsApp. Conecta tu cuenta, añade contactos y deja que la IA haga el resto.",
  keywords: [
    "cumpleaños",
    "whatsapp",
    "felicitaciones",
    "automatización",
    "birthday",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AutoBirthday",
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gradient-festive font-sans">
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            className: "rounded-xl",
          }}
        />
      </body>
    </html>
  );
}
