import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildCoachPrompt,
  classifyLoss,
  classifyMoves,
  formatEval,
  formatMove,
  parseEvalToken,
  parseGame,
  summarizeGame,
} from "../shared/chess-analysis.js";

// Lichess evals are always from White's perspective.
const PGN = [
  '[Event "Rated Rapid game"]',
  '[White "justin"]',
  '[Black "opponent"]',
  '[Result "0-1"]',
  '[ECO "C50"]',
  '[Opening "Italian Game"]',
  "",
  "1. e4 { [%eval 0.17,24] } 1... e5 { [%eval 0.3,25] } 2. Nf3 { [%eval 0.18,24] }",
  "2... Nc6 { [%eval 0.41,24] } 3. Bc4 { [%eval 0.45,24] } 3... Bc5 { [%eval 0.35,25] }",
  "4. d3 { [%eval 0.4,22] } 4... Nf6 { [%eval 0.46,21] } 5. Nxe5?? { [%eval -2.75,24] }",
  "5... Nxe5 { [%eval -2.9,25] } 0-1",
].join("\n");

test("parseEvalToken handles centipawns and mates", () => {
  assert.equal(parseEvalToken("0.35"), 35);
  assert.equal(parseEvalToken("-2.75"), -275);
  assert.equal(parseEvalToken("#5"), 99500);
  assert.equal(parseEvalToken("#-3"), -99700);
  assert.equal(parseEvalToken("junk"), null);
});

test("parseGame extracts headers, moves, and evals", () => {
  const { headers, moves } = parseGame(PGN);
  assert.equal(headers.Opening, "Italian Game");
  assert.equal(headers.Result, "0-1");
  assert.equal(moves.length, 10);
  assert.equal(moves[0].san, "e4");
  assert.equal(moves[0].evalCp, 17);
  assert.equal(moves[4].color, "white");
  assert.equal(moves[5].color, "black");
  assert.equal(moves[8].san, "Nxe5");
  assert.equal(moves[8].evalCp, -275);
});

test("parseGame skips variations without corrupting eval order", () => {
  const pgn = '1. e4 { [%eval 0.2,20] } (1. d4 { [%eval 9.99,1] }) 1... e5 { [%eval 0.3,21] }';
  const { moves } = parseGame(pgn);
  assert.equal(moves.length, 2);
  assert.equal(moves[0].evalCp, 20);
  assert.equal(moves[1].evalCp, 30);
});

test("classifyMoves computes centipawn loss from the mover's perspective", () => {
  const { moves } = parseGame(PGN);
  const classified = classifyMoves(moves);

  // 5.Nxe5: eval goes +0.46 -> -2.75 (White perspective), loss 321cp for White.
  assert.equal(classified[8].san, "Nxe5");
  assert.equal(classified[8].centipawnLoss, 321);
  assert.equal(classified[8].classification, "blunder");

  // 4...Nf6: eval goes +0.40 -> +0.46 (White perspective), a 6cp loss for Black.
  assert.equal(classified[7].san, "Nf6");
  assert.equal(classified[7].centipawnLoss, 6);
  assert.equal(classified[7].classification, "excellent");

  // 1.e4: +0.17 -> +0.30 is a gain, so no loss.
  assert.equal(classified[0].centipawnLoss, 0);

  // Every move classifies, including the last one (no reply needed).
  assert.ok(classified.every((m) => m.classification !== null));
});

test("classifyLoss thresholds", () => {
  assert.equal(classifyLoss(5), "excellent");
  assert.equal(classifyLoss(49), "good");
  assert.equal(classifyLoss(99), "inaccuracy");
  assert.equal(classifyLoss(299), "mistake");
  assert.equal(classifyLoss(900), "blunder");
});

test("summarizeGame counts classes and picks worst moves", () => {
  const { moves } = parseGame(PGN);
  const summary = summarizeGame(classifyMoves(moves));
  assert.equal(summary.totalMoves, 10);
  assert.equal(summary.classifiedMoves, 10);
  assert.equal(summary.counts.blunder, 1);
  assert.equal(summary.counts.mistake, 0);
  assert.equal(summary.worst[0].san, "Nxe5");
  assert.ok(summary.accuracy > 0 && summary.accuracy <= 100);
});

test("formatEval", () => {
  assert.equal(formatEval(35), "0.35");
  assert.equal(formatEval(-275), "-2.75");
  assert.equal(formatEval(null), "?");
});

test("formatMove", () => {
  const { moves } = parseGame(PGN);
  assert.equal(formatMove(moves[8]), "5.Nxe5");
  assert.equal(formatMove(moves[9]), "5...Nxe5");
});

test("buildCoachPrompt includes opening, counts, and worst moves", () => {
  const { headers, moves } = parseGame(PGN);
  const classified = classifyMoves(moves);
  const summary = summarizeGame(classified);
  const prompt = buildCoachPrompt({ headers, classified, summary, question: "Was e5 sound?" });
  assert.match(prompt, /Italian Game/);
  assert.match(prompt, /1 blunders/);
  assert.match(prompt, /5\.Nxe5: blunder, gave up ~3\.2 pawns/);
  assert.match(prompt, /Was e5 sound\?/);
});
