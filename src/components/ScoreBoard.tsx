interface ScoreBoardProps {
  currentRound: number;
  maxRounds: number;
  humanWins: number;
  aiWins: number;
}

export default function ScoreBoard({
  currentRound,
  maxRounds,
  humanWins,
  aiWins,
}: ScoreBoardProps) {
  const progress = Math.min(100, Math.max(0, ((currentRound - 1) / maxRounds) * 100));
  const humanWinRate = (humanWins / maxRounds) * 100;
  const aiWinRate = (aiWins / maxRounds) * 100;
  const lead = humanWins - aiWins;
  const leadMessage =
    lead === 0 ? "Dead even table." : lead > 0 ? "You have the momentum." : "AI is ahead.";

  return (
    <section className="panel p-4 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="section-label">Match Progress</p>
          <h2 className="title-font text-2xl text-amber-100">
            Round {currentRound} / {maxRounds}
          </h2>
          <p className="text-sm text-slate-300">{leadMessage}</p>
        </div>
        <div className="min-w-48 rounded-xl border border-amber-200/20 bg-slate-950/45 px-3 py-2 text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-100/70">Current Score</p>
          <p className="mt-1 text-lg font-semibold text-slate-100">
            You {humanWins} : {aiWins} AI
          </p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900/70">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-300/55 via-amber-300/80 to-amber-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-200/20 bg-emerald-500/10 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-emerald-200">You</span>
            <span className="text-emerald-100/90">{humanWins} wins</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-900/75">
            <div className="h-full rounded-full bg-emerald-300/85" style={{ width: `${humanWinRate}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-rose-200/20 bg-rose-500/10 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-rose-200">AI</span>
            <span className="text-rose-100/90">{aiWins} wins</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-900/75">
            <div className="h-full rounded-full bg-rose-300/85" style={{ width: `${aiWinRate}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
