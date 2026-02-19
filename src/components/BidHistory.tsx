import type { Player, Action } from "../types";

interface BidHistoryProps {
  history: [Player, Action][];
}

export default function BidHistory({ history }: BidHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 max-h-40 overflow-y-auto">
      <div className="text-xs text-gray-400 mb-2">叫数记录</div>
      <div className="flex flex-col gap-1">
        {history.map(([player, action], index) => {
          const isHuman = player === "Human";
          const label = isHuman ? "你" : "AI";
          const text =
            action === "Challenge"
              ? "开！"
              : `叫 ${action.Bid.count} 个 ${action.Bid.face} 点`;

          return (
            <div
              key={index}
              className={`text-sm px-2 py-1 rounded ${
                isHuman
                  ? "text-blue-300 bg-blue-900/30"
                  : "text-red-300 bg-red-900/30"
              }`}
            >
              <span className="font-semibold">{label}：</span>
              {text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
