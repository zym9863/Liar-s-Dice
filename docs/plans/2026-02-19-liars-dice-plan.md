# 大话骰 (Liar's Dice) 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个 Tauri v2 桌面应用，实现玩家与智能 AI 的 1v1 大话骰对战。

**Architecture:** Rust 后端处理所有游戏逻辑（状态管理、规则判定、AI 决策），通过 Tauri commands 暴露给 React 前端。前端只负责 UI 渲染和用户交互，通过 `invoke()` 调用后端命令。

**Tech Stack:** Tauri v2, Rust, React, TypeScript, Vite, Tailwind CSS

---

### Task 1: 项目脚手架

**Files:**
- Create: 整个项目结构 (由 create-tauri-app 生成)

**Step 1: 创建 Tauri 项目**

运行以下命令（交互式选择 React + TypeScript）：

```bash
cd "d:/github/Liar's Dice"
pnpm create tauri-app . --template react-ts
```

如果 `create-tauri-app` 不支持 `.` 作为目标目录，则创建到临时目录再移动文件。

交互选择：
- Project name: `liars-dice`
- Identifier: `com.liars-dice.app`
- Frontend: TypeScript / JavaScript (pnpm)
- UI template: React
- UI flavor: TypeScript

**Step 2: 安装依赖并验证**

```bash
pnpm install
pnpm tauri dev
```

Expected: 应用窗口打开，显示默认 Tauri + React 页面。关闭窗口。

**Step 3: Commit**

```bash
git add .
git commit -m "init: scaffold Tauri v2 project with React + TypeScript"
```

---

### Task 2: 添加 Tailwind CSS

**Files:**
- Modify: `package.json` (添加依赖)
- Modify: `src/index.css` (替换为 Tailwind 导入)
- Create: `tailwind.config.js`
- Create: `postcss.config.js`

**Step 1: 安装 Tailwind CSS**

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

**Step 2: 配置 Vite 插件**

修改 `vite.config.ts`：

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
```

**Step 3: 导入 Tailwind CSS**

替换 `src/index.css` 内容为：

```css
@import "tailwindcss";
```

**Step 4: 验证**

```bash
pnpm tauri dev
```

Expected: 应用正常启动，Tailwind 类名生效。

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add Tailwind CSS"
```

---

### Task 3: Rust 游戏类型定义

**Files:**
- Create: `src-tauri/src/game/mod.rs`
- Create: `src-tauri/src/game/types.rs`
- Modify: `src-tauri/src/lib.rs` (添加 mod game)

**Step 1: 编写类型定义和测试**

创建 `src-tauri/src/game/types.rs`：

```rust
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
```

**Step 2: 创建模块文件**

创建 `src-tauri/src/game/mod.rs`：

```rust
pub mod types;
pub mod engine;
pub mod ai;
```

在 `src-tauri/src/lib.rs` 顶部添加：

```rust
mod game;
```

**Step 3: 添加 rand 依赖**

在 `src-tauri/Cargo.toml` 的 `[dependencies]` 中添加：

```toml
rand = "0.8"
```

**Step 4: 运行测试确认通过**

```bash
cd src-tauri && cargo test
```

Expected: 所有测试通过。

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add Rust game types with tests"
```

---

### Task 4: Rust 游戏引擎

**Files:**
- Create: `src-tauri/src/game/engine.rs`

**Step 1: 编写游戏引擎和测试**

创建 `src-tauri/src/game/engine.rs`：

```rust
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
```

**Step 2: 运行测试**

```bash
cd src-tauri && cargo test
```

Expected: 所有测试通过。

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add game engine with bid/challenge logic"
```

---

### Task 5: Rust AI 引擎

**Files:**
- Create: `src-tauri/src/game/ai.rs`

**Step 1: 编写 AI 引擎和测试**

创建 `src-tauri/src/game/ai.rs`：

```rust
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
```

**Step 2: 运行测试**

```bash
cd src-tauri && cargo test
```

Expected: 所有测试通过。

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add AI engine with probability-based decision making"
```

---

### Task 6: Rust Tauri Commands

**Files:**
- Create: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/lib.rs` (注册 commands)

**Step 1: 编写 Tauri commands**

创建 `src-tauri/src/commands.rs`：

```rust
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
```

**Step 2: 修改 lib.rs 注册 commands**

修改 `src-tauri/src/lib.rs`：

```rust
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
```

**Step 3: 编译验证**

```bash
cd src-tauri && cargo build
```

