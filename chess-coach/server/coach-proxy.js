// Local bridge between the Chess Coach extension and a Paseo-managed agent.
// Drives the daemon through the `paseo` CLI (the sanctioned automation path on
// this machine; see ~/.config/opencode/opencode-paseo-agents.md — the SDK's
// waitForFinish is broken against daemon 0.7.2).
//
// The coach is a persistent agent: the first review creates one via
// `paseo run --background`, later reviews `paseo send` the same agent so it
// remembers earlier games. POST /coach/reset starts a fresh coach.
//
// Config (env):
//   PORT                  HTTP port                     (default 8787, loopback only)
//   PASEO_URL             Paseo daemon WebSocket URL    (default ws://127.0.0.1:6768/ws)
//   PASEO_PASSWORD        Daemon password; falls back to the paseo.service.d/auth.conf drop-in
//   (provider is pinned to zai/glm-5.3-flash by design)
//   CHESS_COACH_CWD       Working directory for the agent session (default: this folder)
//   CHESS_COACH_AGENT_ID  Pin an existing agent id instead of the stored one

import { execFile } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT || 8787);
const PASEO_URL = process.env.PASEO_URL || "ws://127.0.0.1:6768/ws";
// Standing rule: every agent this proxy spawns runs GLM 5.3 flash. No override.
const PROVIDER = "zai/glm-5.3-flash";
const PINNED_AGENT_ID = process.env.CHESS_COACH_AGENT_ID || null;
const CWD = process.env.CHESS_COACH_CWD
  ? path.resolve(process.env.CHESS_COACH_CWD)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STORE_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), ".coach-agent");
// Resolve the CLI explicitly: PATH inside a systemd service lacks ~/.local/bin,
// and /usr/bin/paseo is the Electron wrapper, which hangs headless.
const PASEO = process.env.PASEO_BIN || "paseo";
const VAAPI_NOISE = /vaapi/i;
const WAIT_TIMEOUT_S = 300;
const SEND_PROMPT_FILE = path.join(os.tmpdir(), "chess-coach-prompt.txt");

function loadPassword() {
  if (process.env.PASEO_PASSWORD) return process.env.PASEO_PASSWORD;
  const dropIn = path.join(
    process.env.HOME || os.homedir(),
    ".config/systemd/user/paseo.service.d/auth.conf",
  );
  try {
    const line = fs
      .readFileSync(dropIn, "utf8")
      .split("\n")
      .find((l) => l.trim().startsWith("Environment="));
    if (!line) return undefined;
    const value = line.slice("Environment=".length).trim().replace(/^["']|["']$/g, "");
    const eq = value.indexOf("=");
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(value.slice(0, eq))) {
      return value.slice(eq + 1);
    }
    return value;
  } catch {
    return undefined;
  }
}

const PASEO_PASSWORD = loadPassword();

function passthroughEnv() {
  const env = { ...process.env };
  if (PASEO_PASSWORD) env.PASEO_PASSWORD = PASEO_PASSWORD;
  return env;
}

function loadStore() {
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveStore(store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  });
  res.end(payload);
}

function paseo(args) {
  return new Promise((resolve) => {
    execFile(PASEO, args, { env: passthroughEnv(), maxBuffer: 10 * 1024 * 1024, timeout: 360_000 }, (err, stdout, stderr) => {
      resolve({ stdout: stdout || "", stderr: stderr || "", err });
    });
  });
}

function clean(output) {
  return output.split("\n").filter((l) => !VAAPI_NOISE.test(l)).join("\n").trim();
}

// CLI stdout can carry debug/tip lines; grab the JSON value inside it.
// `ls --json` returns an array, other commands return objects.
function parseJson(output) {
  const text = clean(output);
  const candidates = [
    [text.indexOf("["), text.lastIndexOf("]")],
    [text.indexOf("{"), text.lastIndexOf("}")],
  ];
  for (const [start, end] of candidates) {
    if (start === -1 || end <= start) continue;
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      // try the next shape
    }
  }
  return null;
}

async function createAgent(prompt) {
  const { stdout } = await paseo([
    "run",
    "--background",
    "--json",
    "--provider",
    PROVIDER,
    "--cwd",
    CWD,
    prompt,
  ]);
  const created = parseJson(stdout);
  if (!created?.agentId) {
    throw new Error(`paseo run produced no agent id: ${clean(stdout).slice(0, 200)}`);
  }
  return created.agentId;
}

async function sendPrompt(agentId, prompt) {
  fs.writeFileSync(SEND_PROMPT_FILE, prompt);
  const { stdout, err } = await paseo(["send", agentId, "--prompt-file", SEND_PROMPT_FILE]);
  if (err && !stdout) throw new Error(`paseo send failed: ${err.message}`);
}

