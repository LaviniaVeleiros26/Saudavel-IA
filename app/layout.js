import "./globals.css";

export const metadata = {
  title: "Saudável IA",
  description: "Uma página simples para analisar textos.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
