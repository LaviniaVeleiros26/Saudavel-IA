import Link from "next/link";
import SignOutButton from "./sign-out-button";

export default function SiteHeader({ email }) {
  return (
    <header className="topo">
      <span>{email}</span>
      <nav className="acoes-topo" aria-label="Conta">
        <Link href="/historico">Meu histórico</Link>
        <SignOutButton />
      </nav>
    </header>
  );
}
