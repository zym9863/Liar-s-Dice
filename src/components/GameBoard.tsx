import { useState, useEffect, useCallback } from "react";
import type { GameView, RoundResult, Player } from "../types";
import { startGame, playerBid, playerChallenge, nextRound } from "../api";
import DiceView from "./DiceView";
import BidPanel from "./BidPanel";
import BidHistory from "./BidHistory";
import ScoreBoard from "./ScoreBoard";
import ResultModal from "./ResultModal";

export default function GameBoard() {
  const [gameView, setGameView] = useState<GameView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStartGame = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const view = await startGame();
      setGameView(view);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    handleStartGame();
  }, [handleStartGame]);

  const handleBid = async (count: number, face: number) => {
    try {
      setLoading(true);
      setError(null);
      const view = await playerBid(count, face);
      setGameView(view);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleChallenge = async () => {
    try {
      setLoading(true);
      setError(null);
      const view = await playerChallenge();
      setGameView(view);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleNextRound = async () => {
    try {
      setLoading(true);
      setError(null);
      const view = await nextRound();
      setGameView(view);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  if (!gameView) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        加载中...
      </div>
    );
  }

  // 解析游戏阶段
  let roundResult: RoundResult | null = null;
  let gameOverWinner: { winner: Player } | null = null;
  let isPlayerTurn = false;

  if (typeof gameView.phase === "string") {
    isPlayerTurn = gameView.phase === "PlayerTurn";
  } else if ("RoundOver" in gameView.phase) {
    roundResult = gameView.phase.RoundOver;
  } else if ("GameOver" in gameView.phase) {
    gameOverWinner = gameView.phase.GameOver;
  }

  const totalDice = gameView.human_dice_count + gameView.ai_dice_count;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* 标题 */}
      <header className="text-center py-4">
        <h1 className="text-2xl font-bold text-amber-400">大话骰</h1>
      </header>

      {/* 计分板 */}
      <div className="px-4">
        <ScoreBoard
          humanDice={gameView.human_dice_count}
          aiDice={gameView.ai_dice_count}
        />
      </div>

      {/* 游戏区域 */}
      <div className="flex-1 flex flex-col justify-center gap-6 px-4 py-4">
        {/* AI 骰子（隐藏） */}
        <DiceView
          dice={[]}
          hidden
          count={gameView.ai_dice_count}
          label="AI 的骰子"
        />

        {/* 叫数历史 */}
        <BidHistory history={gameView.bid_history} />

        {/* 玩家骰子 */}
        <DiceView dice={gameView.human_dice} label="你的骰子" />
      </div>

      {/* 操作面板 */}
      <div className="px-4 pb-4">
        {error && (
          <div className="text-red-400 text-sm text-center mb-2">{error}</div>
        )}
        <BidPanel
          currentBid={gameView.current_bid}
          totalDice={totalDice}
          onBid={handleBid}
          onChallenge={handleChallenge}
          disabled={!isPlayerTurn || loading}
        />
      </div>

      {/* 结果弹窗 */}
      <ResultModal
        result={roundResult}
        gameOver={gameOverWinner}
        onNextRound={handleNextRound}
        onNewGame={handleStartGame}
      />
    </div>
  );
}
