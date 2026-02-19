use crate::game::types::*;
use crate::game::ai::AiEngine;

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

    /// 开始新一局（重置所有状态）
    pub fn start_game(&mut self) -> GameView {
        self.state = GameState::new();
        self.state.to_view()
    }

    /// 开始新一轮（保留骰子数，重新掷骰）
    pub fn new_round(&mut self) {
        self.state.roll_all_dice();
        self.state.phase = GamePhase::PlayerTurn;
        self.state.current_turn = Player::Human;
    }

    /// 玩家叫数
    pub fn player_bid(&mut self, count: u32, face: u32) -> Result<GameView, String> {
        if self.state.phase != GamePhase::PlayerTurn {
            return Err("不是你的回合".to_string());
        }

        let new_bid = Bid { count, face };

        // 验证叫数合法性
        if face < 1 || face > 6 {
            return Err("点数必须在 1-6 之间".to_string());
        }
        if count < 1 {
            return Err("数量必须大于 0".to_string());
        }
        if let Some(ref current) = self.state.current_bid {
            if !current.is_valid_raise(&new_bid) {
                return Err("叫数必须比上一次更大".to_string());
            }
        }

        self.state.current_bid = Some(new_bid.clone());
        self.state.bid_history.push((Player::Human, Action::Bid(new_bid)));
        self.state.current_turn = Player::AI;
        self.state.phase = GamePhase::AITurn;

        // AI 立即做出决策
        let ai_action = self.ai.decide(&self.state);
        self.execute_ai_action(ai_action)
    }

    /// 玩家开
    pub fn player_challenge(&mut self) -> Result<GameView, String> {
        if self.state.phase != GamePhase::PlayerTurn {
            return Err("不是你的回合".to_string());
        }
        if self.state.current_bid.is_none() {
            return Err("还没有人叫数，不能开".to_string());
        }

        self.state.bid_history.push((Player::Human, Action::Challenge));
        let result = self.resolve_challenge(Player::Human);
        self.apply_round_result(&result);
        self.state.phase = GamePhase::RoundOver(result);
        Ok(self.state.to_view())
    }

    /// 执行 AI 动作
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
                self.state.phase = GamePhase::RoundOver(result);
                Ok(self.state.to_view())
            }
        }
    }

    /// 判定开的结果
    fn resolve_challenge(&self, challenger: Player) -> RoundResult {
        let bid = self.state.current_bid.as_ref().unwrap();
        let actual_count = self.state.count_face(bid.face);

        // 实际数量 >= 叫数 → 叫的人赢（开的人输）
        // 实际数量 < 叫数 → 开的人赢（叫的人输）
        let (winner, loser) = if actual_count >= bid.count {
            // 叫数成立，开的人输
            let bidder = match challenger {
                Player::Human => Player::AI,
                Player::AI => Player::Human,
            };
            (bidder, challenger)
        } else {
            // 叫数不成立，叫的人输
            let bidder = match challenger {
                Player::Human => Player::AI,
                Player::AI => Player::Human,
            };
            (challenger, bidder)
        };

        RoundResult {
            winner,
            loser,
            human_dice: self.state.human_dice.clone(),
            ai_dice: self.state.ai_dice.clone(),
            last_bid: bid.clone(),
            actual_count,
        }
    }

    /// 应用回合结果（扣骰子）
    fn apply_round_result(&mut self, result: &RoundResult) {
        match result.loser {
            Player::Human => {
                self.state.human_dice_count = self.state.human_dice_count.saturating_sub(1);
                if self.state.human_dice_count == 0 {
                    self.state.phase = GamePhase::GameOver { winner: Player::AI };
                }
            }
            Player::AI => {
                self.state.ai_dice_count = self.state.ai_dice_count.saturating_sub(1);
                if self.state.ai_dice_count == 0 {
                    self.state.phase = GamePhase::GameOver { winner: Player::Human };
                }
            }
        }
    }

    /// 继续下一轮（在 RoundOver 后调用）
    pub fn next_round(&mut self) -> Result<GameView, String> {
        match &self.state.phase {
            GamePhase::RoundOver(_) => {
                // 检查是否游戏已经结束
                if self.state.human_dice_count == 0 {
                    self.state.phase = GamePhase::GameOver { winner: Player::AI };
                    return Ok(self.state.to_view());
                }
                if self.state.ai_dice_count == 0 {
                    self.state.phase = GamePhase::GameOver { winner: Player::Human };
                    return Ok(self.state.to_view());
                }
                self.new_round();
                Ok(self.state.to_view())
            }
            _ => Err("当前不是回合结束状态".to_string()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_start_game() {
        let mut engine = GameEngine::new();
        let view = engine.start_game();
        assert_eq!(view.human_dice.len(), 5);
        assert_eq!(view.ai_dice_count, 5);
        assert_eq!(view.phase, GamePhase::PlayerTurn);
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
        // 设置已知骰子
        engine.state.human_dice = vec![3, 3, 3, 2, 1];
        engine.state.ai_dice = vec![3, 3, 5, 6, 1];
        engine.state.current_bid = Some(Bid { count: 5, face: 3 });

        let result = engine.resolve_challenge(Player::Human);
        // 实际 3 的数量是 5，>= 叫的 5，叫的人赢
        assert_eq!(result.actual_count, 5);
        assert_eq!(result.winner, Player::AI); // AI 叫的，AI 赢
        assert_eq!(result.loser, Player::Human); // Human 开的，Human 输
    }
}
