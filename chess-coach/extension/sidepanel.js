// Side panel logic: Lichess PGN fetch -> shared analysis -> coach proxy call.
// `chess-analysis.js` is imported directly; no build step.

import {
  buildCoachPrompt,
  classifyMoves,
  formatEval,
  formatMove,
  parseGame,
  summarizeGame,
} from "../shared/chess-analysis.js";

const DEFAULT_PROXY_URL = "https://thinkpad.tail4f5d20.ts.net:8452";

const form = document.getElementById("analyze-form");
const gameInput = document.getElementById("game-input");
const questionInput = document.getElementById("question-input");
const analyzeBtn = document.getElementById("analyze-btn");
const statusEl = document.getElementById("status");
const summaryEl = document.getElementById("summary");
const summaryGrid = document.getElementById("summary-grid");
const classCounts = document.getElementById("class-counts");
const worstList = document.getElementById("worst-list");
const coachingEl = document.getElementById("coaching");
const coachReply = document.getElementById("coach-reply");
const coachMeta = document.getElementById("coach-meta");
const sessionEl = document.getElementById("coach-session");
const sessionText = document.getElementById("session-text");
const resetBtn = document.getElementById("reset-btn");
const proxyInput = document.getElementById("proxy-input");

let proxyUrl = DEFAULT_PROXY_URL;

function normalizeProxyUrl(value) {
  let url = (value || "").trim();
  if (!url) url = DEFAULT_PROXY_URL;
  if (!/^https?:\/\//.test(url)) url = `http://${url}`;
  return url.replace(/\/+$/, "");
}

async function initializeProxyUrl() {
  try {
    const stored = await chrome.storage.local.get("proxyUrl");
    if (stored.proxyUrl) {
      proxyInput.value = stored.proxyUrl;
      proxyUrl = normalizeProxyUrl(stored.proxyUrl);
    } else {
      proxyInput.value = DEFAULT_PROXY_URL;
    }
  } catch {
    proxyInput.value = DEFAULT_PROXY_URL;
  }
  refreshSession();
}

function setStatus(message, kind = "info", busy = false) {
  statusEl.hidden = false;
  statusEl.className = kind;
  statusEl.innerHTML = busy ? '<span class="spinner"></span>' : "";
  statusEl.append(document.createTextNode(message));
}

function extractGameId(raw) {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname.endsWith("lichess.org")) {
      const seg = url.pathname.split("/").filter(Boolean)[0];
      if (seg) return seg.replace(/[^A-Za-z0-9]/g, "");
    }
  } catch {
    // not a URL — fall through
  }
  if (/^[A-Za-z0-9]{8}$/.test(value)) return value;
  return null;
}

async function fetchAnalysisPgn(gameId) {
  const response = await fetch(
    `https://lichess.org/game/export/${encodeURIComponent(gameId)}?evals=1&clocks=0&literate=false`,
    { headers: { Accept: "application/x-chess-pgn" } },
  );
  if (!response.ok) {
    if (response.status === 404) throw new Error("Game not found. Check the URL or ID.");
    if (response.status === 429) {
      throw new Error("Lichess is limiting requests. Wait a moment and try again.");
    }
    throw new Error(`The Lichess export failed with HTTP ${response.status}.`);
  }
  return response.text();
}

async function refreshSession() {
  try {
    const response = await fetch(`${proxyUrl}/health`);
    const payload = await response.json();
    const memory = payload.memory || {};
    if (memory.agentId) {
      sessionText.textContent = `The coach has reviewed ${memory.reviews} game${memory.reviews === 1 ? "" : "s"} with you.`;
    } else {
      sessionText.textContent = "No coach session yet. Your first review creates one.";
    }
    sessionEl.hidden = false;
  } catch {
    sessionEl.hidden = false;
    sessionText.textContent =
      "Can't reach the coach proxy. Check the Coach proxy URL field, and make sure the proxy is running.";
  }
}

