use rand::Rng;
use serde::{Deserialize, Serialize};

pub const MAX_DICE_PER_PLAYER: u32 = 5;
pub const MAX_ROUNDS: u32 = 5;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Bid {
    pub count: u32,
    pub face: u32,
}

impl Bid {
    pub fn is_valid_raise(&self, new_bid: &Bid) -> bool {
        if new_bid.face < 1 || new_bid.face > 6 || new_bid.count < 1 {
            return false;
        }
        new_bid.count > self.count || (new_bid.count == self.count && new_bid.face > self.face)
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum Player {
    Human,
    AI,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Action {
    Bid(Bid),
    Challenge,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RoundResult {
    pub round: u32,
    pub winner: Player,
    pub loser: Player,
    pub human_dice: Vec<u32>,
    pub ai_dice: Vec<u32>,
    pub last_bid: Bid,
    pub actual_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum GamePhase {
    PlayerTurn,
    AITurn,
    RoundOver(RoundResult),
    GameOver { winner: Player },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameView {
    pub phase: GamePhase,
    pub human_dice: Vec<u32>,
    pub ai_dice_count: u32,
    pub human_dice_count: u32,
    pub bid_history: Vec<(Player, Action)>,
    pub current_bid: Option<Bid>,
    pub current_round: u32,
    pub max_rounds: u32,
    pub human_wins: u32,
    pub ai_wins: u32,
    pub last_round_result: Option<RoundResult>,
}

#[derive(Debug, Clone)]
pub struct GameState {
    pub human_dice: Vec<u32>,
    pub ai_dice: Vec<u32>,
    pub human_dice_count: u32,
    pub ai_dice_count: u32,
    pub phase: GamePhase,
    pub bid_history: Vec<(Player, Action)>,
    pub current_bid: Option<Bid>,
    pub current_turn: Player,
    pub current_round: u32,
    pub max_rounds: u32,
    pub human_wins: u32,
    pub ai_wins: u32,
    pub last_round_result: Option<RoundResult>,
}

impl GameState {
    pub fn new() -> Self {
        let mut state = GameState {
            human_dice: Vec::new(),
            ai_dice: Vec::new(),
            human_dice_count: MAX_DICE_PER_PLAYER,
            ai_dice_count: MAX_DICE_PER_PLAYER,
            phase: GamePhase::PlayerTurn,
            bid_history: Vec::new(),
            current_bid: None,
            current_turn: Player::Human,
            current_round: 1,
            max_rounds: MAX_ROUNDS,
            human_wins: 0,
            ai_wins: 0,
            last_round_result: None,
        };
        state.roll_all_dice();
        state
    }

    pub fn roll_all_dice(&mut self) {
        let mut rng = rand::thread_rng();
        self.human_dice = Self::roll_dice_with_auto_reroll(&mut rng, self.human_dice_count);
        self.ai_dice = Self::roll_dice_with_auto_reroll(&mut rng, self.ai_dice_count);
        self.bid_history.clear();
        self.current_bid = None;
        self.last_round_result = None;
    }

    fn roll_dice_with_auto_reroll(rng: &mut impl Rng, count: u32) -> Vec<u32> {
        Self::roll_dice_with_auto_reroll_using(count, || {
            (0..count).map(|_| rng.gen_range(1..=6)).collect()
        })
    }

    fn roll_dice_with_auto_reroll_using<F>(count: u32, mut roll_once: F) -> Vec<u32>
    where
        F: FnMut() -> Vec<u32>,
    {
        loop {
            let rolled = roll_once();
            if count != MAX_DICE_PER_PLAYER || !Self::has_five_distinct(&rolled) {
                return rolled;
            }
        }
    }

    fn has_five_distinct(dice: &[u32]) -> bool {
        if dice.len() != MAX_DICE_PER_PLAYER as usize {
            return false;
        }

        let mut seen = [false; 7];
        for &value in dice {
            if !(1..=6).contains(&value) {
                return false;
            }

            let index = value as usize;
            if seen[index] {
                return false;
            }
            seen[index] = true;
        }

        true
    }

    pub fn to_view(&self) -> GameView {
        GameView {
            phase: self.phase.clone(),
            human_dice: self.human_dice.clone(),
            ai_dice_count: self.ai_dice_count,
            human_dice_count: self.human_dice_count,
            bid_history: self.bid_history.clone(),
            current_bid: self.current_bid.clone(),
            current_round: self.current_round,
            max_rounds: self.max_rounds,
            human_wins: self.human_wins,
            ai_wins: self.ai_wins,
            last_round_result: self.last_round_result.clone(),
        }
    }

    pub fn count_face(&self, face: u32) -> u32 {
        let human_count = self.human_dice.iter().filter(|&&d| d == face).count() as u32;
        let ai_count = self.ai_dice.iter().filter(|&&d| d == face).count() as u32;
        human_count + ai_count
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bid_valid_raise_higher_count() {
        let current = Bid { count: 3, face: 4 };
        let new_bid = Bid { count: 4, face: 2 };
        assert!(current.is_valid_raise(&new_bid));
    }

    #[test]
    fn test_bid_valid_raise_same_count_higher_face() {
        let current = Bid { count: 3, face: 4 };
        let new_bid = Bid { count: 3, face: 5 };
        assert!(current.is_valid_raise(&new_bid));
    }

    #[test]
    fn test_bid_invalid_raise_lower() {
        let current = Bid { count: 3, face: 4 };
        let new_bid = Bid { count: 2, face: 6 };
        assert!(!current.is_valid_raise(&new_bid));
    }

    #[test]
    fn test_bid_invalid_raise_same() {
        let current = Bid { count: 3, face: 4 };
        let new_bid = Bid { count: 3, face: 4 };
        assert!(!current.is_valid_raise(&new_bid));
    }

    #[test]
    fn test_bid_invalid_face_out_of_range() {
        let current = Bid { count: 1, face: 1 };
        let new_bid = Bid { count: 2, face: 7 };
        assert!(!current.is_valid_raise(&new_bid));
    }

    #[test]
    fn test_game_state_new() {
        let state = GameState::new();
        assert_eq!(state.human_dice.len(), 5);
        assert_eq!(state.ai_dice.len(), 5);
        assert_eq!(state.human_dice_count, 5);
        assert_eq!(state.ai_dice_count, 5);
        assert_eq!(state.current_round, 1);
        assert_eq!(state.max_rounds, 5);
        assert_eq!(state.human_wins, 0);
        assert_eq!(state.ai_wins, 0);
        assert!(state.human_dice.iter().all(|&d| (1..=6).contains(&d)));
        assert!(state.ai_dice.iter().all(|&d| (1..=6).contains(&d)));
    }

    #[test]
    fn test_count_face() {
        let mut state = GameState::new();
        state.human_dice = vec![1, 2, 3, 4, 5];
        state.ai_dice = vec![1, 1, 3, 5, 6];
        assert_eq!(state.count_face(1), 3);
        assert_eq!(state.count_face(3), 2);
        assert_eq!(state.count_face(6), 1);
        assert_eq!(state.count_face(2), 1);
    }

    #[test]
    fn test_to_view_hides_ai_dice() {
        let state = GameState::new();
        let view = state.to_view();
        assert_eq!(view.human_dice.len(), 5);
        assert_eq!(view.ai_dice_count, 5);
        assert_eq!(view.current_round, 1);
        assert_eq!(view.max_rounds, 5);
    }

    #[test]
    fn test_has_five_distinct_true() {
        assert!(GameState::has_five_distinct(&[1, 2, 3, 4, 5]));
    }

    #[test]
    fn test_has_five_distinct_false_with_duplicate() {
        assert!(!GameState::has_five_distinct(&[1, 2, 2, 4, 5]));
    }

    #[test]
    fn test_has_five_distinct_false_non_five_len() {
        assert!(!GameState::has_five_distinct(&[1, 2, 3, 4]));
    }

    #[test]
    fn test_roll_dice_with_auto_reroll_until_not_distinct() {
        let mut call_count = 0;
        let rolled = GameState::roll_dice_with_auto_reroll_using(5, || {
            call_count += 1;
            if call_count == 1 {
                vec![1, 2, 3, 4, 5]
            } else {
                vec![1, 1, 3, 4, 5]
            }
        });

        assert_eq!(call_count, 2);
        assert_eq!(rolled, vec![1, 1, 3, 4, 5]);
    }

    #[test]
    fn test_roll_dice_with_auto_reroll_no_reroll_when_not_five_dice() {
        let mut call_count = 0;
        let rolled = GameState::roll_dice_with_auto_reroll_using(4, || {
            call_count += 1;
            vec![1, 2, 3, 4]
        });

        assert_eq!(call_count, 1);
        assert_eq!(rolled, vec![1, 2, 3, 4]);
    }
}
