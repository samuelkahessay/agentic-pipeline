const { createLLMClient } = require("../lib/llm");

describe("createLLMClient", () => {
  const originalFetch = global.fetch;
  const originalOpenAiApiKey = process.env.OPENAI_API_KEY;
  const originalApiKey = process.env.OPENROUTER_API_KEY;
  const originalModel = process.env.LLM_MODEL;
  const originalApiUrl = process.env.LLM_API_URL;

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalOpenAiApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalOpenAiApiKey;
    }
    if (originalApiKey === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = originalApiKey;
    }
    if (originalModel === undefined) {
      delete process.env.LLM_MODEL;
    } else {
      process.env.LLM_MODEL = originalModel;
    }
    if (originalApiUrl === undefined) {
      delete process.env.LLM_API_URL;
    } else {
      process.env.LLM_API_URL = originalApiUrl;
    }
    jest.restoreAllMocks();
  });

  test("sends a strict JSON schema request to OpenAI by default", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.LLM_MODEL;
    delete process.env.LLM_API_URL;

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content:
                '{"status":"needs_input","message":"Need one more detail.","question":"Who is this for?","prd":null}',
            },
          },
        ],
      }),
    });

    const client = createLLMClient();
    const content = await client.chat([{ role: "user", content: "Build me a CRM" }]);
    const [requestUrl, requestInit] = global.fetch.mock.calls[0];
    const request = JSON.parse(requestInit.body);

    expect(content).toContain('"status":"needs_input"');
    expect(requestUrl).toBe("https://api.openai.com/v1/chat/completions");
    expect(request.model).toBe("gpt-4.1-mini");
    expect(request.response_format).toMatchObject({
      type: "json_schema",
      json_schema: {
        name: "prd_refinement",
        strict: true,
      },
    });
    expect(request.provider).toBeUndefined();
  });

  test("adds the OpenRouter provider hint when explicitly targeting OpenRouter", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.LLM_API_URL = "https://openrouter.ai/api/v1/chat/completions";

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content:
                '{"status":"needs_input","message":"Need one more detail.","question":"Who is this for?","prd":null}',
            },
          },
        ],
      }),
    });

    const client = createLLMClient();
    await client.chat([{ role: "user", content: "Build me a CRM" }]);
    const request = JSON.parse(global.fetch.mock.calls[0][1].body);

    expect(request.provider).toEqual({ require_parameters: true });
  });

  test("parseResponse accepts valid structured output and rejects malformed fallback prose", () => {
    const client = createLLMClient();

    expect(
      client.parseResponse(
        '{"status":"ready","message":"Ready to build.","question":null,"prd":{"title":"Test","problem":"Pain","users":"Teams","features":["A"],"criteria":["B"]}}'
      )
    ).toEqual({
      status: "ready",
      message: "Ready to build.",
      question: null,
      prd: {
        title: "Test",
        problem: "Pain",
        users: "Teams",
        features: ["A"],
        criteria: ["B"],
      },
    });

    expect(() => client.parseResponse("Sure, here's a rough draft.")).toThrow();
  });
});
