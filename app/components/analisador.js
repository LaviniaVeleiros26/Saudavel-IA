"use client";

import { useState } from "react";
import { desafio } from "../../desafio";

export default function Analisador() {
  const [campos, setCampos] = useState(() => Object.fromEntries(desafio.campos.map(field => [field.id, ""])));
  const [pending, setPending] = useState(false);
  const [resposta, setResposta] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function analisar(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setErro("");
    setResposta("");
    setMensagem("");
    try {
      const response = await fetch("/api/ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campos),
      });
      const text = await response.text();
      if (!response.ok) {
        if (response.status === 429) setErro("Você atingiu o limite de uso de hoje.");
        else if (response.status === 401) setErro("Chave da IA inválida.");
        else setErro(response.headers.get("content-type")?.startsWith("text/plain") && text && text.length < 1000
          ? text : "Não foi possível analisar a mensagem. Tente novamente em instantes.");
        return;
      }
      setResposta(text);
      setMensagem("Análise salva com sucesso.");
    } catch {
      setErro("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="pagina pagina-autenticada">
      <section className="cartao cartao-analise">
        <div className="identidade-cartao">
          <span className="selo-folha" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M25 6C14 4 6 9 7 18c1 8 13 10 17 1 2-5 1-9 1-13Z" stroke="currentColor" strokeWidth="1.6" /><path d="M7 26 21 12m-8 8v-7m0 7h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg></span>
          <span>Saudável IA</span>
        </div>
        <h1>{desafio.nome}</h1>
        <p className="subtitulo">Um espaço para suas dúvidas sobre uma vida mais saudável.</p>
        <form onSubmit={analisar}>
          {desafio.campos.map(field => (
            <div className="campo-desafio" key={field.id}>
              <label htmlFor={field.id} className="rotulo">{field.rotulo}</label>
              <textarea
                id={field.id}
                name={field.id}
                rows={field.linhas}
                maxLength={20000}
                placeholder="Digite ou cole seu texto aqui..."
                value={campos[field.id]}
                onChange={event => setCampos(previous => ({ ...previous, [field.id]: event.target.value }))}
              />
            </div>
          ))}
          <button className="botao-analise" type="submit" disabled={pending}>
            {pending ? "Analisando..." : desafio.botao}
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <p className="aviso">{desafio.aviso}</p>
        </form>
        {erro && <p className="erro" role="alert">{erro}</p>}
        {mensagem && <p role="status">{mensagem}</p>}
        <section className="cartao-resposta" aria-label="Resposta da inteligência artificial">
          <div className="cabecalho-resposta">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
            <h2>Resposta da IA</h2>
          </div>
          {!resposta && <p className="resposta-vazia">Sua resposta aparecerá aqui, com espaço para ler com calma.</p>}
          <div className="resposta" aria-live="polite" aria-busy={pending}>{resposta}</div>
        </section>
      </section>
    </main>
  );
}
