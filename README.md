# Saudável IA

Projeto Next.js com App Router e JavaScript, preparado para publicação na Vercel.

## Rodar localmente

1. Instale as dependências:
   npm install
2. Inicie o projeto:
   npm run dev
3. Abra http://localhost:3000

As cores ficam no topo de `app/globals.css` e o título, os campos, o aviso e a configuração de IA ficam em `desafio.js`.

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

O botão **Analisar mensagem** salva o texto e o resultado na tabela `public.planodesite`. O servidor verifica a usuária logada e preenche `user_id` com seu identificador. A página exibe até 20 registros recentes dessa usuária e mantém o histórico após atualizar. Uma falha na gravação mostra uma mensagem em português sem confirmar sucesso. A análise usa a rota de servidor `/api/ia`; com `modoTeste: true` em `desafio.js`, retorna um exemplo identificado como teste, sem chamar a OpenRouter.

A tabela já criada no painel deve conter estas colunas (a grafia é importante):

| Coluna | Tipo | Configuração |
| --- | --- | --- |
| `id` | `int8` | Chave primária com identidade automática |
| `created_at` | `timestamptz` | Padrão `now()` |
| `user_id` | `uuid` | Padrão `auth.uid()`; o código também envia o ID validado |
| `Texto` | `text` | T maiúsculo, conforme a tabela existente |
| `resultado` | `text` | Resultado da análise |

Mantenha RLS ativado e as políticas para o papel `authenticated`: SELECT com `USING (auth.uid() = user_id)` e INSERT com `WITH CHECK (auth.uid() = user_id)`. Não são necessárias políticas UPDATE/DELETE para este fluxo.

Para validar no projeto real após o deploy: entre no site, digite um texto de teste e clique em Analisar mensagem. Aguarde **Análise salva com sucesso**, atualize a página e confirme o registro no histórico e no Table Editor do Supabase. Os testes automatizados usam um serviço simulado; não alteram dados do projeto real e não comprovam as políticas instaladas nele.

## Runtime da Vercel

O projeto usa Node.js **24.x**, definido em `package.json`. O middleware também usa o runtime `nodejs`: a versão instalada do cliente Supabase exige um construtor WebSocket ao inicializar, indisponível no runtime Edge da Vercel. O middleware continua renovando os cookies e a página principal continua verificando a identidade no servidor.

Para reproduzir build e testes com a aplicação em produção e um Supabase simulado: `AUTH_TEST_MODE=production PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:auth`. Esse comando compila e inicia a aplicação com valores de teste; não use seu artefato `.next` em produção. O deploy da Vercel deve compilar com as variáveis do projeto real.

Se os registros da Vercel mostrarem `Invalid supabaseUrl`, edite `NEXT_PUBLIC_SUPABASE_URL`: o campo Valor deve conter somente a URL completa HTTP/HTTPS do projeto, sem `NEXT_PUBLIC_SUPABASE_URL=`, sem aspas e sem a chave pública. A aplicação valida esse formato antes de inicializar o Supabase e mostra uma orientação em português sem liberar acesso à página principal. O cenário de configuração inválida pode ser verificado com `AUTH_TEST_MODE=production AUTH_TEST_CONFIG=invalid-url PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:auth`.


## Desafio “Isso é golpe?” e OpenRouter

`desafio.js` define `nome`, `subtitulo`, `botao`, `campos`, `aviso`, `prompt`, `modelo` e `modoTeste`. Cada campo gera um textarea e seu valor substitui `{id}` no prompt, sem substituições recursivas. As quebras de linha do aviso são representadas por `\n` para manter a string JavaScript válida.

O formulário chama `POST /api/ia` com um objeto JSON de campos, por exemplo `{ "mensagem": "mensagem recebida" }`. A rota exige uma sessão válida, valida até 20.000 caracteres no total, usa somente a configuração de servidor e devolve `text/plain` sem JSON. A resposta e os campos são salvos na conta antes de confirmar sucesso; o histórico é atualizado. Login e cabeçalho continuam os mesmos.

O modo de teste está ligado e não precisa de chave da IA. Para chamar a IA real, configure **OPENROUTER_API_KEY** nas variáveis do projeto da Vercel (ou `.env.local` para desenvolvimento), mude `modoTeste` para `false` e publique um novo deploy. A chave fica apenas no servidor; nunca use prefixo `NEXT_PUBLIC_` para ela. A chamada usa `https://openrouter.ai/api/v1/chat/completions`, o modelo definido no arquivo e `max_tokens: 900`. A rota preserva os status 401 e 429 e traduz as mensagens. Limites e créditos reais são administrados pela OpenRouter; a aplicação não implementa um contador diário próprio.

Os testes unitários de IA rodam com `node --test tests/unit/ia.test.mjs` e simulam as respostas da OpenRouter, incluindo erros; nenhuma chamada real é feita. Os testes de navegador em produção cobrem o modo de teste, o salvamento, o histórico por conta, o estado do botão e as mensagens 401/429.
