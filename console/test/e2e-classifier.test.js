const { classifyFailure } = require("../lib/e2e/classifier");

test("provider_retry_exhausted wins over generic timeout", () => {
  const result = classifyFailure({
    lane: "first-pr",
    timedOut: true,
    buildEvents: [
      {
        kind: "provider_retry_exhausted",
        data: {
          detail: "Pipeline Repo Assist exhausted the retry budget.",
        },
      },
    ],
  });

  expect(result).toEqual({
    failureClass: "provider_retry_exhausted",
    failureDetail: "Pipeline Repo Assist exhausted the retry budget.",
  });
});

test("bootstrap conflict is inferred from state.json 409", () => {
  const result = classifyFailure({
    lane: "provision-only",
    warnings: ["state.json update returned 409 conflict"],
    buildEvents: [
      {
        kind: "pipeline_stalled",
        data: {
          stage: "bootstrap",
          detail: "Bootstrap stalled after state.json returned 409 conflict.",
        },
      },
    ],
  });

  expect(result.failureClass).toBe("bootstrap_conflict");
});

test("ui auth failures classify immediately", () => {
  const result = classifyFailure({
    lane: "browser-canary",
    uiAuthFailed: true,
    detail: "GitHub login form appeared.",
  });

  expect(result).toEqual({
    failureClass: "ui_auth_failed",
    failureDetail: "GitHub login form appeared.",
  });
});
