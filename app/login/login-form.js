"use client";

import { useActionState, useState } from "react";
import { authenticate } from "./actions";

export default function LoginForm({ confirmationError, configurationError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, action, pending] = useActionState(authenticate, {});
  return (
    <form action={action} noValidate>
      <label className="rotulo" htmlFor="email">E-mail</label>
      <input id="email" name="email" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required />
      <label className="rotulo campo-senha" htmlFor="password">Senha</label>
      <input id="password" name="password" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required />
      <p className="ajuda">Para criar uma conta, use uma senha com pelo menos 6 caracteres.</p>
      <div className="acoes-login">
        <button name="intent" value="login" disabled={pending}>Entrar</button>
        <button name="intent" value="signup" disabled={pending}>Criar conta</button>
      </div>
      <div aria-live="polite" aria-atomic="true">
        {pending && <p>Por favor, aguarde…</p>}
        {(state.error || configurationError || confirmationError) && <p className="erro" role="alert">{state.error || configurationError || confirmationError}</p>}
        {state.message && <p role="status">{state.message}</p>}
      </div>
    </form>
  );
}
