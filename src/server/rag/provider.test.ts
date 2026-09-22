import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { afterEach, beforeEach, expect, it } from "vitest";
import { createConfiguredLanguageModel } from "./configuration";
import { OpenAICompatibleLanguageModel } from "./provider";
import { sampleChunk, sampleSupplement } from "./test-fixtures";

type CapturedRequest = {
  readonly path: string | undefined;
  readonly authorization: string | undefined;
  readonly body: unknown;
};
let server: Server;
let baseUrl: string;
let responseContent: string;
const requests: CapturedRequest[] = [];
const input = { actionCode: "ALERT_HAZARD", locale: "en", chunks: [sampleChunk] } as const;

beforeEach(async () => {
  requests.length = 0;
  responseContent = '{"selection":0}';
  server = createServer(async (request, response) => {
    request.setEncoding("utf8");
    let body = "";
    for await (const chunk of request) body += chunk;
    requests.push({
      path: request.url,
      authorization: request.headers.authorization,
      body: JSON.parse(body),
    });
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        id: "test-completion",
        model: "test-returned-model",
        choices: [{ message: { content: responseContent } }],
      }),
    );
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  baseUrl = `http://127.0.0.1:${address.port}/v1`;
});

afterEach(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

it("sends OpenAI authentication and structured selection parameters over HTTP", async () => {
  // Given
  const model = createConfiguredLanguageModel({
    RAG_LLM_PROVIDER: "openai",
    OPENAI_API_KEY: "test-openai-key",
    RAG_LLM_BASE_URL: baseUrl,
  });
  // When
  const completion = await model.generate(input, new AbortController().signal);
  // Then
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({
    path: "/v1/chat/completions",
    authorization: "Bearer test-openai-key",
    body: {
      model: "gpt-4.1-mini-2025-04-14",
      max_completion_tokens: 64,
      response_format: {
        type: "json_schema",
        json_schema: {
          strict: true,
          schema: {
            additionalProperties: false,
            required: ["selection"],
            properties: { selection: { type: "integer", enum: [0] } },
          },
        },
      },
    },
  });
  expect(requests[0]?.body).not.toHaveProperty("chat_template_kwargs");
  expect(requests[0]?.body).not.toHaveProperty("max_tokens");
  expect(JSON.stringify(requests[0]?.body)).not.toContain("test-openai-key");
  expect(completion.output).toEqual(sampleSupplement);
  expect(completion).toMatchObject({
    callId: "test-completion",
    modelReturned: "test-returned-model",
  });
});

it.each([
  [{}, undefined],
  [{ RAG_LLM_API_KEY: "test-local-key" }, "Bearer test-local-key"],
])(
  "preserves local requests without forwarding the OpenAI key for %j",
  async (overrides, authorization) => {
    // Given
    const model = createConfiguredLanguageModel({
      RAG_LLM_BASE_URL: baseUrl,
      OPENAI_API_KEY: "test-openai-key",
      ...overrides,
    });
    // When
    await model.generate(input, new AbortController().signal);
    // Then
    expect(requests[0]).toMatchObject({
      authorization,
      body: { max_tokens: 24, chat_template_kwargs: { enable_thinking: false } },
    });
    expect(requests[0]?.body).not.toHaveProperty("max_completion_tokens");
    expect(JSON.stringify(requests)).not.toContain("test-openai-key");
  },
);

it("honors the legacy API key override in OpenAI mode", async () => {
  // Given
  const model = createConfiguredLanguageModel({
    RAG_LLM_PROVIDER: "openai",
    RAG_LLM_BASE_URL: baseUrl,
    OPENAI_API_KEY: "test-openai-key",
    RAG_LLM_API_KEY: "test-override-key",
  });
  // When
  await model.generate(input, new AbortController().signal);
  // Then
  expect(requests[0]?.authorization).toBe("Bearer test-override-key");
});

it.each(['{"selection":9}', '{"selection":0,"supplementalExplanation":"unreviewed"}'])(
  "rejects selections outside the reviewed output contract: %s",
  async (content) => {
    // Given
    responseContent = content;
    const model = createConfiguredLanguageModel({
      RAG_LLM_PROVIDER: "openai",
      OPENAI_API_KEY: "test-openai-key",
      RAG_LLM_BASE_URL: baseUrl,
    });
    // When / Then
    await expect(model.generate(input, new AbortController().signal)).rejects.toThrow();
  },
);

it("rejects a direct provider timeout above the frozen deadline", () => {
  // Given / When / Then
  expect(
    () =>
      new OpenAICompatibleLanguageModel({
        baseUrl,
        model: "test-model",
        version: "test-version",
        timeoutMs: 5001,
      }),
  ).toThrow();
});
