"use client";

import { useState } from "react";

const TEXTOS = {
  titulo: "Saudável IA",
  subtitulo: "Digite um texto abaixo e clique em Analisar.",
  botao: "Analisar",
};

export default function Analisador() {
  const [entrada, setEntrada] = useState("");
  const [resposta, setResposta] = useState("");

  function analisar() {
    setResposta(entrada);
  }

  return (
    <main className="pagina pagina-autenticada">
      <section className="cartao">
        <h1>{TEXTOS.titulo}</h1>
        <p className="subtitulo">{TEXTOS.subtitulo}</p>

        <label htmlFor="entrada" className="rotulo">
          Seu texto
        </label>
        <textarea
          id="entrada"
          value={entrada}
          onChange={(event) => setEntrada(event.target.value)}
          placeholder="Escreva aqui..."
          rows={6}
        />

        <button type="button" onClick={analisar}>
          {TEXTOS.botao}
        </button>

        <div className="resposta" aria-live="polite">
          {resposta}
        </div>
      </section>
    </main>
  );
}
