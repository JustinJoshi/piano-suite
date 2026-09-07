// Shared by the extension side panel (browser) and the coach proxy (Node).
// Plain ESM JavaScript on purpose: no build step, one source of truth.

export const MATE_SCORE = 100000;

// Classes ordered from best to worst.
export const CLASSES = ["excellent", "good", "inaccuracy", "mistake", "blunder"];

export function parseEvalToken(token) {
  token = String(token).trim();
  if (token.startsWith("#")) {
    const mate = Number.parseInt(token.slice(1), 10);
    if (Number.isNaN(mate)) return null;
    const sign = Math.sign(mate) || 1;
    // Mate in N maps below any centipawn eval so comparisons stay monotonic.
    return sign * (MATE_SCORE - Math.min(Math.abs(mate), 200) * 100);
  }
  const value = Number.parseFloat(token);
  return Number.isNaN(value) ? null : Math.round(value * 100);
}

const HEADER_LINE_RE = /^\s*\[\w+\s+"[^"]*"\]\s*$/gm;
const HEADER_NAME_RE = /^\s*\[(\w+)\s+"([^"]*)"\]\s*$/;
const EVAL_COMMENT_RE = /\[%eval\s+([^\]]+)\]/g;

/**
 * Parse a Lichess-style PGN carrying [%eval cp,depth] or [%eval #N] comments
 * after each move.
 * Returns { headers, moves } where moves[i] = { ply, moveNumber, color, san, evalCp }.
 * evalCp is the eval of the position after the move, always from White's
 * perspective (Lichess convention), in centipawns.
 */
export function parseGame(pgn) {
  const headers = {};
  for (const match of pgn.matchAll(HEADER_LINE_RE)) {
    const named = match[0].match(HEADER_NAME_RE);
    if (named) headers[named[1]] = named[2];
  }

  // Remove headers, then strip nested variations, keeping comments.
  const body = pgn.replace(HEADER_LINE_RE, " ");
  let depth = 0;
  let noVars = "";
  for (const ch of body) {
    if (ch === "(") { depth++; continue; }
    if (ch === ")") { if (depth > 0) depth--; continue; }
    if (depth === 0) noVars += ch;
  }

  // Harvest eval comments while offsets still match the move stream.
  const evals = [];
  EVAL_COMMENT_RE.lastIndex = 0;
  let match;
  while ((match = EVAL_COMMENT_RE.exec(noVars))) {
    const payload = match[1].split(",")[0].trim();
    evals.push(parseEvalToken(payload));
  }

  // Then drop comments and tokenize the movetext.
  const clean = noVars.replace(/\{[^}]*\}/g, " ");
  const tokens = clean.split(/\s+/).filter(Boolean);

  const moves = [];
  for (const token of tokens) {
    if (/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token)) break;
    if (/^\$\d+$/.test(token)) continue; // NAG
    // Strip glued move numbers ("1.e4", "3...Nc6") and trailing annotations.
    const san = token.replace(/^\d+\/?\d*\.+/, "").replace(/[!?]+$/, "");
    if (!san) continue;
    if (!/^[KQRBNa-hOo]/.test(san)) continue; // not a move token
    const ply = moves.length + 1;
    moves.push({
      ply,
      moveNumber: Math.ceil(ply / 2),
      color: ply % 2 === 1 ? "white" : "black",
      san,
      evalCp: evals.length ? (evals[moves.length] ?? null) : null,
    });
  }
  return { headers, moves };
}

/**
 * Classify each move by centipawn loss. Lichess evals are White-perspective,
 * so the eval drop across one move (converted to the mover's perspective)
 * isolates exactly what that move gave away — no dependence on the opponent's
 * reply, so the last move classifies like the rest.
 */
