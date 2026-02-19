import { useCallback, useEffect, useState } from "react";
import type { GameView, Player, RoundResult } from "../types";
import { nextRound, playerBid, playerChallenge, startGame } from "../api";
import BidHistory from "./BidHistory";
import BidPanel from "./BidPanel";
import DiceView from "./DiceView";
import ResultModal from "./ResultModal";
import ScoreBoard from "./ScoreBoard";

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
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  let roundResult: RoundResult | null = null;
  let gameOverWinner: { winner: Player } | null = null;
  let isPlayerTurn = false;

  if (typeof gameView.phase === "string") {
    isPlayerTurn = gameView.phase === "PlayerTurn";
  } else if ("RoundOver" in gameView.phase) {
    roundResult = gameView.phase.RoundOver;
  } else if ("GameOver" in gameView.phase) {
    gameOverWinner = gameView.phase.GameOver;
    roundResult = gameView.last_round_result;
  }

  const totalDice = gameView.human_dice_count + gameView.ai_dice_count;

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      <header className="py-4 text-center">
        <h1 className="text-2xl font-bold text-amber-400">Liar&apos;s Dice</h1>
      </header>

      <div className="px-4">
        <ScoreBoard
          currentRound={gameView.current_round}
          maxRounds={gameView.max_rounds}
          humanWins={gameView.human_wins}
          aiWins={gameView.ai_wins}
        />
      </div>

      <div className="flex flex-1 flex-col justify-center gap-6 px-4 py-4">
        <DiceView dice={[]} hidden count={gameView.ai_dice_count} label="AI dice" />
        <BidHistory history={gameView.bid_history} />
        <DiceView dice={gameView.human_dice} label="Your dice" />
      </div>

      <div className="px-4 pb-4">
        {error && <div className="mb-2 text-center text-sm text-red-400">{error}</div>}
        <BidPanel
          currentBid={gameView.current_bid}
          totalDice={totalDice}
          onBid={handleBid}
          onChallenge={handleChallenge}
          disabled={!isPlayerTurn || loading || gameOverWinner !== null}
        />
      </div>

      <ResultModal
        result={roundResult}
        gameOver={gameOverWinner}
        currentRound={gameView.current_round}
        maxRounds={gameView.max_rounds}
        humanWins={gameView.human_wins}
        aiWins={gameView.ai_wins}
        onNextRound={handleNextRound}
        onNewGame={handleStartGame}
      />
    </div>
  );
}
