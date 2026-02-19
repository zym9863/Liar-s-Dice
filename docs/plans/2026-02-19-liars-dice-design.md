# 大话骰 (Liar's Dice) — 设计文档

## 概述

一个基于 Tauri v2 的大话骰桌面游戏，玩家与智能 AI 进行 1v1 对战。

## 技术栈

- **后端**: Rust (Tauri v2) — 游戏引擎、AI 决策、规则判定
- **前端**: React + TypeScript + Vite — UI 渲染、用户交互
- **样式**: Tailwind CSS

## 游戏规则（简化版）

- 两名玩家各 5 颗骰子（6 面）
- 每轮开始，双方摇骰，只能看到自己的骰子
- 轮流叫数：声称「所有骰子中至少有 X 个 Y 点」
- 后手必须加注（提高数量或点数）或选择「开」
  - 加注规则：数量更大，或数量相同但点数更大
- 「开」时揭示所有骰子：
  - 实际数量 >= 叫数 → 叫的人赢（开的人输）
  - 实际数量 < 叫数 → 开的人赢（叫的人输）
- 输的人扣 1 颗骰子，骰子扣完则游戏结束

## 架构

```
┌──────────────────────────────────┐
│         React Frontend           │
│  GameBoard / DiceView / BidPanel │
│              │ invoke()          │
├──────────────┼───────────────────┤
│         Tauri Commands           │
├──────────────┼───────────────────┤
│         Rust Backend             │
│  GameEngine / AI Engine / Judge  │
└──────────────────────────────────┘
```

### Rust 后端模块

- **GameEngine**: 管理游戏状态（骰子、回合、分数）
- **AI Engine**: 基于概率推理的 AI 决策
- **Rule Judge**: 判定胜负，执行扣骰子逻辑

### Tauri Commands

- `start_game()` → 初始化游戏，掷骰
- `player_bid(count, face)` → 玩家叫数
- `player_challenge()` → 玩家选择开
- `get_game_state()` → 获取当前可见的游戏状态

### 前端组件

- **GameBoard**: 主界面容器
- **DiceView**: 骰子展示（自己可见，对手隐藏）
- **BidPanel**: 叫数操作面板
- **BidHistory**: 叫数记录
- **ResultModal**: 结果展示
- **ScoreBoard**: 剩余骰子数

## AI 策略

基于概率推理：
- AI 知道自己的骰子
- 对手骰子视为均匀分布（每面 1/6）
- 用二项分布计算「至少 X 个 Y 点」的概率
- 概率高于阈值 → 加注；低于阈值 → 开

## 数据流

1. 玩家叫数 → `invoke("player_bid")` → Rust 记录 → AI 决策 → 返回 AI 动作
2. 玩家开 → `invoke("player_challenge")` → 揭示骰子 → 判定胜负 → 返回结果
3. AI 开 → Rust 自动判定 → 返回结果
