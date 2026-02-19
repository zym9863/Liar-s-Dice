mod game;
mod commands;

use commands::AppState;
use game::engine::GameEngine;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            engine: Mutex::new(GameEngine::new()),
        })
        .invoke_handler(tauri::generate_handler![
            commands::start_game,
            commands::player_bid,
            commands::player_challenge,
            commands::get_game_state,
            commands::next_round,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
