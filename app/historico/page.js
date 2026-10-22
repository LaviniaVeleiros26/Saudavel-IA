import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import SiteHeader from "../components/site-header";

export const dynamic = "force-dynamic";

const pageSize = 50;
const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "short",
  timeStyle: "short",
});

function formatDate(value) {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? dateFormat.format(date) : "Data indisponível";
}

export default async function Historico({ searchParams }) {
  const supabase = await createClient();
  if (!supabase) redirect("/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const requestedPage = Number(params?.pagina || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 100000 ? requestedPage : 1;
  const from = (page - 1) * pageSize;
  let respostas = [];
  let hasNext = false;
  let errorMessage = null;
  try {
    const { data, error } = await supabase
      .from("respostas")
      .select("id,entrada,resposta,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + pageSize);
    if (error) errorMessage = "Não foi possível carregar seu histórico. Tente novamente em instantes.";
    else {
      hasNext = (data?.length || 0) > pageSize;
      respostas = (data || []).slice(0, pageSize);
    }
  } catch {
    errorMessage = "Não foi possível conectar ao serviço para carregar seu histórico.";
  }

  return (
    <>
      <SiteHeader email={user.email} />
      <main className="pagina pagina-autenticada">
        <section className="cartao historico" aria-labelledby="titulo-historico">
          <h1 id="titulo-historico">Meu histórico</h1>
          <p>Suas mensagens e respostas, da mais recente para a mais antiga. Horários de Brasília.</p>
          <Link href="/">Analisar outra mensagem</Link>
          {errorMessage ? <p className="erro" role="alert">{errorMessage}</p> : (
            respostas.length ? (
              <ol className="lista-analises">
                {respostas.map(item => (
                  <li key={item.id}>
                    <article>
                      <p><time dateTime={item.created_at || undefined}>{formatDate(item.created_at)}</time></p>
                      <h2>Mensagem enviada</h2>
                      <p className="texto-salvo entrada-salva">{item.entrada}</p>
                      <h2>Resposta</h2>
                      <p className="texto-salvo resposta-salva">{item.resposta}</p>
                    </article>
                  </li>
                ))}
              </ol>
            ) : <p>Você ainda não tem respostas salvas nesta página.</p>
          )}
          <nav className="paginacao" aria-label="Páginas do histórico">
            {page > 1 && <Link href={`/historico?pagina=${page - 1}`}>Anterior</Link>}
            <span>Página {page}</span>
            {!errorMessage && hasNext && <Link href={`/historico?pagina=${page + 1}`}>Próxima</Link>}
          </nav>
        </section>
      </main>
    </>
  );
}
