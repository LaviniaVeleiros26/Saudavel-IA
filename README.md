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

## Respostas e histórico pessoal

O botão **Analisar mensagem** salva na tabela `public.respostas`, usando a sessão da usuária: `user_id` é obtido da identidade verificada no servidor; `entrada` reúne todos os campos na ordem configurada, cada um com seu rótulo e quebras de linha; `resposta` contém o texto retornado pela IA (ou o exemplo do modo de teste). A API confirma sucesso somente após salvar.

O link **Meu histórico**, ao lado de Sair, abre `/historico`. A página exige login e consulta somente o `user_id` da sessão. Exibe entrada e resposta completas, com quebras de linha, data e hora de Brasília, da mais recente para a mais antiga. Há 50 registros por página e links para Anterior/Próxima, sem limitar o acesso aos registros mais antigos. A ordenação usa `created_at` e, em caso de empate, `id`, ambos decrescentes.

### Preparar o Supabase

No painel do mesmo projeto Supabase, abra **SQL Editor → New query**, cole o conteúdo de [`supabase/respostas.sql`](supabase/respostas.sql) e clique em **Run**. O arquivo cria a tabela se necessário ou adiciona as colunas ausentes a uma tabela existente:

| Coluna | Tipo | Finalidade |
| --- | --- | --- |
| `id` | `bigint` | Identificador automático |
| `created_at` | `timestamptz` | Data e hora, padrão `now()` |
| `user_id` | `uuid` | Conta proprietária, referência a `auth.users` |
| `entrada` | `text` | Campos com seus rótulos |
| `resposta` | `text` | Texto da IA |

O script ativa RLS, permite SELECT/INSERT aos usuários autenticados e exige `auth.uid() = user_id`. Uma política restritiva também protege contra regras permissivas antigas. O script pode ser repetido e não apaga registros. Registros antigos sem proprietário continuam preservados, mas não aparecem nas contas; o script não adivinha a quem pertencem. Dados na antiga `planodesite` não são migrados automaticamente.

O SQL foi validado em PostgreSQL local embutido (PGlite), em tabela nova e existente, incluindo execução repetida, preservação dos registros antigos, separação entre duas contas e bloqueio de usuários anônimos mesmo com uma regra permissiva antiga. Essa validação usa uma função `auth.uid()` simulada e não substitui a aplicação e a verificação no seu projeto Supabase.

Depois do deploy, entre no site, envie uma mensagem e aguarde **Análise salva com sucesso**. Abra **Meu histórico** e confira entrada, resposta e data/hora. Os testes automatizados de navegador usam um serviço simulado; não alteram dados do projeto real.

## Runtime da Vercel

O projeto usa Node.js **24.x**, definido em `package.json`. O middleware também usa o runtime `nodejs`: a versão instalada do cliente Supabase exige um construtor WebSocket ao inicializar, indisponível no runtime Edge da Vercel. O middleware continua renovando os cookies e a página principal continua verificando a identidade no servidor.

Para reproduzir build e testes com a aplicação em produção e um Supabase simulado: `AUTH_TEST_MODE=production PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:auth`. Esse comando compila e inicia a aplicação com valores de teste; não use seu artefato `.next` em produção. O deploy da Vercel deve compilar com as variáveis do projeto real.

Se os registros da Vercel mostrarem `Invalid supabaseUrl`, edite `NEXT_PUBLIC_SUPABASE_URL`: o campo Valor deve conter somente a URL completa HTTP/HTTPS do projeto, sem `NEXT_PUBLIC_SUPABASE_URL=`, sem aspas e sem a chave pública. A aplicação valida esse formato antes de inicializar o Supabase e mostra uma orientação em português sem liberar acesso à página principal. O cenário de configuração inválida pode ser verificado com `AUTH_TEST_MODE=production AUTH_TEST_CONFIG=invalid-url PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:auth`.


## Desafio “Isso é golpe?” e OpenRouter

`desafio.js` define `nome`, `subtitulo`, `botao`, `campos`, `aviso`, `prompt`, `modelo` e `modoTeste`. Cada campo gera um textarea e seu valor substitui `{id}` no prompt, sem substituições recursivas. As quebras de linha do aviso são representadas por `\n` para manter a string JavaScript válida.

O formulário chama `POST /api/ia` com um objeto JSON de campos, por exemplo `{ "mensagem": "mensagem recebida" }`. A rota exige uma sessão válida, valida até 20.000 caracteres no total, usa somente a configuração de servidor e devolve `text/plain` sem JSON. A resposta e os campos são salvos na conta antes de confirmar sucesso; o histórico é atualizado. O login continua o mesmo; o cabeçalho inclui Meu histórico ao lado de Sair.

Com `modoTeste: true`, não é necessária chave da IA. A configuração atual foi alterada para `false` no GitHub e exige a chave no servidor. Para chamar a IA real, configure **OPENROUTER_API_KEY** nas variáveis do projeto da Vercel (ou `.env.local` para desenvolvimento), mude `modoTeste` para `false` e publique um novo deploy. A chave fica apenas no servidor; nunca use prefixo `NEXT_PUBLIC_` para ela. A chamada usa `https://openrouter.ai/api/v1/chat/completions`, o modelo definido no arquivo e `max_tokens: 900`. A rota preserva os status 401 e 429 e traduz as mensagens. Limites e créditos reais são administrados pela OpenRouter; a aplicação não implementa um contador diário próprio.

Os testes unitários de IA rodam com `node --test tests/unit/ia.test.mjs` e simulam as respostas da OpenRouter, incluindo erros; nenhuma chamada real é feita. Os testes de navegador em produção cobrem o modo de teste, o salvamento, o histórico por conta, o estado do botão e as mensagens 401/429.

Nos testes de navegador, a OpenRouter é interceptada no processo Node apenas pelo carregador `tests/mock-openrouter.cjs`, configurado em `NODE_OPTIONS` pelo Playwright. Assim, o fluxo com `modoTeste: false` também é exercitado sem chamadas externas, sem chave real e sem alterar `desafio.js`.
