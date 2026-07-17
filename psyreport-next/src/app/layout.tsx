import type { Metadata } from "next";
import "./globals.css";
import { CookieBanner } from "@/components/CookieBanner";
import { ToastProvider } from "@/components/ToastProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LockScreen } from "@/components/LockScreen";
import { getServerLang } from "@/lib/i18n-server";

function resolveSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://app.psicologiagio.com";

  try {
    return new URL(configuredUrl).toString().replace(/\/$/, "");
  } catch {
    return "https://app.psicologiagio.com";
  }
}

const siteUrl = resolveSiteUrl();

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const IS_LOCKED = process.env.NEXT_PUBLIC_SITE_LOCKED === "true";
  const serverLang = await getServerLang();

  return (
    <html lang={serverLang} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=document.documentElement;if(t==='dark'){d.classList.add('dark');d.style.colorScheme='dark';}else{d.classList.remove('dark');d.style.colorScheme='light';}}catch(e){}try{var k='psyreport.ui';var raw=localStorage.getItem(k);var lang='es';if(raw){var p=JSON.parse(raw);if(p&&(p.language==='en')){lang='en';}}d.setAttribute('lang',lang);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="relative min-h-screen bg-secondary-bg text-secondary-text antialiased">
        <ThemeProvider>
          <ToastProvider>
            {IS_LOCKED ? <LockScreen /> : children}
            <CookieBanner />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
