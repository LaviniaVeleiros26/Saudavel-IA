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

  return (
    <>
      <header className="topo">
        <span>{user.email}</span>
        <SignOutButton />
      </header>
      <Analisador />
    </>
  );
}
