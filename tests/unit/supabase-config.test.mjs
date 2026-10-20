import { test } from "node:test";
import assert from "node:assert/strict";
import { getSupabaseConfiguration, getConfigurationError } from "../../lib/supabase/config.mjs";

const urlName = "NEXT_PUBLIC_SUPABASE_URL";
const keyName = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

test("diagnóstico identifica variáveis ausentes sem expor valores", async (t) => {
  const original = { [urlName]: process.env[urlName], [keyName]: process.env[keyName] };
  try {
    for (const { name, url, key, missing } of [
      { name: "ambas ausentes", missing: [urlName, keyName] },
      { name: "somente chave ausente", url: "https://example.supabase.co", missing: [keyName] },
      { name: "somente URL ausente", key: "public-test-value", missing: [urlName] },
      { name: "valor em branco", url: "   ", key: "public-test-value", missing: [urlName] },
      { name: "configuração completa", url: "https://example.supabase.co", key: "public-test-value", missing: [] },
    ]) {
      await t.test(name, () => {
        delete process.env[urlName];
        delete process.env[keyName];
        if (url !== undefined) process.env[urlName] = url;
        if (key !== undefined) process.env[keyName] = key;
        assert.deepEqual(getSupabaseConfiguration().missing, missing);
        const message = getConfigurationError();
        if (!missing.length) return assert.equal(message, null);
        for (const variable of missing) assert.ok(message.includes(variable));
        assert.ok(message.includes("novo deploy"));
        assert.ok(!message.includes("public-test-value"));
        assert.ok(!message.includes("https://example.supabase.co"));
      });
    }
  } finally {
    for (const [name, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
