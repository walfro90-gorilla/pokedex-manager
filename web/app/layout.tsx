import type { Metadata } from "next";
import { Rubik, Press_Start_2P } from "next/font/google";
import Nav from "@/app/components/nav";
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${rubik.variable} ${pixel.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Nav />
        {children}
      </body>
    </html>
  );
}
