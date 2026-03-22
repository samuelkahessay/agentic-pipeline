const { createGitHubClient } = require("../lib/github-api");

describe("github api actions variables", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test("upsertActionsVariable retries patch when create races with another bootstrap", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => '{"message":"Not Found"}',
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        text: async () => '{"message":"Already exists - Variable already exists"}',
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      });

    const client = createGitHubClient();

    const result = await client.upsertActionsVariable("token", "octocat", "demo", {
      name: "PIPELINE_ACTIVE",
      value: "true",
    });

    expect(result).toBeNull();
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "https://api.github.com/repos/octocat/demo/actions/variables/PIPELINE_ACTIVE",
      expect.objectContaining({ method: "PATCH" })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "https://api.github.com/repos/octocat/demo/actions/variables",
      expect.objectContaining({ method: "POST" })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      "https://api.github.com/repos/octocat/demo/actions/variables/PIPELINE_ACTIVE",
      expect.objectContaining({ method: "PATCH" })
    );
  });
});
