import { test } from "node:test";
import assert from "node:assert/strict";
import { createServerClient } from "@supabase/ssr";

test("o runtime Node do projeto inicializa o Supabase sem abrir conexão Realtime", async () => {
  assert.equal(Number(process.versions.node.split(".")[0]), 24);
  assert.equal(typeof globalThis.WebSocket, "function");
  const client = createServerClient("https://example.supabase.co", "sb_publishable_test-key", {
    cookies: { getAll: () => [], setAll() {} },
  });
  const { data, error } = await client.auth.getSession();
  assert.equal(error, null);
  assert.equal(data.session, null);
  assert.equal(client.realtime.getChannels().length, 0);
});
