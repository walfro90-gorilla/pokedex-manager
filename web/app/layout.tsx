import type { Metadata, Viewport } from "next";
import { Rubik, Press_Start_2P } from "next/font/google";
import Nav from "@/app/components/nav";
import InstallPrompt from "@/app/components/install-prompt";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const pixel = Press_Start_2P({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "PokéDex Manager",
  description: "Tu colección personal de Pokémon, con IA",
  appleWebApp: {
    capable: true,
    title: "PokéDex",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#dc0a2d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${rubik.variable} ${pixel.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Nav />
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
