import { test } from "node:test";
import assert from "node:assert/strict";
import { getSupabaseConfiguration, getConfigurationError } from "../../lib/supabase/config.mjs";

const urlName = "NEXT_PUBLIC_SUPABASE_URL";
const anonName = "NEXT_PUBLIC_SUPABASE_ANON_KEY";
const publishableName = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
const missingKey = `${publishableName} ou ${anonName}`;

test("configuração aceita chaves públicas modernas e legadas sem expor valores", async (t) => {
  const original = Object.fromEntries([urlName, anonName, publishableName].map(name => [name, process.env[name]]));
  try {
    for (const { name, url, anon, publishable, missing, expectedKey } of [
      { name: "ambas ausentes", missing: [urlName, missingKey] },
      { name: "somente chave ausente", url: "https://example.supabase.co", missing: [missingKey] },
      { name: "somente URL ausente", anon: "anon-test-value", missing: [urlName] },
      { name: "valor em branco", url: "   ", anon: "anon-test-value", missing: [urlName] },
      { name: "chave anon legada", url: "https://example.supabase.co", anon: "anon-test-value", missing: [], expectedKey: "anon-test-value" },
      { name: "somente chave publishable", url: "https://example.supabase.co", publishable: "sb_publishable_test-value", missing: [], expectedKey: "sb_publishable_test-value" },
      { name: "publishable tem prioridade", url: "https://example.supabase.co", anon: "anon-test-value", publishable: "sb_publishable_test-value", missing: [], expectedKey: "sb_publishable_test-value" },
      { name: "publishable em branco usa anon", url: "https://example.supabase.co", anon: "anon-test-value", publishable: "  ", missing: [], expectedKey: "anon-test-value" },
      { name: "remove espaços nas extremidades", url: " https://example.supabase.co ", publishable: " sb_publishable_test-value\n", missing: [], expectedKey: "sb_publishable_test-value" },
    ]) {
      await t.test(name, () => {
        for (const name of Object.keys(original)) delete process.env[name];
        if (url !== undefined) process.env[urlName] = url;
        if (anon !== undefined) process.env[anonName] = anon;
        if (publishable !== undefined) process.env[publishableName] = publishable;
        const config = getSupabaseConfiguration();
        assert.deepEqual(config.missing, missing);
        const message = getConfigurationError();
        if (!missing.length) {
          assert.equal(config.url, "https://example.supabase.co");
          assert.equal(config.key, expectedKey);
          return assert.equal(message, null);
        }
        for (const variable of missing) assert.ok(message.includes(variable));
        assert.ok(message.includes("novo deploy"));
        for (const value of ["anon-test-value", "sb_publishable_test-value", "https://example.supabase.co"]) {
          assert.ok(!message.includes(value));
        }
      });
    }
  } finally {
    for (const [name, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