export function classifyMoves(moves) {
  return moves.map((move, i) => {
    const out = { ...move };
    const side = move.color === "white" ? 1 : -1;
    const before = i > 0 ? moves[i - 1].evalCp : 0; // White-perspective, pre-move
    if (out.evalCp == null || before == null) {
      out.classification = null;
      out.centipawnLoss = null;
    } else {
      const loss = side * (before - out.evalCp);
      out.centipawnLoss = Math.max(0, loss);
      out.classification = classifyLoss(out.centipawnLoss);
    }
    return out;
  });
}

export function classifyLoss(loss) {
  if (loss <= 10) return "excellent";
  if (loss <= 50) return "good";
  if (loss <= 100) return "inaccuracy";
  if (loss <= 300) return "mistake";
  return "blunder";
}

/** Aggregate summary used by the UI and the coach prompt. */
export function summarizeGame(classified) {
  const counts = Object.fromEntries(CLASSES.map((c) => [c, 0]));
  let totalLoss = 0;
  let lossCount = 0;
  const withLoss = [];
  for (const move of classified) {
    if (move.classification) counts[move.classification]++;
    if (move.centipawnLoss != null) {
      totalLoss += move.centipawnLoss;
      lossCount++;
      withLoss.push(move);
    }
  }
  withLoss.sort((a, b) => b.centipawnLoss - a.centipawnLoss);
  const avgLoss = lossCount ? totalLoss / lossCount : 0;
  // Lichess accuracy approximation.
  const accuracy = Math.max(
    0,
    Math.min(100, Math.round(103.1668 * Math.exp(-0.04354 * avgLoss) - 3.1669)),
  );
  return {
    counts,
    totalLoss: Math.round(totalLoss),
    averageLoss: Math.round(avgLoss),
    accuracy,
    worst: withLoss.slice(0, 3),
    classifiedMoves: lossCount,
    totalMoves: classified.length,
  };
}

export function formatEval(cp) {
  if (cp == null) return "?";
  if (Math.abs(cp) >= MATE_SCORE - 20000) {
    const mateIn = Math.max(1, Math.round((MATE_SCORE - Math.abs(cp)) / 100));
    return `${cp > 0 ? "#" : "#-"}${mateIn}`;
  }
  return (cp / 100).toFixed(2);
}

export function formatMove(move) {
  return `${move.moveNumber}${move.color === "white" ? "." : "..."}${move.san}`;
}

export function buildCoachPrompt({ headers, classified, summary, question }) {
  const opening = headers.Opening || headers.ECO || "unknown opening";
  const result = headers.Result || "*";
  const worstLines = summary.worst.length
    ? summary.worst
        .map((m) => {
          const pawns = (m.centipawnLoss / 100).toFixed(1).replace(/\.0$/, "");
          return `- ${formatMove(m)}: ${m.classification}, gave up ~${pawns} pawns`;
        })
        .join("\n")
    : "- none recorded";

  return [
    "You are an encouraging chess coach for an adult improver (roughly 800-1200 rapid).",
    "A game was analyzed by Stockfish. Review it for the student.",
    "",
    `Opening: ${opening}. Result: ${result}. Accuracy (approx): ${summary.accuracy}%.`,
    `Move quality: ${summary.counts.excellent} excellent, ${summary.counts.good} good, ` +
      `${summary.counts.inaccuracy} inaccuracies, ${summary.counts.mistake} mistakes, ` +
      `${summary.counts.blunder} blunders.`,
    "",
    "Biggest moments:",
    worstLines,
    "",
    "Full movetext:",
    classified.map(formatMove).join(" "),
    "",
    question ? `The student also asks: ${question}` : "",
    "",
    "Reply with: (1) a one-line verdict, (2) the 2-3 moments that mattered with what",
    "to do instead (reference moves in SAN), (3) one concrete drill or habit to work on.",
    "Maximum 220 words. Plain text, no markdown headers. Never suggest engine lines",
    "deeper than 3 moves. Do not moralize about losing; be specific and kind.",
    "Answer from your chess knowledge only; do not use tools, files, or web search.",
  ]
    .filter((line) => line !== "")
    .join("\n");
}
