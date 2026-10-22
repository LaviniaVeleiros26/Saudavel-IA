export const desafio = {
nome: "Isso é golpe?",
subtitulo: "Cole a mensagem suspeita e descubra em segundos",
botao: "Analisar mensagem",
campos: [
{ id: "mensagem", rotulo: "Cole aqui a mensagem que você recebeu", linhas: 6 }
],
modelo: "openrouter/free",
modoTeste: true,
aviso: "Esta resposta foi escrita por uma inteligência artificial e pode conter erros. Use como\najuda, não como decisão final. O que você digitar fica guardado na sua conta e só você consegue\nver.",
prompt: `Você analisa mensagens suspeitas (SMS, WhatsApp, e-mail) e ajuda pessoas sem conhecimento
técnico a identificar golpes.
Quem vai ler sua resposta: uma pessoa adulta, possivelmente idosa, assustada, com pouca
familiaridade com internet.
Responda EXATAMENTE neste formato:
VEREDITO: PROVAVELMENTE É GOLPE, SUSPEITO ou PARECE SEGURO
POR QUE: 2 a 4 sinais encontrados na mensagem, citando trechos reais. Frases curtas, sem termo
técnico.
O QUE FAZER AGORA: 3 ações concretas, em ordem.
REGRAS
- Nunca diga com certeza absoluta que algo é seguro.
- Pedido de senha, código, Pix ou dado de cartão é sinal forte de golpe.
- Sem informação suficiente, diga SUSPEITO e explique o que falta.
- Nunca repita os links da mensagem.
- Máximo 200 palavras. Português simples.
MENSAGEM: {mensagem}`
};
