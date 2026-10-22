"use client";

import { useActionState, useState } from "react";
import { saveAnalysis } from "../analises/actions";

const TEXTOS = {
  titulo: "Saudável IA",
  subtitulo: "Digite um texto abaixo e clique em Analisar.",
  botao: "Analisar",
};

export default function Analisador({ analises = [], historyError }) {
  const [entrada, setEntrada] = useState("");
  const [state, action, pending] = useActionState(saveAnalysis, {});

  return (
    <main className="pagina pagina-autenticada">
      <section className="cartao">
        <h1>{TEXTOS.titulo}</h1>
        <p className="subtitulo">{TEXTOS.subtitulo}</p>

        <form action={action}>
          <label htmlFor="entrada" className="rotulo">
            Seu texto
          </label>
          <textarea
            id="entrada"
            name="texto"
            maxLength={20000}
            value={entrada}
            onChange={(event) => setEntrada(event.target.value)}
            placeholder="Escreva aqui..."
            rows={6}
          />

          <button type="submit" disabled={pending}>
            {pending ? "Salvando…" : TEXTOS.botao}
          </button>
        </form>
        {state.error && <p className="erro" role="alert">{state.error}</p>}
        {state.message && <p role="status">{state.message}</p>}

        <div className="resposta" aria-live="polite">
          {state.analysis?.resultado}
        </div>
      </section>
      <section className="cartao historico" aria-labelledby="titulo-historico">
        <h2 id="titulo-historico">Suas análises salvas</h2>
        <p>Até 20 análises mais recentes.</p>
        {historyError ? <p className="erro" role="alert">{historyError}</p> : (
          analises.length ? (
            <ol className="lista-analises">
              {analises.map(analise => (
                <li key={analise.id}>
                  <p className="texto-salvo">{analise.texto}</p>
                  <details>
                    <summary>Ver resultado</summary>
                    <p className="texto-salvo">{analise.resultado}</p>
                  </details>
                </li>
              ))}
            </ol>
          ) : <p>Você ainda não tem análises salvas.</p>
        )}
      </section>
    </main>
  );
}
