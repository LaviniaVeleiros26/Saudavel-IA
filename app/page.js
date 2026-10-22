export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server";
import Analisador from "./components/analisador";
import SiteHeader from "./components/site-header";

export default async function Home() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <SiteHeader email={user.email} />
      <Analisador />
    </>
  );
}
