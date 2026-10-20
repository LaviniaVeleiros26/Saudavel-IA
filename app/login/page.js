export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import LoginForm from "./login-form";

export default async function Login({ searchParams }) {
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/");
  }
  const params = await searchParams;
  return (
    <main className="pagina">
      <section className="cartao">
        <h1>Saudável IA</h1>
        <p className="subtitulo">Entre ou crie sua conta para continuar.</p>
        <LoginForm confirmationError={params?.erro ? "Não foi possível confirmar seu e-mail. O link pode ter expirado ou já ter sido utilizado. Tente entrar ou solicite um novo cadastro." : null} />
      </section>
    </main>
  );
}
