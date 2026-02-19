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

function Die({ value, hidden, index }: { value: number; hidden?: boolean; index: number }) {
  if (hidden) {
    return (
      <div
        className="die-base die-hidden flex items-center justify-center"
        style={{ animationDelay: `${index * 45}ms` }}
      >
        ?
      </div>
    );
  }

  const dots = dotPositions[value] || [];
  return (
    <div className="die-base" style={{ animationDelay: `${index * 45}ms` }}>
      {dots.map(([x, y], i) => (
        <div
          key={i}
          className="die-dot"
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
  const displayDice = hidden ? Array.from({ length: count ?? 0 }, (_, i) => i + 1) : dice;

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="section-label text-center">{label}</span>
      <div className="flex flex-wrap justify-center gap-2.5">
        {displayDice.map((value, index) => (
          <Die key={index} value={value} hidden={hidden} index={index} />
        ))}
      </div>
    </div>
  );
}
