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
      <section className="cartao">
        <h1>{desafio.nome}</h1>
        <p className="subtitulo">{desafio.subtitulo}</p>
        <form onSubmit={analisar}>
          {desafio.campos.map(field => (
            <div className="campo-desafio" key={field.id}>
              <label htmlFor={field.id} className="rotulo">{field.rotulo}</label>
              <textarea
                id={field.id}
                name={field.id}
                rows={field.linhas}
                maxLength={20000}
                value={campos[field.id]}
                onChange={event => setCampos(previous => ({ ...previous, [field.id]: event.target.value }))}
              />
            </div>
          ))}
          <button type="submit" disabled={pending}>{pending ? "Analisando..." : desafio.botao}</button>
          <p className="aviso">{desafio.aviso}</p>
        </form>
        {erro && <p className="erro" role="alert">{erro}</p>}
        {mensagem && <p role="status">{mensagem}</p>}
        <div className="resposta" aria-live="polite" aria-busy={pending}>{resposta}</div>
      </section>
    </main>
  );
}
