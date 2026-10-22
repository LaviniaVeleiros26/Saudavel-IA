const { test, expect } = require("@playwright/test");

for (const button of ["Entrar", "Criar conta"]) {
  test(`URL inválida mostra orientação em português sem erro 500: ${button}`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const response = await page.goto("/");
    expect(response.status()).toBe(200);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByLabel("Cole aqui a mensagem que você recebeu", { exact: true })).toHaveCount(0);
    const alert = page.locator("form").getByRole("alert");
    await expect(alert).toContainText("NEXT_PUBLIC_SUPABASE_URL está inválida.");
    await page.getByLabel("E-mail", { exact: true }).fill("teste@example.com");
    await page.getByLabel("Senha", { exact: true }).fill("senha-teste");
    await page.getByRole("button", { name: button, exact: true }).click();
    await expect(page.getByRole("button", { name: button, exact: true })).toBeEnabled();
    await expect(alert).toContainText("sem sinal de igual");
    const reload = await page.reload();
    expect(reload.status()).toBe(200);
    expect(errors).toEqual([]);
  });
}
