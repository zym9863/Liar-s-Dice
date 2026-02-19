import { useEffect, useMemo, useState } from "react";
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
  const nextCount = currentBid ? currentBid.count : 1;
  const nextFace = currentBid ? Math.min(6, currentBid.face + 1) : 1;

  const [count, setCount] = useState(nextCount);
  const [face, setFace] = useState(nextFace);

  useEffect(() => {
    setCount(nextCount);
    setFace(nextFace);
  }, [nextCount, nextFace]);

  const isValidBid = useMemo(() => {
    if (face < 1 || face > 6 || count < 1 || count > totalDice) {
      return false;
    }
    if (!currentBid) {
      return true;
    }
    return count > currentBid.count || (count === currentBid.count && face > currentBid.face);
  }, [count, currentBid, face, totalDice]);

  return (
    <section className="panel p-4 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="section-label">Your Action</p>
          <h3 className="title-font text-2xl text-amber-100">Raise or Challenge</h3>
        </div>
        <div className="rounded-xl border border-amber-100/20 bg-slate-950/45 px-3 py-2 text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-amber-100/75">Active Bid</p>
          <p className="mt-1 text-sm text-slate-100">
            {currentBid ? `${currentBid.count} x face ${currentBid.face}` : "No bid yet"}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-amber-100/15 bg-slate-950/35 p-3 text-sm text-slate-300">
        {currentBid
          ? "To raise: increase quantity, or keep quantity and choose a higher face."
          : "Opening move: choose any quantity and face."}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-xl border border-amber-100/15 bg-slate-900/45 p-4">
          <p className="section-label">Quantity</p>
          <div className="mt-3 flex items-center justify-between">
            <button
              className="ghost-btn"
              onClick={() => setCount((value) => Math.max(1, value - 1))}
              disabled={disabled}
            >
              -
            </button>
            <span className="title-font text-4xl text-amber-100">{count}</span>
            <button
              className="ghost-btn"
              onClick={() => setCount((value) => Math.min(totalDice, value + 1))}
              disabled={disabled}
            >
              +
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-400">Range: 1 to {totalDice} dice in play.</p>
        </div>

        <div className="rounded-xl border border-amber-100/15 bg-slate-900/45 p-4">
          <p className="section-label">Face Value</p>
          <div className="mt-3 grid grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map((value) => (
              <button
                key={value}
                className={`face-button h-10 ${face === value ? "face-button-active" : ""}`}
                onClick={() => setFace(value)}
                disabled={disabled}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="primary-btn"
          onClick={() => onBid(count, face)}
          disabled={disabled || !isValidBid}
        >
          Place Bid
        </button>

        {currentBid && (
          <button className="danger-btn" onClick={onChallenge} disabled={disabled}>
            Challenge
          </button>
        )}
      </div>
    </section>
  );
}
