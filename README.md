# Saudável IA

Projeto Next.js com App Router e JavaScript, preparado para publicação na Vercel.

## Rodar localmente

1. Instale as dependências:
   npm install
2. Inicie o projeto:
   npm run dev
3. Abra http://localhost:3000

As cores ficam no topo de `app/globals.css` e os textos principais ficam no objeto `TEXTOS` em `app/components/analisador.js`.

## Login com Supabase

1. Crie um projeto Supabase e habilite o provedor **Email** em Authentication → Sign In / Providers.
2. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com a URL e a chave pública publishable (`sb_publishable_…`) do projeto. A chave legada `anon` também é aceita usando `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Basta configurar uma das duas chaves; se ambas estiverem definidas, a publishable tem prioridade. Nunca use a chave `service_role`.
3. Em Authentication → URL Configuration, configure a Site URL do site e adicione `http://localhost:3000/auth/callback` às Redirect URLs para desenvolvimento. Adicione também a URL `/auth/callback` do domínio de produção.
4. Reinicie o servidor após configurar as variáveis. Para produção, defina as variáveis antes de executar `npm run build`.

A página `/login` permite entrar e criar conta por e-mail e senha. Se a confirmação de e-mail estiver habilitada, a usuária deve abrir o link recebido no mesmo navegador em que iniciou o cadastro para concluir o fluxo PKCE. Quando a confirmação estiver desabilitada, o cadastro entra diretamente. A página `/` verifica a identidade no servidor, redireciona visitantes sem sessão para `/login` e mostra o e-mail da usuária e o botão Sair. O middleware renova os cookies da sessão.

## Testes de autenticação

Execute `npx playwright install chromium` uma vez e depois `npm run test:auth`. Se já houver Chromium instalado, informe seu caminho, por exemplo: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:auth`.

Os testes usam um provedor Supabase simulado localmente, nas portas 54321 e 3100, e cobrem proteção de rota, validações em português, confirmação pendente, persistência da sessão, saída e link de confirmação inválido. Não criam contas reais. O envio de e-mail e a autenticação no projeto real precisam ser verificados após configurar as variáveis.

Se o login informar configuração incompleta, a mensagem lista apenas os **nomes** das variáveis ausentes na implantação atual, sem mostrar seus valores. Confira os nomes exatos na Vercel, o escopo Production/Preview e faça um novo deploy. Se ainda aparecer a mensagem antiga "O acesso ainda não está configurado", confira se abriu a implantação do commit mais recente. Para testar o diagnóstico localmente: `node --test tests/unit/supabase-config.test.mjs`.

Os testes de navegador usam a variável publishable por padrão. Para validar a compatibilidade legada, execute `AUTH_TEST_KEY_TYPE=anon npm run test:auth` (adicione `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` se necessário).

## Textos e resultados salvos

O botão **Analisar** salva o texto e o resultado na tabela `public.planodesite`. O servidor verifica a usuária logada e preenche `user_id` com seu identificador. A página exibe até 20 registros recentes dessa usuária e mantém o histórico após atualizar. Uma falha na gravação mostra uma mensagem em português sem confirmar sucesso. A função de análise atual continua retornando o texto digitado; não há integração com um modelo de IA.

A tabela já criada no painel deve conter estas colunas (a grafia é importante):

| Coluna | Tipo | Configuração |
| --- | --- | --- |
| `id` | `int8` | Chave primária com identidade automática |
| `created_at` | `timestamptz` | Padrão `now()` |
| `user_id` | `uuid` | Padrão `auth.uid()`; o código também envia o ID validado |
| `Texto` | `text` | T maiúsculo, conforme a tabela existente |
| `resultado` | `text` | Resultado da análise |

Mantenha RLS ativado e as políticas para o papel `authenticated`: SELECT com `USING (auth.uid() = user_id)` e INSERT com `WITH CHECK (auth.uid() = user_id)`. Não são necessárias políticas UPDATE/DELETE para este fluxo.

Para validar no projeto real após o deploy: entre no site, digite um texto de teste e clique em Analisar. Aguarde **Análise salva com sucesso**, atualize a página e confirme o registro no histórico e no Table Editor do Supabase. Os testes automatizados usam um serviço simulado; não alteram dados do projeto real e não comprovam as políticas instaladas nele.
