const { createLLMClient } = require("./llm");
const { createGitHubClient } = require("./github-api");
const { createProvisioner } = require("./provisioner");
const { createBuildRunner } = require("./build-runner");

function createServiceResolver({ db, buildSessionStore }) {
  let _real = null;
  let _mock = null;

  function real() {
    if (!_real) {
      const githubClient = createGitHubClient();
      _real = {
        llmClient: createLLMClient(),
        githubClient,
        provisioner: createProvisioner({ db, buildSessionStore, githubClient }),
        buildRunner: createBuildRunner({ buildSessionStore, githubClient }),
      };
    }
    return _real;
  }

  function mock() {
    if (!_mock) {
      const m = require("./mock-services");
      const githubClient = m.createMockGitHubClient();
      _mock = {
        llmClient: m.createMockLLMClient(),
        githubClient,
        provisioner: m.createMockProvisioner({ db, buildSessionStore, githubClient }),
        buildRunner: m.createMockBuildRunner({ buildSessionStore }),
      };
    }
    return _mock;
  }

  return {
    forSession(sessionId) {
      const session = buildSessionStore.getSession(sessionId);
      return session?.is_demo ? mock() : real();
    },
    mock,
    real,
  };
}

module.exports = { createServiceResolver };