function renderSummary({ headers, summary }) {
  summaryEl.hidden = false;
  const white = headers.White || "White";
  const black = headers.Black || "Black";
  const opening = headers.Opening || headers.ECO || "?";

  summaryGrid.innerHTML = "";
  for (const [label, value] of [
    ["Game", `${white} vs ${black}`],
    ["Opening", opening],
    ["Result", headers.Result || "*"],
    ["Accuracy (approx)", `${summary.accuracy}%`],
    ["Average loss", `${(summary.averageLoss / 100).toFixed(2)} pawns`],
    ["Moves", `${summary.totalMoves}`],
  ]) {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    summaryGrid.append(dt, dd);
  }

  classCounts.innerHTML = "";
  const countsWrap = document.createElement("div");
  countsWrap.className = "class-counts";
  for (const cls of ["excellent", "good", "inaccuracy", "mistake", "blunder"]) {
    const chip = document.createElement("span");
    chip.className = `chip ${cls}${summary.counts[cls] === 0 ? " zero" : ""}`;
    chip.textContent = `${summary.counts[cls]} ${cls}`;
    countsWrap.append(chip);
  }
  classCounts.append(countsWrap);

  worstList.innerHTML = "";
  for (const move of summary.worst) {
    const li = document.createElement("li");
    const cls = document.createElement("span");
    const pawns = (move.centipawnLoss / 100).toFixed(1).replace(/\.0$/, "");
    cls.className = `cls ${move.classification}`;
    cls.textContent = `${formatMove(move)} — ${move.classification} (~${pawns} pawns, eval ${formatEval(move.evalCp)})`;
    li.append(cls);
    worstList.append(li);
  }
}

function renderCoaching(reply, meta) {
  coachingEl.hidden = false;
  coachReply.textContent = reply;
  coachMeta.textContent = meta;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  analyzeBtn.disabled = true;
  summaryEl.hidden = true;
  coachingEl.hidden = true;

  const gameId = extractGameId(gameInput.value);
  if (!gameId) {
    setStatus("That doesn't look like a Lichess game URL or 8-character ID.", "error");
    analyzeBtn.disabled = false;
    return;
  }

  try {
    setStatus("Fetching the server analysis from Lichess…", "info", true);
    const pgn = await fetchAnalysisPgn(gameId);
    const { headers, moves } = parseGame(pgn);
    if (moves.length === 0) throw new Error("No moves found in the exported PGN.");
    if (!moves.some((m) => m.evalCp != null)) {
      throw new Error(
        "This game has no server analysis yet. On lichess.org, open the game, " +
          "open the analysis board, and request a full analysis. Then try again.",
      );
    }
    const classified = classifyMoves(moves);
    const summary = summarizeGame(classified);
    renderSummary({ headers, classified, summary });

    const question = questionInput.value.trim();
    const prompt = buildCoachPrompt({ headers, classified, summary, question });

    setStatus("Asking your coach…", "info", true);
    const proxyResponse = await fetch(`${proxyUrl}/coach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const payload = await proxyResponse.json().catch(() => ({}));
    if (!proxyResponse.ok || payload.error) {
      throw new Error(payload.error || `The coach proxy failed with HTTP ${proxyResponse.status}.`);
    }
    if (payload.status !== "idle" || !payload.reply) {
      throw new Error(
        `The agent didn't finish (status: ${payload.status}). Check the Paseo app. ` +
          "It might be waiting for you to approve a permission.",
      );
    }
    renderCoaching(
      payload.reply,
      `via Paseo · ${payload.provider || "unknown provider"} · agent ${payload.agentId || "?"}` +
        (payload.reusedSession ? " · session remembered" : " · new session"),
    );
    setStatus("");
    statusEl.hidden = true;
  } catch (err) {
    setStatus(err.message || String(err), "error");
  } finally {
    analyzeBtn.disabled = false;
    refreshSession();
  }
});

resetBtn.addEventListener("click", async () => {
  resetBtn.disabled = true;
  try {
    await fetch(`${proxyUrl}/coach/reset`, { method: "POST" });
    setStatus("Memory cleared. Your next review starts a fresh coach.");
  } catch {
    setStatus("Can't reach the coach proxy.", "error");
  } finally {
    resetBtn.disabled = false;
    refreshSession();
  }
});

proxyInput.addEventListener("change", async () => {
  proxyUrl = normalizeProxyUrl(proxyInput.value);
  proxyInput.value = proxyUrl;
  try {
    await chrome.storage.local.set({ proxyUrl });
  } catch {
    // storage unavailable (plain tab) — keep the value in memory
  }
  refreshSession();
});

initializeProxyUrl();
