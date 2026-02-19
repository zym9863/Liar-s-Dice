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
  return (
    <div className="rounded-lg bg-gray-800/50 px-4 py-3">
      <div className="mb-2 flex items-center justify-between text-sm text-gray-300">
        <span>Round {currentRound}/{maxRounds}</span>
        <span>First to most wins after {maxRounds} rounds</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-blue-400">You</span>
          <span className="rounded bg-blue-500/20 px-2 py-1 font-mono text-blue-300">
            {humanWins}
          </span>
        </div>
        <span className="text-sm text-gray-500">VS</span>
        <div className="flex items-center gap-2">
          <span className="rounded bg-red-500/20 px-2 py-1 font-mono text-red-300">
            {aiWins}
          </span>
          <span className="font-semibold text-red-400">AI</span>
        </div>
      </div>
    </div>
  );
}
