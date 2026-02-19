import type { RoundResult, Player } from "../types";
import DiceView from "./DiceView";

interface ResultModalProps {
  result: RoundResult | null;
  gameOver: { winner: Player } | null;
  onNextRound: () => void;
  onNewGame: () => void;
}

export default function ResultModal({
  result,
  gameOver,
  onNextRound,
  onNewGame,
}: ResultModalProps) {
  if (!result && !gameOver) return null;

  const isGameOver = gameOver !== null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        {isGameOver ? (
          <>
            <h2 className="text-2xl font-bold text-center mb-4">
              {gameOver!.winner === "Human" ? (
                <span className="text-amber-400">你赢了！</span>
              ) : (
                <span className="text-gray-400">AI 获胜</span>
              )}
            </h2>
            <button
              className="w-full py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-400 transition-colors"
              onClick={onNewGame}
            >
              再来一局
            </button>
          </>
        ) : (
          result && (
            <>
              <h2 className="text-xl font-bold text-center mb-2">
                {result.winner === "Human" ? (
                  <span className="text-green-400">你赢了这轮！</span>
                ) : (
                  <span className="text-red-400">AI 赢了这轮</span>
                )}
              </h2>

              <div className="text-center text-sm text-gray-400 mb-4">
                叫数：{result.last_bid.count} 个 {result.last_bid.face} 点
                <br />
                实际：{result.actual_count} 个 {result.last_bid.face} 点
              </div>

              <div className="flex flex-col gap-3 mb-4">
                <DiceView dice={result.human_dice} label="你的骰子" />
                <DiceView dice={result.ai_dice} label="AI 的骰子" />
              </div>

              <button
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 transition-colors"
                onClick={onNextRound}
              >
                下一轮
              </button>
            </>
          )
        )}
      </div>
    </div>
  );
}
