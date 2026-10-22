export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server";
import Analisador from "./components/analisador";
import SignOutButton from "./components/sign-out-button";

export default async function Home() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let analises = [];
  let historyError = null;
  try {
    const { data, error } = await supabase
      .from("planodesite")
      .select("id,texto:Texto,resultado,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) historyError = "Não foi possível carregar suas análises salvas. Tente atualizar a página em instantes.";
    else analises = data || [];
  } catch {
    historyError = "Não foi possível conectar ao serviço para carregar suas análises.";
  }

  return (
    <>
      <header className="topo">
        <span>{user.email}</span>
        <SignOutButton />
      </header>
      <Analisador analises={analises} historyError={historyError} />
    </>
  );
}
