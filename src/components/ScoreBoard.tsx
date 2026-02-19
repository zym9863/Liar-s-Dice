interface ScoreBoardProps {
  humanDice: number;
  aiDice: number;
}

export default function ScoreBoard({ humanDice, aiDice }: ScoreBoardProps) {
  return (
    <div className="flex justify-between items-center px-4 py-2 bg-gray-800/50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-blue-400 font-semibold">你</span>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < humanDice ? "bg-blue-400" : "bg-gray-600"
              }`}
            />
          ))}
        </div>
      </div>
      <span className="text-gray-500 text-sm">VS</span>
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < aiDice ? "bg-red-400" : "bg-gray-600"
              }`}
            />
          ))}
        </div>
        <span className="text-red-400 font-semibold">AI</span>
      </div>
    </div>
  );
}
