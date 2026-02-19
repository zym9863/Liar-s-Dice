use serde::{Deserialize, Serialize};
use rand::Rng;

/// 一次叫数
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Bid {
    pub count: u32,    // 数量：至少有几个
    pub face: u32,     // 点数：1-6
}

impl Bid {
    /// 判断 new_bid 是否是合法的加注（数量更大，或数量相同但点数更大）
    pub fn is_valid_raise(&self, new_bid: &Bid) -> bool {
        if new_bid.face < 1 || new_bid.face > 6 || new_bid.count < 1 {
            return false;
        }
        new_bid.count > self.count
            || (new_bid.count == self.count && new_bid.face > self.face)
    }
}

/// 玩家身份
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum Player {
    Human,
    AI,
}

/// 一个回合中的动作
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Action {
    Bid(Bid),
    Challenge,
}

/// 回合结果
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RoundResult {
    pub winner: Player,
    pub loser: Player,
    pub human_dice: Vec<u32>,
    pub ai_dice: Vec<u32>,
    pub last_bid: Bid,
    pub actual_count: u32,
}

/// 游戏阶段
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum GamePhase {
    /// 等待玩家操作（叫数或开）
    PlayerTurn,
    /// AI 回合（前端等待 AI 响应）
    AITurn,
    /// 回合结束，展示结果
    RoundOver(RoundResult),
    /// 游戏结束
    GameOver { winner: Player },
}

/// 前端可见的游戏状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameView {
    pub phase: GamePhase,
    pub human_dice: Vec<u32>,
    pub ai_dice_count: u32,
    pub human_dice_count: u32,
    pub bid_history: Vec<(Player, Action)>,
    pub current_bid: Option<Bid>,
}

/// 完整游戏状态（后端内部使用）
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
}

impl GameState {
    pub fn new() -> Self {
        let mut state = GameState {
            human_dice: Vec::new(),
            ai_dice: Vec::new(),
            human_dice_count: 5,
            ai_dice_count: 5,
            phase: GamePhase::PlayerTurn,
            bid_history: Vec::new(),
            current_bid: None,
            current_turn: Player::Human,
        };
        state.roll_all_dice();
        state
    }

    pub fn roll_all_dice(&mut self) {
        let mut rng = rand::thread_rng();
        self.human_dice = (0..self.human_dice_count)
            .map(|_| rng.gen_range(1..=6))
            .collect();
        self.ai_dice = (0..self.ai_dice_count)
            .map(|_| rng.gen_range(1..=6))
            .collect();
        self.bid_history.clear();
        self.current_bid = None;
    }

    /// 生成前端可见的视图（隐藏 AI 骰子）
    pub fn to_view(&self) -> GameView {
        GameView {
            phase: self.phase.clone(),
            human_dice: self.human_dice.clone(),
            ai_dice_count: self.ai_dice_count,
            human_dice_count: self.human_dice_count,
            bid_history: self.bid_history.clone(),
            current_bid: self.current_bid.clone(),
        }
    }

    /// 统计所有骰子中某个点数的总数
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
        assert!(state.human_dice.iter().all(|&d| d >= 1 && d <= 6));
        assert!(state.ai_dice.iter().all(|&d| d >= 1 && d <= 6));
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
        // view 不应包含 ai_dice 的具体值
        assert_eq!(view.ai_dice_count, 5);
    }
}
