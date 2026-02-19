import type { Action, Player } from "../types";

interface BidHistoryProps {
  history: [Player, Action][];
}

export default function BidHistory({ history }: BidHistoryProps) {
  if (history.length === 0) {
    return (
      <section className="flex h-full flex-col justify-center rounded-xl border border-dashed border-amber-100/20 bg-slate-950/35 p-4 text-center">
        <p className="section-label">Action Log</p>
        <p className="mt-1 text-sm text-slate-300">No bids yet. Open the round with your first call.</p>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col gap-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="section-label">Action Log</p>
          <h3 className="title-font text-2xl text-amber-100">Bidding Flow</h3>
        </div>
        <div className="rounded-lg border border-amber-100/20 bg-slate-950/45 px-2 py-1 text-xs text-slate-300">
          {history.length} moves
        </div>
      </div>

      <div className="scroll-thin max-h-[21rem] space-y-2 overflow-y-auto pr-1">
        {history.map(([player, action], index) => {
          const isHuman = player === "Human";
          const label = isHuman ? "You" : "AI";
          const text =
            action === "Challenge"
              ? "called challenge"
              : `bid ${action.Bid.count} x face ${action.Bid.face}`;

          return (
            <div
              key={index}
              className={`rounded-xl border px-3 py-2 text-sm ${
                isHuman
                  ? "border-emerald-200/20 bg-emerald-500/15 text-emerald-100"
                  : "border-rose-200/20 bg-rose-500/15 text-rose-100"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold tracking-wide">{label}</span>
                <span className="text-xs opacity-75">#{index + 1}</span>
              </div>
              <p className="mt-1 text-sm">{text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
