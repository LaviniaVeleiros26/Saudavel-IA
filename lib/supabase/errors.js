export function authError(error) {
  const messages = {
    invalid_credentials: "E-mail ou senha incorretos.",
    email_not_confirmed: "Confirme seu e-mail antes de entrar.",
    user_already_exists: "Já existe uma conta com este e-mail.",
    email_exists: "Já existe uma conta com este e-mail.",
    signup_disabled: "A criação de contas está desativada no momento.",
    email_provider_disabled: "O acesso por e-mail está desativado no momento.",
    weak_password: "Escolha uma senha mais forte, conforme os requisitos de segurança.",
    over_email_send_rate_limit: "Muitos e-mails foram solicitados. Aguarde antes de tentar novamente.",
    over_request_rate_limit: "Muitas tentativas. Aguarde um pouco e tente novamente.",
    email_address_invalid: "Informe um endereço de e-mail válido.",
    email_address_not_authorized: "Não foi possível enviar a confirmação para este e-mail.",
    validation_failed: "Verifique o e-mail e a senha informados.",
    session_not_found: "Sua sessão expirou. Entre novamente.",
    unexpected_failure: "O serviço de acesso encontrou um erro interno. Tente novamente em instantes.",
  };
  // Gateway and older Auth responses may have no machine-readable code.
  // Recognize known messages, but never display the raw provider response.
  const message = typeof error?.message === "string" ? error.message : "";
  if (/error sending confirmation email/i.test(message)) {
    return "Não foi possível enviar o e-mail de confirmação. A responsável pelo site deve conferir a configuração de envio de e-mails no Supabase antes de tentar novamente.";
  }
  if (/email rate limit exceeded/i.test(message)) return messages.over_email_send_rate_limit;
  if (messages[error?.code]) return messages[error.code];
  if (/invalid (?:api[ _-]?key|publishable key)|no api[ _-]?key found/i.test(message)
    || error?.code === "invalid_api_key" || error?.status === 401) {
    return "A chave pública do Supabase não foi aceita. Confira se a URL e a chave pública pertencem ao mesmo projeto e se o campo Valor na Vercel contém somente a chave, sem o nome da variável nem o sinal de igual.";
  }
  if (/invalid login credentials/i.test(message)) return messages.invalid_credentials;
  if (/email not confirmed/i.test(message)) return messages.email_not_confirmed;
  if (/user already registered/i.test(message)) return messages.user_already_exists;
  if (error?.status === 429) return messages.over_request_rate_limit;
  if (error?.name === "AuthRetryableFetchError" || /failed to fetch|fetch failed|network request failed/i.test(message)) {
    return "Não foi possível conectar ao Supabase. Confira a URL do projeto e se ele está ativo, e tente novamente.";
  }
  if (Number.isInteger(error?.status) && error.status >= 500) {
    return `O serviço de acesso está indisponível no momento (HTTP ${error.status}). Confira se o projeto Supabase está ativo e tente novamente.`;
  }

  const reference = [];
  if (Number.isInteger(error?.status) && error.status >= 400 && error.status <= 599) {
    reference.push(`HTTP ${error.status}`);
  }
  if (typeof error?.code === "string" && /^[a-z_]{1,64}$/.test(error.code)) {
    reference.push(`código ${error.code}`);
  }
  return `Não foi possível concluir a solicitação. Tente novamente em instantes.${reference.length ? ` Referência para suporte: ${reference.join("; ")}.` : ""}`;
}
