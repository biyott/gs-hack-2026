import Database from "better-sqlite3";
import { afterEach, expect, it, vi } from "vitest";
import { createConfiguredLanguageModel, createConfiguredRagService } from "./configuration";
import { RagProviderError } from "./generation-types";
import { sampleChunk } from "./test-fixtures";

afterEach(() => vi.unstubAllGlobals());

it("selects the official endpoint and pinned model when only the OpenAI provider and key are set", async () => {
  // Given
  const requests: Request[] = [];
  vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
    requests.push(new Request(input));
    return Response.json({
      model: "gpt-4.1-mini-2025-04-14",
      choices: [{ message: { content: '{"selection":0}' } }],
    });
  });
  const model = createConfiguredLanguageModel({
    RAG_LLM_PROVIDER: "openai",
    OPENAI_API_KEY: "test-openai-key",
  });
  // When
  await model.generate(
    { actionCode: "ALERT_HAZARD", locale: "en", chunks: [sampleChunk] },
    new AbortController().signal,
  );
  // Then
  expect(requests.map((request) => request.url)).toEqual([
    "https://api.openai.com/v1/chat/completions",
  ]);
  expect(model.identity).toEqual({
    provider: "openai",
    model: "gpt-4.1-mini-2025-04-14",
    version: "gpt-4.1-mini-2025-04-14",
    mode: "actual",
  });
});

it.each([
  [{ RAG_LLM_MODEL: "custom-model" }, "custom-model"],
  [{ RAG_LLM_MODEL: "custom-model", RAG_LLM_VERSION: "custom-snapshot" }, "custom-snapshot"],
])("records model and version overrides for OpenAI %j", (overrides, version) => {
  // Given / When
  const model = createConfiguredLanguageModel({
    RAG_LLM_PROVIDER: "openai",
    OPENAI_API_KEY: "test-openai-key",
    ...overrides,
  });
  // Then
  expect(model.identity).toMatchObject({ model: "custom-model", version });
  expect(JSON.stringify(model.identity)).not.toContain("test-openai-key");
});

it("retains local model defaults when the provider is unset", () => {
  // Given / When
  const model = createConfiguredLanguageModel({ OPENAI_API_KEY: "test-openai-key" });
  // Then
  expect(model.identity).toEqual({
    provider: "openai-compatible",
    model: "Qwen3-0.6B-Q8_0",
    version: "23749fefcc72300e3a2ad315e1317431b06b590a",
    mode: "actual",
  });
});

it.each([undefined, "", "   "])("rejects OpenAI mode when its key is %j", (apiKey) => {
  // Given
  const db = new Database(":memory:");
  const environment = { RAG_LLM_PROVIDER: "openai", OPENAI_API_KEY: apiKey };
  try {
    // When / Then
    expect(() => createConfiguredRagService(db, environment)).toThrow(RagProviderError);
  } finally {
    db.close();
  }
});

it("rejects a provider timeout above the frozen maximum supplement deadline", () => {
  const db = new Database(":memory:");
  try {
    expect(() => createConfiguredRagService(db, { RAG_TIMEOUT_MS: "10000" })).toThrow();
  } finally {
    db.close();
  }
});
