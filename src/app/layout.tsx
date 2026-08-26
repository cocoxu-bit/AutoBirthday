import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

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
