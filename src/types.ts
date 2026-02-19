export interface Bid {
  count: number;
  face: number;
}

export type Player = "Human" | "AI";

export type Action = { Bid: Bid } | "Challenge";

export interface RoundResult {
  round: number;
  winner: Player;
  loser: Player;
  human_dice: number[];
  ai_dice: number[];
  last_bid: Bid;
  actual_count: number;
}

export type GamePhase =
  | "PlayerTurn"
  | "AITurn"
  | { RoundOver: RoundResult }
  | { GameOver: { winner: Player } };

export interface GameView {
  phase: GamePhase;
  human_dice: number[];
  ai_dice_count: number;
  human_dice_count: number;
  bid_history: [Player, Action][];
  current_bid: Bid | null;
  current_round: number;
  max_rounds: number;
  human_wins: number;
  ai_wins: number;
  last_round_result: RoundResult | null;
}
