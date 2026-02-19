[English](README-EN.md) | 中文

# 大话骰 (Liar's Dice)

一个基于 Tauri v2 的桌面大话骰游戏，玩家与智能 AI 进行 1v1 对战。

## 游戏简介

大话骰是一款经典的骰子博弈游戏。玩家与 AI 各持 5 颗骰子，通过叫数和开牌进行心理博弈，目标是让对手输光所有骰子。

## 游戏规则

- 两名玩家各 5 颗骰子（6 面）
- 每轮开始，双方摇骰，只能看到自己的骰子
- 轮流叫数：声称「所有骰子中至少有 X 个 Y 点」
- 后手必须加注（提高数量或点数）或选择「开」
  - 加注规则：数量更大，或数量相同但点数更大
- 「开」时揭示所有骰子：
  - 实际数量 >= 叫数 → 叫的人赢（开的人输）
  - 实际数量 < 叫数 → 开的人赢（叫的人输）
- 输的人扣 1 颗骰子，骰子扣完则游戏结束

## 技术栈

- **后端**: Rust (Tauri v2) — 游戏引擎、AI 决策、规则判定
- **前端**: React + TypeScript + Vite — UI 渲染、用户交互
- **样式**: Tailwind CSS

## 项目结构

```
├── src/                    # React 前端源码
│   ├── components/         # UI 组件
│   │   ├── GameBoard.tsx   # 主游戏界面
│   │   ├── DiceView.tsx    # 骰子展示
│   │   ├── BidPanel.tsx    # 叫数操作面板
│   │   ├── BidHistory.tsx  # 叫数记录
│   │   ├── ScoreBoard.tsx  # 剩余骰子数
│   │   └── ResultModal.tsx # 结果展示
│   ├── api.ts              # Tauri API 封装
│   ├── types.ts            # TypeScript 类型定义
│   └── App.tsx             # 应用入口
├── src-tauri/              # Rust 后端源码
│   └── src/
│       ├── game/           # 游戏逻辑模块
│       │   ├── types.rs    # 游戏类型定义
│       │   ├── engine.rs   # 游戏引擎
│       │   └── ai.rs       # AI 决策引擎
│       ├── commands.rs     # Tauri 命令
│       └── lib.rs          # 应用入口
└── docs/                   # 文档
    └── plans/              # 设计与计划文档
```

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

## AI 策略

AI 基于概率推理进行决策：

- AI 知道自己的骰子
- 对手骰子视为均匀分布（每面 1/6）
- 用二项分布计算「至少 X 个 Y 点」的概率
- 概率高于阈值 → 加注；低于阈值 → 开

## 开发指南

### 环境要求

- Node.js 18+
- pnpm
- Rust (通过 rustup 安装)
- Tauri CLI v2

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm tauri dev
```

### 运行测试

```bash
cd src-tauri && cargo test
```

### 构建发布

```bash
pnpm tauri build
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## License

MIT
