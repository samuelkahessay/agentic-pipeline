class PublicApiError extends Error {
  constructor(message, { status = 500, body = null, action = null, returnTo = null } = {}) {
    super(message);
    this.name = "PublicApiError";
    this.status = status;
    this.body = body;
    this.action = action;
    this.returnTo = returnTo;
  }
}

function createPublicBuildClient({ baseUrl, cookieHeader }) {
  const root = baseUrl.replace(/\/$/, "");

  async function get(path) {
    const res = await fetch(`${root}${path}`, {
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });
    return parseJsonResponse(res);
  }

  async function post(path, body) {
    const res = await fetch(`${root}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieHeader,
      },
      cache: "no-store",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return parseJsonResponse(res);
  }

  return {
    getMe() {
      return get("/pub/auth/me");
    },

    createSession() {
      return post("/pub/build-session");
    },

    getSession(sessionId) {
      return get(`/pub/build-session/${sessionId}`);
    },

    async sendMessage(sessionId, content) {
      const res = await fetch(`${root}/pub/build-session/${sessionId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: cookieHeader,
        },
        cache: "no-store",
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        throw await parseErrorResponse(res);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let donePayload = null;

      while (reader) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) {
            continue;
          }
          const payload = JSON.parse(trimmed.slice(6));
          if (payload.type === "error") {
            throw new PublicApiError(payload.error || "Build chat failed");
          }
          if (payload.type === "done") {
            donePayload = payload.parsed;
          }
        }
      }

      return donePayload;
    },

    finalizeSession(sessionId) {
      return post(`/pub/build-session/${sessionId}/finalize`);
    },

    redeemCode(sessionId, code) {
      return post(`/pub/build-session/${sessionId}/redeem`, { code });
    },

    submitCredentials(sessionId, credentials) {
      return post(`/pub/build-session/${sessionId}/credentials`, credentials);
    },

    provisionRepo(sessionId, options) {
      return post(`/pub/build-session/${sessionId}/provision`, options);
    },

    startBuild(sessionId) {
      return post(`/pub/build-session/${sessionId}/start-build`);
    },

    async streamBuildEvents(sessionId, {
      afterId = 0,
      signal,
      onEvent,
      onConnect,
    } = {}) {
      let lastEventId = afterId;
      let reconnectCount = 0;

      while (!signal?.aborted) {
        const headers = {
          Accept: "text/event-stream",
          cookie: cookieHeader,
        };
        if (lastEventId > 0) {
          headers["Last-Event-ID"] = String(lastEventId);
        }

        let res;
        try {
          res = await fetch(`${root}/pub/build-session/${sessionId}/stream`, {
            headers,
            cache: "no-store",
            signal,
          });
        } catch (error) {
          if (signal?.aborted) {
            return;
          }
          reconnectCount += 1;
          await delay(backoffMs(reconnectCount));
          continue;
        }

        if (!res.ok) {
          throw await parseErrorResponse(res);
        }

        reconnectCount = 0;
        if (typeof onConnect === "function") {
          onConnect();
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (reader && !signal?.aborted) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() || "";

          for (const chunk of chunks) {
            const event = parseSseChunk(chunk);
            if (!event) {
              continue;
            }
            lastEventId = Math.max(lastEventId, event.id || 0);
            if (typeof onEvent === "function") {
              onEvent(event.payload);
            }
          }
        }

        if (signal?.aborted) {
          return;
        }

        reconnectCount += 1;
        await delay(backoffMs(reconnectCount));
      }
    },
  };
}

async function parseJsonResponse(res) {
  if (!res.ok) {
    throw await parseErrorResponse(res);
  }
  return res.json();
}

async function parseErrorResponse(res) {
  let parsed = null;
  try {
    parsed = await res.json();
  } catch {
    parsed = null;
  }
  return new PublicApiError(
    parsed?.message || parsed?.error || `API error: ${res.status} ${res.statusText}`,
    {
      status: res.status,
      body: parsed,
      action: parsed?.action || null,
      returnTo: parsed?.returnTo || null,
    }
  );
}

function parseSseChunk(chunk) {
  const lines = chunk.split("\n");
  let id = 0;
  let payload = null;

  for (const line of lines) {
    if (line.startsWith(":")) {
      continue;
    }
    if (line.startsWith("id:")) {
      id = Number.parseInt(line.slice(3).trim(), 10) || 0;
      continue;
    }
    if (line.startsWith("data:")) {
      payload = JSON.parse(line.slice(5).trim());
    }
  }

  if (!payload) {
    return null;
  }

  return { id, payload };
}

function backoffMs(attempt) {
  return Math.min(1_000 * attempt, 5_000);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  PublicApiError,
  createPublicBuildClient,
};
