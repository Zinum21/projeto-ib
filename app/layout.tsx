import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Finance Career OS",
  description: "Não tenho pressa. Tenho direção.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
