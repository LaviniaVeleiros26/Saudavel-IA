import localFont from "next/font/local";
import "./globals.css";

const lora = localFont({
  src: "../public/fonts/Lora.ttf",
  variable: "--fonte-lora",
  weight: "400 700",
  style: "normal",
  display: "swap",
});

export const metadata = {
  title: "Saudável IA",
  description: "Uma página simples para analisar textos.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={lora.variable}>
      <body>
        {children}
        <footer className="rodape-site">Feito por Larissa , Lavínia  e Raissa  · Do Zero ao Ar · Afesu Veleiros 2026</footer>
      </body>
    </html>
  );
}
