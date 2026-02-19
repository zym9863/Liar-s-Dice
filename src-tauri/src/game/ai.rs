use crate::game::types::*;

pub struct AiEngine {
    /// 开的概率阈值：低于此值 AI 会选择开
    challenge_threshold: f64,
}

impl AiEngine {
    pub fn new() -> Self {
        AiEngine {
            challenge_threshold: 0.35,
        }
    }

    /// AI 决策：叫数或开
    pub fn decide(&self, state: &GameState) -> Action {
        let current_bid = match &state.current_bid {
            Some(bid) => bid,
            None => {
                // 没有当前叫数，AI 先叫一个保守的数
                return Action::Bid(self.make_initial_bid(state));
            }
        };

        // 计算当前叫数成立的概率
        let prob = self.calculate_probability(state, current_bid);

        if prob < self.challenge_threshold {
            // 概率太低，开
            Action::Challenge
        } else {
            // 尝试加注
            match self.find_raise(state, current_bid) {
                Some(bid) => Action::Bid(bid),
                None => Action::Challenge, // 无法合理加注，开
            }
        }
    }

    /// 初始叫数：选择自己手中最多的点数
    fn make_initial_bid(&self, state: &GameState) -> Bid {
        let mut best_face = 1;
        let mut best_count = 0;

        for face in 1..=6 {
            let count = state.ai_dice.iter().filter(|&&d| d == face).count();
            if count > best_count {
                best_count = count;
                best_face = face;
            }
        }

        // 保守地叫自己拥有的数量（假设对手也可能有一些）
        Bid {
            count: best_count as u32,
            face: best_face as u32,
        }
    }

    /// 寻找合理的加注
    fn find_raise(&self, state: &GameState, current_bid: &Bid) -> Option<Bid> {
        // 策略：尝试叫自己手中最多的点数
        let mut candidates: Vec<(Bid, f64)> = Vec::new();

        for face in 1..=6u32 {
            let my_count = state.ai_dice.iter().filter(|&&d| d == face).count() as u32;

            // 尝试不同数量
            for count in 1..=(state.human_dice_count + state.ai_dice_count) {
                let bid = Bid { count, face };

                // 必须是合法加注
                if !current_bid.is_valid_raise(&bid) {
                    continue;
                }

                let prob = self.calculate_probability(state, &bid);
                if prob >= 0.45 {
                    // 倾向于叫自己有的点数
                    let bonus = if my_count > 0 { my_count as f64 * 0.1 } else { 0.0 };
                    candidates.push((bid, prob + bonus));
                }
            }
        }

        // 选择概率最高的候选
        candidates.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        candidates.into_iter().next().map(|(bid, _)| bid)
    }

    /// 计算「至少 count 个 face 点」的概率
    /// AI 知道自己的骰子，对手的骰子视为均匀分布
    fn calculate_probability(&self, state: &GameState, bid: &Bid) -> f64 {
        // AI 已知自己有多少个 bid.face
        let my_count = state.ai_dice.iter().filter(|&&d| d == bid.face).count() as u32;

        // 还需要从对手的骰子中凑多少个
        let needed = if bid.count > my_count {
            bid.count - my_count
        } else {
            return 1.0; // 自己就够了，100% 成立
        };

        let opponent_dice = state.human_dice_count;
        if needed > opponent_dice {
            return 0.0; // 不可能，对手骰子不够
        }

        // 二项分布：P(X >= needed)，X ~ Binomial(opponent_dice, 1/6)
        let p = 1.0 / 6.0;
        let mut prob = 0.0;
        for k in needed..=opponent_dice {
            prob += binomial_pmf(opponent_dice, k, p);
        }
        prob
    }
}

/// 二项分布概率质量函数：C(n, k) * p^k * (1-p)^(n-k)
fn binomial_pmf(n: u32, k: u32, p: f64) -> f64 {
    let coeff = binomial_coefficient(n, k);
    coeff * p.powi(k as i32) * (1.0 - p).powi((n - k) as i32)
}

/// 组合数 C(n, k)
fn binomial_coefficient(n: u32, k: u32) -> f64 {
    if k > n {
        return 0.0;
    }
    let k = k.min(n - k); // 优化：C(n,k) = C(n,n-k)
    let mut result = 1.0;
    for i in 0..k {
        result *= (n - i) as f64;
        result /= (i + 1) as f64;
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_binomial_coefficient() {
        assert!((binomial_coefficient(5, 2) - 10.0).abs() < 1e-9);
        assert!((binomial_coefficient(10, 3) - 120.0).abs() < 1e-9);
        assert!((binomial_coefficient(5, 0) - 1.0).abs() < 1e-9);
    }

    #[test]
    fn test_probability_certain() {
        let ai = AiEngine::new();
        let mut state = GameState::new();
        state.ai_dice = vec![3, 3, 3, 3, 3];
        state.human_dice = vec![1, 2, 4, 5, 6];
        state.human_dice_count = 5;

        // AI 有 5 个 3，叫 5 个 3 概率应该是 1.0
        let prob = ai.calculate_probability(&state, &Bid { count: 5, face: 3 });
        assert!((prob - 1.0).abs() < 1e-9);
    }

    #[test]
    fn test_probability_impossible() {
        let ai = AiEngine::new();
        let mut state = GameState::new();
        state.ai_dice = vec![1, 2, 4, 5, 6];
        state.human_dice_count = 3;

        // AI 没有 3，需要对手 3 个骰子全是 3，概率很低
        let prob = ai.calculate_probability(&state, &Bid { count: 4, face: 3 });
        assert_eq!(prob, 0.0); // 需要 4 个但对手只有 3 个骰子
    }

    #[test]
    fn test_initial_bid() {
        let ai = AiEngine::new();
        let mut state = GameState::new();
        state.ai_dice = vec![2, 2, 2, 5, 6];

        let bid = ai.make_initial_bid(&state);
        assert_eq!(bid.face, 2); // 最多的是 2
        assert_eq!(bid.count, 3); // 有 3 个
    }

    #[test]
    fn test_decide_challenge_unlikely_bid() {
        let ai = AiEngine::new();
        let mut state = GameState::new();
        state.ai_dice = vec![1, 2, 4, 5, 6]; // 没有 3
        state.human_dice_count = 5;
        state.current_bid = Some(Bid { count: 8, face: 3 }); // 叫 8 个 3，不太可能

        let action = ai.decide(&state);
        assert_eq!(action, Action::Challenge);
    }
}
