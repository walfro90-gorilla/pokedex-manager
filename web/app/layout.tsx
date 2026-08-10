import type { Metadata, Viewport } from "next";
import { Rubik, Press_Start_2P } from "next/font/google";
import Nav from "@/app/components/nav";
import BottomNav from "@/app/components/bottom-nav";
import InstallPrompt from "@/app/components/install-prompt";
import { createClient } from "@/lib/supabase/server";
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
  // cover: necesario para que env(safe-area-inset-bottom) funcione en iOS
  // (la tab bar inferior respeta el notch/home indicator)
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="es" className={`${rubik.variable} ${pixel.variable} h-full antialiased`}>
      {/* pb-20 en mobile: espacio para la tab bar inferior fija */}
      <body className="min-h-full flex flex-col pb-20 sm:pb-0">
        <Nav />
        {children}
        <BottomNav authed={Boolean(user)} />
        <InstallPrompt />
      </body>
    </html>
  );
}