async function waitForIdle(agentId) {
  const { stdout } = await paseo(["wait", agentId, "--json", "--timeout", String(WAIT_TIMEOUT_S)]);
  const result = parseJson(stdout);
  if (!result?.status) throw new Error(`paseo wait produced no status: ${clean(stdout).slice(0, 200)}`);
  return result.status;
}

async function lastAssistantText(agentId) {
  const { stdout } = await paseo(["logs", agentId, "--filter", "text"]);
  const lines = clean(stdout).split("\n");
  // The reply is the text block right after the last [User] entry. Thought and
  // tool blocks are tagged and may follow it, so scan forward, not backward.
  const lastUser = lines.map((l) => l.trim().startsWith("[User]")).lastIndexOf(true);
  if (lastUser === -1) return null;
  const block = [];
  for (const raw of lines.slice(lastUser + 1)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("[")) break;
    block.push(line);
  }
  return block.length ? block.join("\n") : null;
}

async function agentExists(agentId) {
  const { stdout } = await paseo(["ls", "--json"]);
  const agents = parseJson(stdout);
  return Array.isArray(agents) && agents.some((a) => a.id === agentId || a.shortId === agentId);
}

async function runCoach(prompt) {
  const store = loadStore();
  const knownId = PINNED_AGENT_ID || store.agentId || null;

  let agentId = knownId;
  let created = false;
  if (agentId && !(await agentExists(agentId))) {
    agentId = null; // archived/gone — create a fresh coach
  }
  if (!agentId) {
    agentId = await createAgent(prompt);
    created = true;
  } else {
    await sendPrompt(agentId, prompt);
  }

  const status = await waitForIdle(agentId);
  if (status !== "idle") {
    return {
      status,
      reply: null,
      agentId,
      reusedSession: !created,
      reviewCount: store.reviews || 0,
      provider: PROVIDER,
    };
  }

  saveStore({ agentId, provider: PROVIDER, reviews: (store.reviews || 0) + 1 });
  return {
    status,
    reply: await lastAssistantText(agentId),
    agentId,
    reusedSession: !created,
    reviewCount: store.reviews || 0,
    provider: PROVIDER,
  };
}

function failureHint(err) {
  const message = String(err?.message || err);
  if (/ENOENT/.test(message)) {
    return "the `paseo` CLI was not found — is ~/.local/bin on PATH for the service?";
  }
  if (/401|unauthorized|password/i.test(message)) {
    return `the daemon rejected the password — check ~/.config/systemd/user/paseo.service.d/auth.conf`;
  }
  if (/connect|econnrefused|timeout/i.test(message)) {
    return `cannot reach the Paseo daemon at ${PASEO_URL} — is \`paseo\` running?`;
  }
  return message;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }
  if (req.method === "GET" && req.url === "/health") {
    const store = loadStore();
    json(res, 200, {
      ok: true,
      provider: PROVIDER,
      paseoUrl: PASEO_URL,
      passwordLoaded: Boolean(PASEO_PASSWORD),
      memory: {
        agentId: PINNED_AGENT_ID || store.agentId || null,
        reviews: store.reviews || 0,
      },
    });
    return;
  }
  if (req.method === "POST" && req.url === "/coach/reset") {
    const store = loadStore();
    saveStore({ reviews: store.reviews || 0 });
    json(res, 200, { ok: true, note: "next review creates a fresh coach" });
    return;
  }
  if (req.method === "POST" && req.url === "/coach") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) req.destroy();
    });
    req.on("end", async () => {
      let prompt;
      try {
        ({ prompt } = JSON.parse(body));
      } catch {
        json(res, 400, { error: "invalid JSON body" });
        return;
      }
      if (typeof prompt !== "string" || prompt.trim().length < 20) {
        json(res, 400, { error: "missing prompt" });
        return;
      }
      try {
        const result = await runCoach(prompt);
        json(res, 200, result);
      } catch (err) {
        json(res, 502, { error: `Paseo agent failed: ${failureHint(err)}` });
      }
    });
    return;
  }
  json(res, 404, { error: "not found" });
});

server.listen(PORT, "127.0.0.1", () => {
  const store = loadStore();
  console.log(`chess-coach proxy  http://127.0.0.1:${PORT} (loopback only)`);
  console.log(`paseo daemon       ${PASEO_URL}`);
  console.log(`provider           ${PROVIDER}`);
  console.log(`daemon password    ${PASEO_PASSWORD ? "loaded" : "none found"}`);
  console.log(`agent cwd          ${CWD.startsWith(os.homedir()) ? CWD.replace(os.homedir(), "~") : CWD}`);
  if (PINNED_AGENT_ID || store.agentId) {
    console.log(`coach session      ${PINNED_AGENT_ID || store.agentId} (${store.reviews || 0} reviews so far)`);
  } else {
    console.log("coach session      none yet — first review will create one");
  }
});
