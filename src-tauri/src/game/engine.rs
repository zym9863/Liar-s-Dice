use crate::game::ai::AiEngine;
use crate::game::types::*;

pub struct GameEngine {
    pub state: GameState,
    ai: AiEngine,
}

impl GameEngine {
    pub fn new() -> Self {
        GameEngine {
            state: GameState::new(),
            ai: AiEngine::new(),
        }
    }

    pub fn start_game(&mut self) -> GameView {
        self.state = GameState::new();
        self.state.to_view()
    }

    pub fn new_round(&mut self) {
        self.state.roll_all_dice();
        self.state.phase = GamePhase::PlayerTurn;
        self.state.current_turn = Player::Human;
    }

    pub fn player_bid(&mut self, count: u32, face: u32) -> Result<GameView, String> {
        if self.state.phase != GamePhase::PlayerTurn {
            return Err("Not player's turn".to_string());
        }

        if !(1..=6).contains(&face) {
            return Err("Face must be between 1 and 6".to_string());
        }
        if count < 1 {
            return Err("Count must be at least 1".to_string());
        }

        let new_bid = Bid { count, face };
        if let Some(ref current) = self.state.current_bid {
            if !current.is_valid_raise(&new_bid) {
                return Err("Bid must raise the current bid".to_string());
            }
        }

        self.state.current_bid = Some(new_bid.clone());
        self.state
            .bid_history
            .push((Player::Human, Action::Bid(new_bid)));
        self.state.current_turn = Player::AI;
        self.state.phase = GamePhase::AITurn;

        let ai_action = self.ai.decide(&self.state);
        self.execute_ai_action(ai_action)
    }

    pub fn player_challenge(&mut self) -> Result<GameView, String> {
        if self.state.phase != GamePhase::PlayerTurn {
            return Err("Not player's turn".to_string());
        }
        if self.state.current_bid.is_none() {
            return Err("No bid to challenge".to_string());
        }

        self.state
            .bid_history
            .push((Player::Human, Action::Challenge));
        let result = self.resolve_challenge(Player::Human);
        self.apply_round_result(&result);
        Ok(self.state.to_view())
    }

    fn execute_ai_action(&mut self, action: Action) -> Result<GameView, String> {
        match action {
            Action::Bid(bid) => {
                self.state.current_bid = Some(bid.clone());
                self.state.bid_history.push((Player::AI, Action::Bid(bid)));
                self.state.current_turn = Player::Human;
                self.state.phase = GamePhase::PlayerTurn;
                Ok(self.state.to_view())
            }
            Action::Challenge => {
                self.state.bid_history.push((Player::AI, Action::Challenge));
                let result = self.resolve_challenge(Player::AI);
                self.apply_round_result(&result);
                Ok(self.state.to_view())
            }
        }
    }

    fn resolve_challenge(&self, challenger: Player) -> RoundResult {
        let bid = self
            .state
            .current_bid
            .as_ref()
            .expect("challenge requires a bid");
        let actual_count = self.state.count_face(bid.face);

        let bidder = match challenger {
            Player::Human => Player::AI,
            Player::AI => Player::Human,
        };

        let (winner, loser) = if actual_count >= bid.count {
            (bidder, challenger)
        } else {
            (challenger, bidder)
        };

        RoundResult {
            round: self.state.current_round,
            winner,
            loser,
            human_dice: self.state.human_dice.clone(),
            ai_dice: self.state.ai_dice.clone(),
            last_bid: bid.clone(),
            actual_count,
        }
    }

    fn apply_round_result(&mut self, result: &RoundResult) {
        self.state.last_round_result = Some(result.clone());

        match result.winner {
            Player::Human => self.state.human_wins += 1,
            Player::AI => self.state.ai_wins += 1,
        }

        if self.state.current_round >= self.state.max_rounds {
            let winner = if self.state.human_wins >= self.state.ai_wins {
                Player::Human
            } else {
                Player::AI
            };
            self.state.phase = GamePhase::GameOver { winner };
            return;
        }

        self.state.phase = GamePhase::RoundOver(result.clone());
    }

    pub fn next_round(&mut self) -> Result<GameView, String> {
        match &self.state.phase {
            GamePhase::RoundOver(_) => {
                self.state.current_round += 1;
                self.new_round();
                Ok(self.state.to_view())
            }
            GamePhase::GameOver { .. } => Err("Game is over".to_string()),
            _ => Err("Can only move to next round after round over".to_string()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_result(round: u32, winner: Player, loser: Player) -> RoundResult {
        RoundResult {
            round,
            winner,
            loser,
            human_dice: vec![1, 2, 3, 4, 5],
            ai_dice: vec![1, 1, 3, 5, 6],
            last_bid: Bid { count: 3, face: 1 },
            actual_count: 3,
        }
    }

    #[test]
    fn test_start_game() {
        let mut engine = GameEngine::new();
        let view = engine.start_game();
        assert_eq!(view.human_dice.len(), 5);
        assert_eq!(view.ai_dice_count, 5);
        assert_eq!(view.phase, GamePhase::PlayerTurn);
        assert_eq!(view.current_round, 1);
        assert_eq!(view.max_rounds, 5);
    }

    #[test]
    fn test_player_bid_first() {
        let mut engine = GameEngine::new();
        engine.start_game();
        let result = engine.player_bid(2, 3);
        assert!(result.is_ok());
    }

    #[test]
    fn test_player_bid_invalid_face() {
        let mut engine = GameEngine::new();
        engine.start_game();
        let result = engine.player_bid(2, 7);
        assert!(result.is_err());
    }

    #[test]
    fn test_player_challenge_no_bid() {
        let mut engine = GameEngine::new();
        engine.start_game();
        let result = engine.player_challenge();
        assert!(result.is_err());
    }

    #[test]
    fn test_resolve_challenge() {
        let mut engine = GameEngine::new();
        engine.start_game();
        engine.state.human_dice = vec![3, 3, 3, 2, 1];
        engine.state.ai_dice = vec![3, 3, 5, 6, 1];
        engine.state.current_bid = Some(Bid { count: 5, face: 3 });

        let result = engine.resolve_challenge(Player::Human);
        assert_eq!(result.round, 1);
        assert_eq!(result.actual_count, 5);
        assert_eq!(result.winner, Player::AI);
        assert_eq!(result.loser, Player::Human);
    }

    #[test]
    fn test_round_result_keeps_five_dice() {
        let mut engine = GameEngine::new();
        engine.start_game();
        let result = make_result(1, Player::Human, Player::AI);

        engine.apply_round_result(&result);

        assert_eq!(engine.state.human_dice_count, 5);
        assert_eq!(engine.state.ai_dice_count, 5);
        assert_eq!(engine.state.human_wins, 1);
        assert_eq!(engine.state.ai_wins, 0);
        assert!(matches!(engine.state.phase, GamePhase::RoundOver(_)));
    }

    #[test]
    fn test_game_over_after_five_rounds() {
        let mut engine = GameEngine::new();
        engine.start_game();

        for round in 1..=5 {
            engine.state.current_round = round;
            let result = make_result(round, Player::Human, Player::AI);
            engine.apply_round_result(&result);

            if round < 5 {
                assert!(matches!(engine.state.phase, GamePhase::RoundOver(_)));
                let _ = engine.next_round().unwrap();
            }
        }

        assert!(matches!(engine.state.phase, GamePhase::GameOver { .. }));
        assert_eq!(engine.state.human_wins, 5);
        assert_eq!(engine.state.ai_wins, 0);
        if let GamePhase::GameOver { winner } = engine.state.phase {
            assert_eq!(winner, Player::Human);
        }
    }
}
