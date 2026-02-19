import { invoke } from "@tauri-apps/api/core";
import type { GameView } from "./types";

export async function startGame(): Promise<GameView> {
  return invoke<GameView>("start_game");
}

export async function playerBid(count: number, face: number): Promise<GameView> {
  return invoke<GameView>("player_bid", { count, face });
}

export async function playerChallenge(): Promise<GameView> {
  return invoke<GameView>("player_challenge");
}

export async function getGameState(): Promise<GameView> {
  return invoke<GameView>("get_game_state");
}

export async function nextRound(): Promise<GameView> {
  return invoke<GameView>("next_round");
}
