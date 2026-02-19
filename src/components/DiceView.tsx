interface DiceViewProps {
  dice: number[];
  hidden?: boolean;
  label: string;
  count?: number;
}

const dotPositions: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

function Die({ value, hidden }: { value: number; hidden?: boolean }) {
  if (hidden) {
    return (
      <div className="w-14 h-14 bg-gray-600 rounded-lg border-2 border-gray-500 flex items-center justify-center text-gray-400 text-xl font-bold shadow-md">
        ?
      </div>
    );
  }

  const dots = dotPositions[value] || [];
  return (
    <div className="w-14 h-14 bg-white rounded-lg border-2 border-gray-300 relative shadow-md">
      {dots.map(([x, y], i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 bg-gray-800 rounded-full absolute"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}

export default function DiceView({ dice, hidden, label, count }: DiceViewProps) {
  const displayDice = hidden
    ? Array.from({ length: count ?? 0 }, (_, i) => i + 1)
    : dice;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-semibold text-gray-300">{label}</span>
      <div className="flex gap-2 flex-wrap justify-center">
        {displayDice.map((value, index) => (
          <Die key={index} value={value} hidden={hidden} />
        ))}
      </div>
    </div>
  );
}
