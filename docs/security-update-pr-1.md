# Correção de segurança da PR #1

## Por que a PR não podia ser mesclada

A PR da Vercel foi criada sobre uma versão antiga do projeto (base `ff90faa`). Ela alterava Next.js de 15.5.6 para 15.5.9 e criava seu próprio `package-lock.json`.

Enquanto isso, `main` avançou para `894605d`: Next.js 15.5.7, Supabase Auth, OpenRouter, histórico, Playwright e Node.js 24. O Git reproduziu dois conflitos reais:

- `package.json`: conflito de conteúdo, porque a versão do Next.js mudou nas duas branches.
- `package-lock.json`: conflito `add/add`, porque ambas criaram o arquivo depois da base comum, com árvores de dependências diferentes.

Além disso, a PR estava em rascunho. Resolver conflitos não retira automaticamente esse estado.

## Correção

A branch original da PR recebeu um merge de `main`, preservando o histórico do bot. Os dois manifestos atuais de `main` foram usados como ponto de partida, e o npm regenerou somente as mudanças necessárias na árvore.

| Dependência | Main antes | Correção |
| --- | --- | --- |
| Next.js | 15.5.7 | 15.5.28 |
| PostCSS, transitivo do Next.js | 8.4.31 | 8.5.32 |
| Sharp, opcional do Next.js | 0.34.5 | 0.35.5 |
| React / React DOM | 19.1.0 | Preservados |
| `@supabase/ssr` | 0.12.7 | Preservado |
| `@supabase/supabase-js` | 2.118.0 | Preservado |
| `@playwright/test` | 1.64.1 | Preservado |

A versão 15.5.9 proposta originalmente ainda aparece nas faixas afetadas por avisos de segurança disponíveis no registro npm. Por isso, a correção usa o patch 15.5.28, mantendo a linha 15.5 e evitando uma migração de versão principal.

O Next.js 15.5.28 ainda fixa PostCSS 8.4.31. Um `override` limitado a `next.postcss` seleciona PostCSS 8.5.32, da mesma versão principal, para corrigir os avisos dessa dependência. Sharp 0.35.5 já é aceito pela faixa opcional publicada pelo Next.js; foi atualizado pelo npm sem criar uma nova dependência direta.

React e React DOM satisfazem os requisitos de compatibilidade publicados pelo Next.js. Não foi necessário adicionar pacotes `react-server-dom-*`: a implementação RSC usada pelo framework é atualizada com o próprio Next.js.

Scripts, configuração Node.js 24, todas as outras dependências diretas e código da aplicação permanecem iguais a `main`. O diff final contra `main` limita-se a `package.json`, `package-lock.json` e este relatório.

## Validações executadas

Ambiente: Node.js 24.19.0, npm 11.9.0, Chromium local.

- `npm ci --include=dev --strict-peer-deps --cache /workspace/.npm-cache --no-audit --no-fund`: passou a partir do lockfile final; sem conflitos de requisitos de dependências.
- Comparação automatizada entre `package.json`, a raiz do lockfile, versões instaladas e manifestos de `main`: passou; Supabase, Playwright, React, scripts e engines preservados.
- `npm ls --depth=0` e `npm ls postcss sharp`: saída 0; versões esperadas. O npm 11 também instala duas dependências opcionais do Sharp para WASM como `extraneous` no Linux (`@img/sharp-wasm32` e `@emnapi/runtime`). Elas permanecem no lockfile porque são dependências das variantes FreeBSD/WebContainers; não são dependências diretas novas nem incompatibilidades entre os manifestos.
- `node --test tests/unit/*.test.mjs`: **31 passaram**.
- `AUTH_TEST_MODE=production PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:auth`: build de produção e **14 testes de navegador passaram**. Cobrem login, cadastro, saída, isolamento por conta, histórico, paginação, estados do botão e erros da API.
- `AUTH_TEST_MODE=production AUTH_TEST_CONFIG=invalid-url PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:auth`: build e **2 testes passaram**, sem erro 500 quando a URL do Supabase é inválida.
- Sharp: criação, redimensionamento e leitura de uma imagem PNG 4×4 passaram com a biblioteca nativa instalada.
- `git diff --check`: passou.

Os testes de navegador simulam Supabase e OpenRouter; não enviam mensagens a uma IA real, não criam contas reais e não alteram dados de produção. O projeto não tem um script independente de lint/typecheck; as verificações existentes do `next build` foram executadas.

## Auditoria

`npm audit --include=dev --package-lock-only --json`, consultado em 29/10/2026:

- Main: **3 pacotes sinalizados** — 1 crítico e 2 altos (`next`, `postcss`, `sharp`). Cada pacote pode reunir vários avisos/CVEs.
- Lockfile corrigido: **0 alertas**, incluindo desenvolvimento.

A auditoria reflete os avisos conhecidos pelo registro consultado; não é uma garantia de ausência de toda vulnerabilidade possível.

Referências:

- [PR #1](https://github.com/LaviniaVeleiros26/Saudavel-IA/pull/1)
- [Aviso RSC citado pela PR original](https://github.com/advisories/GHSA-9qr9-h5gf-34mp)
- [Aviso de PostCSS](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp)
- [Aviso de Sharp](https://github.com/advisories/GHSA-wq5f-xc86-pv6w)
