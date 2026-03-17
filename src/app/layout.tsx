import type { Metadata } from "next";
import "./globals.css";
import { CookieBanner } from "@/components/CookieBanner";
import { ToastProvider } from "@/components/ToastProvider";

const siteUrl = "https://psicologias-emotiva.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PsyReport | Gestion Clinica Psicologica",
    template: "%s | PsyReport",
  },
  description:
    "Plataforma clinica segura para psicologia infantil, adolescente y familiar: pacientes, informes, citas, auditoria y videoconsulta.",
  applicationName: "PsyReport",
  keywords: [
    "psicologia",
    "gestion clinica",
    "informes psicologicos",
    "agenda clinica",
    "auditoria",
    "videoconsulta",
  ],
  authors: [{ name: "Emotiva / PsyReport" }],
  creator: "Emotiva / PsyReport",
  publisher: "Emotiva / PsyReport",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PsyReport | Gestion Clinica Psicologica",
    description:
      "Pacientes, informes, agenda, auditoria y videoconsulta en una plataforma clinica moderna y segura.",
    url: siteUrl,
    siteName: "PsyReport",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "/emotiva-logo.png",
        width: 512,
        height: 512,
        alt: "PsyReport",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PsyReport | Gestion Clinica Psicologica",
    description:
      "Pacientes, informes, agenda, auditoria y videoconsulta en una plataforma clinica moderna y segura.",
    images: ["/emotiva-logo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/emotiva-logo.png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="relative min-h-screen bg-secondary-bg text-secondary-text antialiased">
        <ToastProvider>
          {children}
          <CookieBanner />
        </ToastProvider>
      </body>
    </html>
  );
}
