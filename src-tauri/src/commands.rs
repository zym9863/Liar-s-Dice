use std::sync::Mutex;
use tauri::State;
use crate::game::engine::GameEngine;
use crate::game::types::GameView;

pub struct AppState {
    pub engine: Mutex<GameEngine>,
}

#[tauri::command]
pub fn start_game(state: State<'_, AppState>) -> Result<GameView, String> {
    let mut engine = state.engine.lock().map_err(|e| e.to_string())?;
    Ok(engine.start_game())
}

#[tauri::command]
pub fn player_bid(state: State<'_, AppState>, count: u32, face: u32) -> Result<GameView, String> {
    let mut engine = state.engine.lock().map_err(|e| e.to_string())?;
    engine.player_bid(count, face)
}

#[tauri::command]
pub fn player_challenge(state: State<'_, AppState>) -> Result<GameView, String> {
    let mut engine = state.engine.lock().map_err(|e| e.to_string())?;
    engine.player_challenge()
}

#[tauri::command]
pub fn get_game_state(state: State<'_, AppState>) -> Result<GameView, String> {
    let engine = state.engine.lock().map_err(|e| e.to_string())?;
    Ok(engine.state.to_view())
}

#[tauri::command]
pub fn next_round(state: State<'_, AppState>) -> Result<GameView, String> {
    let mut engine = state.engine.lock().map_err(|e| e.to_string())?;
    engine.next_round()
}
