const { test, expect } = require("@playwright/test");
const http = require("node:http");
const { randomUUID } = require("node:crypto");

// Simulates the provider boundary; these tests never contact a real Supabase project.
const user = { id: "11111111-1111-4111-8111-111111111111", email: "teste@example.com", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
const otherUser = { ...user, id: "22222222-2222-4222-8222-222222222222", email: "outra@example.com" };
const tokens = new Map();
const records = [];
let provider;

test.beforeAll(async () => {
  provider = http.createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    const path = new URL(req.url, "http://localhost").pathname;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Supabase-Api-Version", "2024-01-01");
    res.setHeader("Access-Control-Allow-Origin", "*");
    if ((path.endsWith("/token") || path.endsWith("/signup")) && body.email === "chave-invalida@example.com") {
      res.statusCode = 401;
      return res.end(JSON.stringify({ message: "Invalid API key" }));
    }
    if (path.endsWith("/token") && [user.email, otherUser.email].includes(body.email) && body.password === "senha-correta") {
      const account = body.email === user.email ? user : otherUser;
      const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
      const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: account.id, exp: Math.floor(Date.now() / 1000) + 3600, aud: "authenticated", session_id: randomUUID() })}.test-signature`;
      tokens.set(token, account);
      return res.end(JSON.stringify({ access_token: token, refresh_token: "test-refresh", token_type: "bearer", expires_in: 3600, user: account }));
    }
    if (path.endsWith("/signup") && body.email === "erro-confirmacao@example.com") {
      res.statusCode = 500;
      return res.end(JSON.stringify({ code: "unexpected_failure", msg: "Error sending confirmation email" }));
    }
    if (path.endsWith("/signup")) return res.end(JSON.stringify({ ...user, email: body.email, identities: [] }));
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (path.endsWith("/user") && tokens.has(token)) return res.end(JSON.stringify(tokens.get(token)));
    if (path === "/rest/v1/planodesite") {
      const account = tokens.get(token);
      const url = new URL(req.url, "http://localhost");
      if (!account) {
        res.statusCode = 401;
        return res.end(JSON.stringify({ code: "42501" }));
      }
      if (url.searchParams.get("select") !== "id,texto:Texto,resultado,created_at") {
        res.statusCode = 400;
        return res.end(JSON.stringify({ code: "PGRST204" }));
      }
      if (req.method === "POST") {
        if (body.user_id !== account.id || body.Texto === "Simular falha de gravação") {
          res.statusCode = 403;
          return res.end(JSON.stringify({ code: "42501" }));
        }
        if (!Object.hasOwn(body, "Texto") || Object.hasOwn(body, "texto")) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ code: "PGRST204" }));
        }
        const record = { id: records.length + 1, created_at: new Date().toISOString(), ...body };
        records.push(record);
        res.statusCode = 201;
        return res.end(JSON.stringify({ id: record.id, created_at: record.created_at, texto: record.Texto, resultado: record.resultado }));
      }
      if (url.searchParams.get("user_id") !== `eq.${account.id}`) {
        res.statusCode = 403;
        return res.end(JSON.stringify({ code: "42501" }));
      }
      return res.end(JSON.stringify(records.filter(record => record.user_id === account.id).slice(-20).reverse().map(record => ({ id: record.id, created_at: record.created_at, texto: record.Texto, resultado: record.resultado }))));
    }
    if (path.endsWith("/logout") && tokens.has(token)) {
      tokens.delete(token);
      res.statusCode = 204;
      return res.end();
    }
    res.statusCode = 400;
    res.end(JSON.stringify({ code: "invalid_credentials", msg: "Invalid login credentials" }));
  });
  await new Promise((resolve, reject) => {
    provider.once("error", reject);
    provider.listen(54321, "127.0.0.1", resolve);
  });
});
test.afterAll(async () => { if (provider?.listening) await new Promise(resolve => provider.close(resolve)); });

test("visitantes são redirecionadas e recebem validação em português", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel("Seu texto", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText("Informe um endereço de e-mail válido.");
  await page.getByLabel("E-mail", { exact: true }).fill(user.email);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText("Informe sua senha.");
  await page.getByLabel("Senha", { exact: true }).fill("errada");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText("E-mail ou senha incorretos.");
});

test("cadastro valida a senha e orienta a confirmação do e-mail", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("nova@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("123");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText("A senha deve ter pelo menos 6 caracteres.");
  await page.getByLabel("Senha", { exact: true }).fill("senha-segura");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("e-mail de confirmação");
  await expect(page).toHaveURL(/\/login$/);
});

test("login persiste sessão, mostra o e-mail, permite análise e sair", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(user.email);
  await page.getByLabel("Senha", { exact: true }).fill("senha-correta");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  await expect(page.locator("header")).toContainText(user.email);
  await page.reload();
  await expect(page.locator("header")).toContainText(user.email);
  await page.goto("/login");
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  await page.getByLabel("Seu texto", { exact: true }).fill("Olá, saúde!");
  await page.getByRole("button", { name: "Analisar", exact: true }).click();
  await expect(page.locator(".resposta")).toHaveText("Olá, saúde!");
  await expect(page.getByRole("status")).toContainText("Análise salva com sucesso.");
  await page.reload();
  await expect(page.getByRole("region", { name: "Suas análises salvas" })).toContainText("Olá, saúde!");
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("link de confirmação inválido apresenta mensagem em português", async ({ page }) => {
  await page.goto("/auth/callback?code=invalido");
  await expect(page).toHaveURL(/\/login\?erro=confirmacao$/);
  await expect(page.locator("form").getByRole("alert")).toContainText("Não foi possível confirmar seu e-mail.");
});


test("chave rejeitada pelo provedor apresenta orientação em português", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("chave-invalida@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha-teste");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("A chave pública do Supabase não foi aceita.");
  await expect(page.locator("form").getByRole("alert")).toContainText("somente a chave");
});


test("cadastro com chave rejeitada apresenta orientação em português", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("chave-invalida@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha-teste");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("A chave pública do Supabase não foi aceita.");
});

test("falha no envio de confirmação durante cadastro apresenta orientação em português", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("erro-confirmacao@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha-teste");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("Não foi possível enviar o e-mail de confirmação.");
});


async function loginAs(page, email) {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("senha-correta");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
}

test("cada conta consulta apenas seu histórico e o texto é exibido literalmente", async ({ page, browser }) => {
  await loginAs(page, user.email);
  const text = `Texto particular ${randomUUID()}\n<em>Texto literal</em>`;
  await page.getByLabel("Seu texto", { exact: true }).fill(text);
  await page.getByRole("button", { name: "Analisar", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Análise salva com sucesso.");
  await page.reload();
  const history = page.getByRole("region", { name: "Suas análises salvas" });
  await expect(history).toContainText(text);
  await expect(history.locator("em")).toHaveCount(0);
  const context = await browser.newContext();
  try {
    const otherPage = await context.newPage();
    await loginAs(otherPage, otherUser.email);
    await expect(otherPage.getByRole("region", { name: "Suas análises salvas" })).not.toContainText(text);
    await expect(otherPage.getByRole("region", { name: "Suas análises salvas" })).toContainText("Você ainda não tem análises salvas.");
  } finally { await context.close(); }
});

test("texto vazio e falha de gravação não produzem confirmação de sucesso", async ({ page }) => {
  await loginAs(page, user.email);
  await page.getByRole("button", { name: "Analisar", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toHaveText("Digite um texto antes de analisar.");
  await page.getByLabel("Seu texto", { exact: true }).fill("Simular falha de gravação");
  await page.getByRole("button", { name: "Analisar", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("sua conta não tem permissão");
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("region", { name: "Suas análises salvas" })).not.toContainText("Simular falha de gravação");
});
