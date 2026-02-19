import type { Player, RoundResult } from "../types";
import DiceView from "./DiceView";

interface ResultModalProps {
  result: RoundResult | null;
  gameOver: { winner: Player } | null;
  currentRound: number;
  maxRounds: number;
  humanWins: number;
  aiWins: number;
  onNextRound: () => void;
  onNewGame: () => void;
}

export default function ResultModal({
  result,
  gameOver,
  currentRound,
  maxRounds,
  humanWins,
  aiWins,
  onNextRound,
  onNewGame,
}: ResultModalProps) {
  if (!result && !gameOver) {
    return null;
  }

  const isGameOver = gameOver !== null;
  const winner = gameOver?.winner ?? result?.winner;
  const title =
    winner === "Human"
      ? isGameOver
        ? "You Own The Table"
        : "Round Secured"
      : isGameOver
        ? "House Wins The Match"
        : "AI Takes The Round";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05080e]/80 p-4 backdrop-blur-sm">
      <div className="panel w-full max-w-2xl p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="section-label">Round Resolution</p>
            <h2
              className={`title-font text-3xl ${winner === "Human" ? "text-emerald-200" : "text-rose-200"}`}
            >
              {title}
            </h2>
          </div>
          <div className="rounded-xl border border-amber-100/20 bg-slate-950/45 px-3 py-2 text-right">
            <p className="text-xs uppercase tracking-[0.16em] text-amber-100/70">Match Score</p>
            <p className="mt-1 text-sm text-slate-100">
              You {humanWins} : {aiWins} AI
            </p>
          </div>
        </div>

        {result ? (
          <div className="mt-4 rounded-xl border border-amber-100/15 bg-slate-950/40 p-3 text-sm text-slate-200">
            <p>
              Final bid: {result.last_bid.count} x face {result.last_bid.face}
            </p>
            <p className="mt-1 text-slate-300">Actual count on table: {result.actual_count}</p>
            <p className="mt-1 text-xs text-slate-400">Round {result.round} complete.</p>
          </div>
        ) : null}

        {result ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-200/18 bg-emerald-500/10 p-3">
              <DiceView dice={result.human_dice} label="Your Reveal" />
            </div>
            <div className="rounded-xl border border-rose-200/18 bg-rose-500/10 p-3">
              <DiceView dice={result.ai_dice} label="AI Reveal" />
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-300">
            Round {currentRound} of {maxRounds}
          </p>
          {isGameOver ? (
            <button className="primary-btn" onClick={onNewGame}>
              Start New Match
            </button>
          ) : (
            <button className="muted-btn" onClick={onNextRound}>
              Start Round {Math.min(currentRound + 1, maxRounds)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
