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
  };
  return messages[error?.code] || "Não foi possível concluir a solicitação. Tente novamente em instantes.";
}
