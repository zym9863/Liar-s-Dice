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
    } catch (err) {
      setError(String(err));
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
    } catch (err) {
      setError(String(err));
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
    } catch (err) {
      setError(String(err));
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
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!gameView) {
    return (
      <div className="app-shell loading-shell">
        <div className="spinner" />
        <p className="text-sm tracking-wide text-slate-300">Shuffling the opening hand...</p>
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
  const statusClass = gameOverWinner
    ? "status-danger"
    : isPlayerTurn
      ? "status-live"
      : "";
  const statusText = gameOverWinner
    ? "Match over"
    : roundResult
      ? "Round complete"
      : isPlayerTurn
        ? "Your turn"
        : "AI turn";

  return (
    <div className="app-shell">
      <div className="ornament-grid" />

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 md:gap-5 md:px-8 md:py-8">
        <header className="panel p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-label">Casino Table</p>
              <h1 className="title-font text-4xl text-amber-100 md:text-5xl">Liar&apos;s Dice</h1>
              <p className="mt-1 text-sm text-slate-300">Read the tells. Press the odds. Time the challenge.</p>
            </div>

            <div className="flex flex-col items-start gap-2 md:items-end">
              <span className={`status-chip ${statusClass}`}>{statusText}</span>
              <div className="rounded-xl border border-amber-100/20 bg-slate-950/45 px-3 py-2 text-right">
                <p className="text-xs uppercase tracking-[0.16em] text-amber-100/70">Current Bid</p>
                <p className="mt-1 text-sm text-slate-100">
                  {gameView.current_bid
                    ? `${gameView.current_bid.count} x face ${gameView.current_bid.face}`
                    : "No bid yet"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <ScoreBoard
          currentRound={gameView.current_round}
          maxRounds={gameView.max_rounds}
          humanWins={gameView.human_wins}
          aiWins={gameView.ai_wins}
        />

        <section className="grid gap-4 xl:grid-cols-[1.06fr_1fr_1.06fr]">
          <article className="panel flex flex-col gap-4 p-4 md:p-5">
            <DiceView dice={[]} hidden count={gameView.ai_dice_count} label="Opponent Dice" />
            <div className="glass-divider" />
            <p className="text-center text-xs text-slate-400">AI dice remain hidden until a challenge resolves.</p>
          </article>

          <article className="panel p-4 md:p-5">
            <BidHistory history={gameView.bid_history} />
          </article>

          <article className="panel flex flex-col gap-4 p-4 md:p-5">
            <DiceView dice={gameView.human_dice} label="Your Dice" />
            <div className="glass-divider" />
            <p className="text-center text-xs text-slate-400">Dice in play: {totalDice}</p>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <BidPanel
            currentBid={gameView.current_bid}
            totalDice={totalDice}
            onBid={handleBid}
            onChallenge={handleChallenge}
            disabled={!isPlayerTurn || loading || gameOverWinner !== null}
          />

          <aside className="panel flex flex-col gap-3 p-4 md:p-5">
            <p className="section-label">Table Notes</p>
            <div className="rounded-xl border border-amber-100/15 bg-slate-950/35 p-3 text-sm text-slate-300">
              <p>Every round uses five dice each. No attrition, no carry-over.</p>
            </div>
            <div className="rounded-xl border border-amber-100/15 bg-slate-950/35 p-3 text-sm text-slate-300">
              <p>Challenge when the quantity feels inflated against visible pressure.</p>
            </div>
            <div className="rounded-xl border border-amber-100/15 bg-slate-950/35 p-3 text-sm text-slate-300">
              <p>Final winner is the side with more round wins after {gameView.max_rounds} rounds.</p>
            </div>
          </aside>
        </section>

        {error ? (
          <div className="rounded-xl border border-rose-400/35 bg-rose-500/18 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </main>

      {loading ? (
        <div className="pointer-events-none fixed right-4 top-4 z-40 flex items-center gap-2 rounded-full border border-amber-100/30 bg-slate-950/70 px-3 py-2 text-xs text-amber-100">
          <div className="spinner" />
          Syncing table
        </div>
      ) : null}

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
