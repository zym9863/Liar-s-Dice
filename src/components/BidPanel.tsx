import { useState } from "react";
import type { Bid } from "../types";

interface BidPanelProps {
  currentBid: Bid | null;
  totalDice: number;
  onBid: (count: number, face: number) => void;
  onChallenge: () => void;
  disabled: boolean;
}

export default function BidPanel({
  currentBid,
  totalDice,
  onBid,
  onChallenge,
  disabled,
}: BidPanelProps) {
  const [count, setCount] = useState(currentBid ? currentBid.count : 1);
  const [face, setFace] = useState(currentBid ? currentBid.face : 1);

  const isValidBid = () => {
    if (face < 1 || face > 6 || count < 1) return false;
    if (!currentBid) return true;
    return (
      count > currentBid.count ||
      (count === currentBid.count && face > currentBid.face)
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-4">
      <div className="text-center text-sm text-gray-400">
        {currentBid
          ? `当前叫数：${currentBid.count} 个 ${currentBid.face} 点`
          : "请开始叫数"}
      </div>

      <div className="flex items-center gap-4 justify-center">
        <div className="flex flex-col items-center gap-1">
          <label className="text-xs text-gray-400">数量</label>
          <div className="flex items-center gap-1">
            <button
              className="w-8 h-8 bg-gray-700 rounded text-white hover:bg-gray-600 disabled:opacity-30"
              onClick={() => setCount((c) => Math.max(1, c - 1))}
              disabled={disabled}
            >
              -
            </button>
            <span className="w-8 text-center text-xl font-bold text-white">
              {count}
            </span>
            <button
              className="w-8 h-8 bg-gray-700 rounded text-white hover:bg-gray-600 disabled:opacity-30"
              onClick={() => setCount((c) => Math.min(totalDice, c + 1))}
              disabled={disabled}
            >
              +
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <label className="text-xs text-gray-400">点数</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map((f) => (
              <button
                key={f}
                className={`w-9 h-9 rounded font-bold text-lg ${
                  face === f
                    ? "bg-amber-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                } disabled:opacity-30`}
                onClick={() => setFace(f)}
                disabled={disabled}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          onClick={() => onBid(count, face)}
          disabled={disabled || !isValidBid()}
        >
          叫数
        </button>
        {currentBid && (
          <button
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            onClick={onChallenge}
            disabled={disabled}
          >
            开！
          </button>
        )}
      </div>
    </div>
  );
}
