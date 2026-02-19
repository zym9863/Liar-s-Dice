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
  if (!result && !gameOver) return null;

  const isGameOver = gameOver !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-gray-800 p-6 shadow-2xl">
        <h2 className="mb-2 text-center text-xl font-bold">
          {result ? (
            <span className={result.winner === "Human" ? "text-green-400" : "text-red-400"}>
              Round {result.round}: {result.winner === "Human" ? "You win" : "AI wins"}
            </span>
          ) : null}
        </h2>

        {result ? (
          <div className="mb-4 text-center text-sm text-gray-400">
            Bid: {result.last_bid.count} x face {result.last_bid.face}
            <br />
            Actual count: {result.actual_count}
          </div>
        ) : null}

        {result ? (
          <div className="mb-4 flex flex-col gap-3">
            <DiceView dice={result.human_dice} label="Your dice" />
            <DiceView dice={result.ai_dice} label="AI dice" />
          </div>
        ) : null}

        <div className="mb-4 rounded-lg bg-gray-900/70 p-3 text-center">
          <div className="text-sm text-gray-400">
            Match score ({currentRound}/{maxRounds})
          </div>
          <div className="mt-1 text-lg font-semibold text-white">
            You {humanWins} : {aiWins} AI
          </div>
        </div>

        {isGameOver ? (
          <>
            <div className="mb-4 text-center text-lg font-bold">
              {gameOver.winner === "Human" ? (
                <span className="text-amber-400">Match winner: You</span>
              ) : (
                <span className="text-gray-300">Match winner: AI</span>
              )}
            </div>
            <button
              className="w-full rounded-lg bg-amber-500 py-3 font-semibold text-white transition-colors hover:bg-amber-400"
              onClick={onNewGame}
            >
              New Match
            </button>
          </>
        ) : (
          <button
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-500"
            onClick={onNextRound}
          >
            Start Round {Math.min(currentRound + 1, maxRounds)}
          </button>
        )}
      </div>
    </div>
  );
}