Expected: 编译成功，无错误。

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add Tauri commands for game interaction"
```

---

### Task 7: React 类型定义

**Files:**
- Create: `src/types.ts`

**Step 1: 创建前端类型定义（与 Rust 类型对齐）**

创建 `src/types.ts`：

```typescript
export interface Bid {
  count: number;
  face: number;
}

export type Player = "Human" | "AI";

export type Action =
  | { Bid: Bid }
  | "Challenge";

export interface RoundResult {
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
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add frontend TypeScript type definitions"
```

---

### Task 8: React 游戏 API 封装

**Files:**
- Create: `src/api.ts`

**Step 1: 创建 API 调用封装**

创建 `src/api.ts`：

```typescript
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
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add frontend API wrapper for Tauri commands"
```

---

### Task 9: React 骰子组件

**Files:**
- Create: `src/components/DiceView.tsx`

**Step 1: 创建骰子展示组件**

创建 `src/components/DiceView.tsx`：

```tsx
interface DiceViewProps {
  dice: number[];
  hidden?: boolean;
  label: string;
  count?: number;
}

const dotPositions: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

function Die({ value, hidden }: { value: number; hidden?: boolean }) {
  if (hidden) {
    return (
      <div className="w-14 h-14 bg-gray-600 rounded-lg border-2 border-gray-500 flex items-center justify-center text-gray-400 text-xl font-bold shadow-md">
        ?
      </div>
    );
  }

  const dots = dotPositions[value] || [];
  return (
    <div className="w-14 h-14 bg-white rounded-lg border-2 border-gray-300 relative shadow-md">
      {dots.map(([x, y], i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 bg-gray-800 rounded-full absolute"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}

export default function DiceView({ dice, hidden, label, count }: DiceViewProps) {
  const displayDice = hidden
    ? Array.from({ length: count ?? 0 }, (_, i) => i + 1)
    : dice;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-semibold text-gray-300">{label}</span>
      <div className="flex gap-2 flex-wrap justify-center">
        {displayDice.map((value, index) => (
          <Die key={index} value={value} hidden={hidden} />
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add DiceView component with dot rendering"
```

---

### Task 10: React 叫数面板组件

**Files:**
- Create: `src/components/BidPanel.tsx`

**Step 1: 创建叫数操作面板**

创建 `src/components/BidPanel.tsx`：

```tsx
import { useState } from "react";
import type { Bid } from "../types";

interface BidPanelProps {
  currentBid: Bid | null;
  totalDice: number;
  onBid: (count: number, face: number) => void;
  onChallenge: () => void;
  disabled: boolean;
}

export default function BidPanel({
  currentBid,
  totalDice,
  onBid,
  onChallenge,
  disabled,
}: BidPanelProps) {
  const [count, setCount] = useState(currentBid ? currentBid.count : 1);
  const [face, setFace] = useState(currentBid ? currentBid.face : 1);

  const isValidBid = () => {
    if (face < 1 || face > 6 || count < 1) return false;
    if (!currentBid) return true;
    return (
      count > currentBid.count ||
      (count === currentBid.count && face > currentBid.face)
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-4">
      <div className="text-center text-sm text-gray-400">
        {currentBid
          ? `当前叫数：${currentBid.count} 个 ${currentBid.face} 点`
          : "请开始叫数"}
      </div>

      <div className="flex items-center gap-4 justify-center">
        <div className="flex flex-col items-center gap-1">
          <label className="text-xs text-gray-400">数量</label>
          <div className="flex items-center gap-1">
            <button
              className="w-8 h-8 bg-gray-700 rounded text-white hover:bg-gray-600 disabled:opacity-30"
              onClick={() => setCount((c) => Math.max(1, c - 1))}
              disabled={disabled}
            >
              -
            </button>
            <span className="w-8 text-center text-xl font-bold text-white">
              {count}
            </span>
            <button
              className="w-8 h-8 bg-gray-700 rounded text-white hover:bg-gray-600 disabled:opacity-30"
              onClick={() => setCount((c) => Math.min(totalDice, c + 1))}
              disabled={disabled}
            >
              +
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <label className="text-xs text-gray-400">点数</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map((f) => (
              <button
                key={f}
                className={`w-9 h-9 rounded font-bold text-lg ${
                  face === f
                    ? "bg-amber-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                } disabled:opacity-30`}
                onClick={() => setFace(f)}
                disabled={disabled}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          onClick={() => onBid(count, face)}
          disabled={disabled || !isValidBid()}
        >
          叫数
        </button>
        {currentBid && (
          <button
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            onClick={onChallenge}
            disabled={disabled}
          >
            开！
          </button>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add BidPanel component for player actions"
```

---

### Task 11: React 叫数历史和计分板组件

**Files:**
- Create: `src/components/BidHistory.tsx`
- Create: `src/components/ScoreBoard.tsx`

**Step 1: 创建叫数历史组件**

创建 `src/components/BidHistory.tsx`：

```tsx
import type { Player, Action } from "../types";

interface BidHistoryProps {
  history: [Player, Action][];
}

export default function BidHistory({ history }: BidHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 max-h-40 overflow-y-auto">
      <div className="text-xs text-gray-400 mb-2">叫数记录</div>
      <div className="flex flex-col gap-1">
        {history.map(([player, action], index) => {
          const isHuman = player === "Human";
          const label = isHuman ? "你" : "AI";
          const text =
            action === "Challenge"
              ? "开！"
              : `叫 ${action.Bid.count} 个 ${action.Bid.face} 点`;

          return (
            <div
              key={index}
              className={`text-sm px-2 py-1 rounded ${
                isHuman
                  ? "text-blue-300 bg-blue-900/30"
                  : "text-red-300 bg-red-900/30"
              }`}
            >
              <span className="font-semibold">{label}：</span>
              {text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: 创建计分板组件**

创建 `src/components/ScoreBoard.tsx`：

```tsx
interface ScoreBoardProps {
  humanDice: number;
  aiDice: number;
}

export default function ScoreBoard({ humanDice, aiDice }: ScoreBoardProps) {
  return (
    <div className="flex justify-between items-center px-4 py-2 bg-gray-800/50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-blue-400 font-semibold">你</span>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < humanDice ? "bg-blue-400" : "bg-gray-600"
              }`}
            />
          ))}
        </div>
      </div>
      <span className="text-gray-500 text-sm">VS</span>
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < aiDice ? "bg-red-400" : "bg-gray-600"
              }`}
            />
          ))}
        </div>
        <span className="text-red-400 font-semibold">AI</span>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add BidHistory and ScoreBoard components"
```

---

### Task 12: React 结果弹窗组件

**Files:**
- Create: `src/components/ResultModal.tsx`

**Step 1: 创建结果弹窗**

创建 `src/components/ResultModal.tsx`：

```tsx
import type { RoundResult, Player } from "../types";
import DiceView from "./DiceView";

interface ResultModalProps {
  result: RoundResult | null;
  gameOver: { winner: Player } | null;
  onNextRound: () => void;
  onNewGame: () => void;
}

export default function ResultModal({
  result,
  gameOver,
  onNextRound,
  onNewGame,
}: ResultModalProps) {
  if (!result && !gameOver) return null;

  const isGameOver = gameOver !== null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        {isGameOver ? (
          <>
            <h2 className="text-2xl font-bold text-center mb-4">
              {gameOver!.winner === "Human" ? (
                <span className="text-amber-400">你赢了！</span>
              ) : (
                <span className="text-gray-400">AI 获胜</span>
              )}
            </h2>
            <button
              className="w-full py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-400 transition-colors"
              onClick={onNewGame}
            >
              再来一局
            </button>
          </>
        ) : (
          result && (
            <>
              <h2 className="text-xl font-bold text-center mb-2">
                {result.winner === "Human" ? (
                  <span className="text-green-400">你赢了这轮！</span>
                ) : (
                  <span className="text-red-400">AI 赢了这轮</span>
                )}
              </h2>

              <div className="text-center text-sm text-gray-400 mb-4">
                叫数：{result.last_bid.count} 个 {result.last_bid.face} 点
                <br />
                实际：{result.actual_count} 个 {result.last_bid.face} 点
              </div>

              <div className="flex flex-col gap-3 mb-4">
                <DiceView dice={result.human_dice} label="你的骰子" />
                <DiceView dice={result.ai_dice} label="AI 的骰子" />
              </div>

              <button
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 transition-colors"
                onClick={onNextRound}
              >
                下一轮
              </button>
            </>
          )
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add ResultModal component"
```

---

### Task 13: React 主游戏界面

**Files:**
- Create: `src/components/GameBoard.tsx`
- Modify: `src/App.tsx` (替换默认内容)
- Modify: `src/index.css` (全局样式)

**Step 1: 创建主游戏界面**

创建 `src/components/GameBoard.tsx`：

```tsx
import { useState, useEffect, useCallback } from "react";
import type { GameView, RoundResult, Player } from "../types";
import { startGame, playerBid, playerChallenge, nextRound } from "../api";
import DiceView from "./DiceView";
import BidPanel from "./BidPanel";
import BidHistory from "./BidHistory";
import ScoreBoard from "./ScoreBoard";
import ResultModal from "./ResultModal";

export default function GameBoard() {
  const [gameView, setGameView] = useState<GameView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStartGame = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const view = await startGame();
      setGameView(view);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    handleStartGame();
  }, [handleStartGame]);

  const handleBid = async (count: number, face: number) => {
    try {
      setLoading(true);
      setError(null);
      const view = await playerBid(count, face);
      setGameView(view);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleChallenge = async () => {
    try {
      setLoading(true);
      setError(null);
      const view = await playerChallenge();
      setGameView(view);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleNextRound = async () => {
    try {
      setLoading(true);
      setError(null);
      const view = await nextRound();
      setGameView(view);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  if (!gameView) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        加载中...
      </div>
    );
  }

  // 解析游戏阶段
  let roundResult: RoundResult | null = null;
  let gameOverWinner: { winner: Player } | null = null;
  let isPlayerTurn = false;

  if (typeof gameView.phase === "string") {
    isPlayerTurn = gameView.phase === "PlayerTurn";
  } else if ("RoundOver" in gameView.phase) {
    roundResult = gameView.phase.RoundOver;
  } else if ("GameOver" in gameView.phase) {
    gameOverWinner = gameView.phase.GameOver;
  }

  const totalDice = gameView.human_dice_count + gameView.ai_dice_count;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* 标题 */}
      <header className="text-center py-4">
        <h1 className="text-2xl font-bold text-amber-400">大话骰</h1>
      </header>

      {/* 计分板 */}
      <div className="px-4">
        <ScoreBoard
          humanDice={gameView.human_dice_count}
          aiDice={gameView.ai_dice_count}
        />
      </div>

      {/* 游戏区域 */}
      <div className="flex-1 flex flex-col justify-center gap-6 px-4 py-4">
        {/* AI 骰子（隐藏） */}
        <DiceView
          dice={[]}
          hidden
          count={gameView.ai_dice_count}
          label="AI 的骰子"
        />

        {/* 叫数历史 */}
        <BidHistory history={gameView.bid_history} />

        {/* 玩家骰子 */}
        <DiceView dice={gameView.human_dice} label="你的骰子" />
      </div>

      {/* 操作面板 */}
      <div className="px-4 pb-4">
        {error && (
          <div className="text-red-400 text-sm text-center mb-2">{error}</div>
        )}
        <BidPanel
          currentBid={gameView.current_bid}
          totalDice={totalDice}
          onBid={handleBid}
          onChallenge={handleChallenge}
          disabled={!isPlayerTurn || loading}
        />
      </div>

      {/* 结果弹窗 */}
      <ResultModal
        result={roundResult}
        gameOver={gameOverWinner}
        onNextRound={handleNextRound}
        onNewGame={handleStartGame}
      />
    </div>
  );
}
```

**Step 2: 替换 App.tsx**

替换 `src/App.tsx`：

```tsx
import GameBoard from "./components/GameBoard";

export default function App() {
  return <GameBoard />;
}
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add GameBoard and wire up App component"
```

---

### Task 14: 清理和集成验证

**Files:**
- Delete: `src/App.css` (不再需要)
- Modify: `src-tauri/tauri.conf.json` (修改窗口标题和大小)

**Step 1: 清理无用文件**

删除 `src/App.css` 和其他默认模板文件（如 `src/assets/`）。

**Step 2: 配置 Tauri 窗口**

修改 `src-tauri/tauri.conf.json` 中的窗口配置：
- title: "大话骰"
- width: 420
- height: 720
- resizable: true

**Step 3: 完整运行测试**

```bash
cd src-tauri && cargo test
```

Expected: 所有 Rust 测试通过。

**Step 4: 启动应用验证**

```bash
pnpm tauri dev
```

Expected: 应用正常启动，可以玩完整的大话骰游戏。

**Step 5: Commit**

```bash
git add .
git commit -m "feat: finalize game UI, clean up, configure window"
```

---

## 任务依赖关系

```
Task 1 (脚手架)
  → Task 2 (Tailwind)
  → Task 3 (Rust 类型) → Task 4 (引擎) → Task 5 (AI) → Task 6 (Commands)
  → Task 7 (TS 类型) → Task 8 (API) → Task 9-12 (组件) → Task 13 (GameBoard) → Task 14 (集成)
```

Task 3-6 (Rust) 和 Task 7-8 (TS 类型/API) 可以并行。
