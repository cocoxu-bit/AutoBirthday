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
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
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
