import Link from "next/link";
import SignOutButton from "./sign-out-button";

export default function SiteHeader({ email }) {
  return (
    <header className="topo">
      <Link className="marca" href="/" aria-label="Saudável IA, página inicial">
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M25 6C14 4 6 9 7 18c1 8 13 10 17 1 2-5 1-9 1-13Z" stroke="currentColor" strokeWidth="1.6" /><path d="M7 26 21 12m-8 8v-7m0 7h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        <span>Saudável IA</span>
      </Link>
      <div className="conta-topo">
        <span className="email-conta">{email}</span>
        <nav className="acoes-topo" aria-label="Conta">
          <Link href="/historico">Meu histórico</Link>
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
